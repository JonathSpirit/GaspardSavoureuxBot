const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayerStatus
} = require('@discordjs/voice');

const {
    MessageEditOptions,
    EmbedBuilder
} = require('discord.js');

const ytdl = require("discord-ytdl-core");

const Utils = require("../utils/utils");

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
            highWaterMark: 1 << 25,
            opusEncoded: true,
            filter: 'audioonly',
        }).on('error', (err) => console.error("ytdl stream error : ", err));
        
        if (stream.readable) {
            const resource = createAudioResource(stream, { inputType: StreamType.Opus });
            this.player.play(resource);
        }
        return stream.readable;
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
                });
            } else {
                if (doUpdateInfoMessage) {
                    await this.updateInfoMessage();
                }
            }
        } else {
            console.log("not a valid song !");
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