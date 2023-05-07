const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const {
    MessageEditOptions,
    EmbedBuilder
} = require('discord.js');

const ytdl = require("ytdl-core");
const prism = require('prism-media');

const {Song} = require("../playlist/song");
const Utils = require("../utils/utils");

const YouTube = require("youtube-sr").default;

class GuildPlayer {

    playerQueue;
    player;
    infoMessagePinned;
    voiceConnection;

    constructor(connection, infoMessage) {
        this.playerQueue = [];
        this.player = createAudioPlayer();
        this.infoMessagePinned = infoMessage;
        this.voiceConnection = connection;

        //BEGIN
        //This is a workaround temporary fix for this "BIG" issue :
        //https://github.com/discordjs/discord.js/issues/9185
        /*this.voiceConnection.on('stateChange', async (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');

            const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
                const newUdp = Reflect.get(newNetworkState, 'udp');
                clearInterval(newUdp?.keepAliveInterval);
            }

            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });*/
        //END

        this.voiceConnection.subscribe(this.player);

        this.player.on('error', (err) => {
            console.error(`Error: ${err.message}`);
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });
        
        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log('The audio player has started idle!');

            if (this.playerQueue.length > 0) {
                this.playerQueue.shift();
            }
    
            if (this.playerQueue.length > 0) {
                this.playAudioYoutubeUrl(this.playerQueue[0].youtubeUrl).then(() => this.updateInfoMessage());
            } else {
                this.updateInfoMessage();
            }
        });
    }

    disconnect() {
        this.playerQueue = [];
        this.player.stop(true);

        this.voiceConnection.disconnect();
        this.voiceConnection.destroy();
    }

    stop() {
        this.playerQueue = [];
        this.player.stop(true);
    }

    pause(state=true) {
        if (state) {
            this.player.pause();
        } else {
            this.player.unpause();
        }
    }

    shuffle() {
        Utils.shuffleArray(this.playerQueue);
        this.updateInfoMessage();
    }

    skip() {
        this.player.stop(true);
    }

    async playAudioFile(filePath) {
        const audio = createAudioResource(filePath);
        this.player.play(audio);
    }
    
    async playAudioYoutubeUrl(youtubeUrl) {
        var stream = await ytdl(youtubeUrl, {
            quality: "highestaudio",
            filter: "audioonly",
            highWaterMark: 1 << 25,
        });

        const FFmpegArgs = [
            '-analyzeduration',
            '0',
            '-loglevel',
            '0',
            '-f',
            's16le',
            '-ar',
            '48000',
            '-ac',
            '2',
        ];

        const transcoder = new prism.FFmpeg({
            args: FFmpegArgs,
            shell: false,
        });

        const opus = new prism.opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960
        });

        const outputStream = stream.pipe(transcoder).pipe(opus);

        stream.on('error', (err) => {
            console.error("ytdl stream error : ", err);
            opus.destroy();
            stream.destroy();
            transcoder.destroy();
        });

        opus.on('error', (err) => {
            console.error("opus stream error : ", err);
            opus.destroy();
            stream.destroy();
            transcoder.destroy();
        });

        outputStream.on('error', (err) => {
            console.error("stream error : ", err);
            opus.destroy();
            stream.destroy();
            transcoder.destroy();
        });

        outputStream.on('close', () => {
            opus.destroy();
            stream.destroy();
            transcoder.destroy();
        });
        
        if (outputStream.readable) {
            const resource = createAudioResource(outputStream, { inputType: StreamType.Opus });
            this.player.play(resource);
        }
        return outputStream.readable;
    }

    async pushSound(song, doUpdateInfoMessage=true) {
        if (song.valid) {
            console.log("pushing: "+song.title);
            this.playerQueue.push(song);
    
            if (this.player.state.status == 'idle') {
                await this.playAudioYoutubeUrl(song.youtubeUrl).then(() => {
                    if (doUpdateInfoMessage) {
                        this.updateInfoMessage();
                    }
                }).catch((err) => console.log(err));
            } else {
                if (doUpdateInfoMessage) {
                    await this.updateInfoMessage();
                }
            }
        } else {
            console.log("not a valid song !");
        }
    }

    async parseSoundString(soundString, username, interaction) {
        if (Utils.isYoutubePlaylistUrl(soundString)) {
            YouTube.getPlaylist(soundString)
            .then((res) => {
                if (res.videos) {
                    if (res.videos.length > 0) {
                        if (interaction != null) {
                            interaction.reply("Playlist : "+res.title+"\nnombre de vidéo/musique : "+res.videos.length);
                        }

                        for (let i=0; i<res.videos.length; i++) {
                            let song = new Song();
                            song.fetch(res.videos[i].url, username).then(() => this.pushSound(song, false) )
                                .catch((err) => {
                                    if (interaction != null) {
                                        interaction.channel.send("Petit souci chef, je ne peux pas mettre la musique "+i+" !");
                                    }
                                });
                        }
                        setTimeout(() => { this.updateInfoMessage(); }, 6000);
                    }
                }
            })
            .catch(err => {
                if (interaction != null) {
                    interaction.reply("Petit souci chef, je ne peux pas mettre cette playlist !\n"+err);
                }
            });
        } else {
            let song = new Song();
            song.fetch(soundString, username).then(() => {
                this.pushSound(song);
                if (interaction != null) {
                    interaction.reply("Ajout de \""+song.title+"\" !");
                }
            })
            .catch((err) => {
                if (interaction != null) {
                    interaction.reply("Petit souci chef, je ne peux pas mettre cette musique !\n"+err);
                }
            });
        }
    }

    async updateInfoMessage() {
        let dataEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Liste des musiques');
        
        if (this.playerQueue.length == 0) {
            dataEmbed.addFields({name: "aucune musique est jouée !", value: "!play <URL> ou <MOT CLES>"});
        } else {
            this.playerQueue.every((song, index) => {
                if (index == 0) {
                    dataEmbed.addFields({name: "musique actuel, [par "+song.initiator+"] :",
                        value: '['+song.title+']('+song.youtubeUrl+')' + ' - ' + song.artist + ' - (' + song.length + ')'});
                }
                else if (index > 6) {
                    dataEmbed.addFields({name: "encore "+(this.playerQueue.length-index)+" musiques en attente ...",
                        value: 'patience petit chef !'});
                    return false;
                } else {
                    dataEmbed.addFields({name: "musique suivante "+index+", [par "+song.initiator+"] :",
                        value: '['+song.title+']('+song.youtubeUrl+')' + ' - ' + song.artist + ' - (' + song.length + ')'});
                }
                return true;
            });
        }
    
        const dataEmbedArray = [dataEmbed];
        this.infoMessagePinned.edit({embeds: dataEmbedArray})
            .then()
            .catch((err) => console.log(err));
    }
}

module.exports = {
    GuildPlayer : GuildPlayer
}