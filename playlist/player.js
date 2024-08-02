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

const ytdl = require("@distube/ytdl-core");
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
        if (!song.valid) {
            console.log("not a valid song !");
            return;
        }

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
    }
    async pushSoundAfter(song, username, doUpdateInfoMessage=true) {
        if (!song.valid) {
            console.log("not a valid song !");
            return;
        }

        if (this.playerQueue.length <= 1) {
            this.pushSound(song, doUpdateInfoMessage);
            return;
        }

        console.log("pushing after: "+song.title+" username: "+username);
        
        let songPushed = false;
        for (let i=0; i<this.playerQueue.length; i++) {
            if (this.playerQueue[i].initiator === username) {
                continue;
            }
            if (this.playerQueue[i+1] && this.playerQueue[i+1].initiator === username) {
                continue;
            }
            this.playerQueue.splice(i+1, 0, song);
            songPushed = true;
            break;
        }
        if (!songPushed) {
            this.playerQueue.push(song);
        }

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
    }

    async parseSoundString(soundString, username, lambdaOnError, lambdaOnNewSong) {
        if (!Utils.isYoutubePlaylistUrl(soundString)) {
            let song = new Song();
            await song.fetch(soundString, username).then(() => lambdaOnNewSong(song))
            return Promise.resolve(song.title);
        }

        let playlist = await YouTube.getPlaylist(soundString, {limit: 100});
        if (playlist && playlist.videos) {
            if (playlist.videos.length > 0) {
                for (let i=0; i<playlist.videos.length; i++) {
                    let song = new Song();
                    song.fetch(playlist.videos[i].url, username)
                        .then(() => lambdaOnNewSong(song))
                        .catch((err) => {
                            if (lambdaOnError) {
                                lambdaOnError("Petit souci chef, je ne peux pas mettre la musique "+i+" !");
                            }
                            console.log(i+" "+err);
                        });
                }
                setTimeout(() => { this.updateInfoMessage(); }, 6000);
                return Promise.resolve([playlist.title, playlist.videos.length]);
            }
        }

        return Promise.reject("Can't parse this string !");
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