//https://www.npmjs.com/package/discord-ytdl-core

const ytdl = require("discord-ytdl-core");

const {
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');

const {Song} = require("../playlist/song");
const {GuildPlayer} = require("../playlist/player");

const InfoCenter = require("../infoCenter/infoCenter");
const Utils = require("../utils/utils");

const YouTube = require("youtube-sr").default;

let guildPlayers = new Map();

class Command {

    static parse(message, client) {
        if ( this.match(message) ) {
            this.action(message, client);
            return true;
        }
        return false;
    }

    static match(message) {
        return false;
    }

    static action(message, client) {
    }

}

class Cmd_help extends Command {

    static match(message) {
        return message.content.startsWith("!help");
    }

    static action(message, client) {
        message.channel.send(
        "Pas de souce j'vais t'aider :\n\
        !help pour de l'aide\n\
        !join pour que je vienne :)\n\
        !leave pour que je pars :(\n\
        !play pour écouter une douce musique\n\
        !pause pour mettre en pause\n\
        !unpause pour enlever la pause\n\
        !shuffle pour randomiser la liste de lecture\n\
        !stop pour enlever toutes les musiques\n\
        !skip pour skip la musique actuelle");
    }
}

class Cmd_join extends Command {

    static match(message) {
        return message.content.startsWith("!join");
    }

    static action(message, client) {
        if ( guildPlayers.has(message.member.voice.channel.guild.id) ) {
            guildPlayers.get(message.member.voice.channel.guild.id).playAudioFile("./presentation.ogg");
        } else {
            InfoCenter.InfoCenter.getInfoMessage(message.channel)
                .then((infoMsg) => {

                    // Bot is not connected to a audio channel
                    let connection = joinVoiceChannel({
                        channelId: message.member.voice.channel.id,
                        guildId: message.member.guild.id,
                        adapterCreator: message.member.guild.voiceAdapterCreator,
                        selfDeaf: false,
                    });

                    console.log("joining : ", message.member.voice.channel.guild.id);

                    guildPlayers.set(message.member.voice.channel.guild.id, new GuildPlayer(connection, infoMsg));
                    guildPlayers.get(message.member.voice.channel.guild.id).playAudioFile("./presentation.ogg");
                })
                .catch(err => console.log(err));
        }
    }
}

class Cmd_play extends Command {

    static match(message) {
        return message.content.startsWith("!play");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je ne suis pas connecter petit chef, fais la commande !join !");
        }

        let args = message.content.split(' ');

        if (args.length < 2) {
            return message.channel.send("Manque le lien petit chef !");
        }

        args.shift();
        let arg = args.join(" ");

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);

        if (Utils.isYoutubePlaylistUrl(arg)) {
            YouTube.getPlaylist(arg)
            .then((res) => {
                if (res.videos) {
                    if (res.videos.length > 0) {
                        message.channel.send("Playlist : "+res.title+"\nnombre de vidéo/musique : "+res.videos.length);

                        for (let i=0; i<res.videos.length; i++) {
                            let song = new Song();
                            song.fetch(res.videos[i].url, message.author.username).then(() => guildPlayer.pushSound(song, false) )
                                .catch((err) => message.channel.send("Petit souci chef, je ne peux pas mettre la musique "+i+" !"));
                        }
                        setTimeout(function() { guildPlayer.updateInfoMessage(); }, 6000);
                    }
                }
            })
            .catch(err => message.channel.send("Petit souci chef, je ne peux pas mettre cette playlist !\n"+err));
        } else {
            let song = new Song();
            song.fetch(arg, message.author.username).then(() => guildPlayer.pushSound(song) )
                .catch((err) => message.channel.send("Petit souci chef, je ne peux pas mettre cette musique !\n"+err));
        }
    }

}

class Cmd_leave extends Command {

    static match(message) {
        return message.content.startsWith("!leave");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.disconnect();

        guildPlayers.delete(message.member.voice.channel.guild.id);

        console.log("leaving here : ", message.member.voice.channel.guild.id);
    }

}

class Cmd_stop extends Command {

    static match(message) {
        return message.content.startsWith("!stop");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.stop();
    }

}

class Cmd_skip extends Command {

    static match(message) {
        return message.content.startsWith("!skip") || message.content.startsWith("!next");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.skip();
    }

}

class Cmd_pause extends Command {

    static match(message) {
        return message.content.startsWith("!pause");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.pause();
    }

}

class Cmd_unpause extends Command {

    static match(message) {
        return message.content.startsWith("!unpause");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.pause(false);
    }

}

class Cmd_shuffle extends Command {

    static match(message) {
        return message.content.startsWith("!shuffle");
    }

    static action(message, client) {
        if ( !guildPlayers.has(message.member.voice.channel.guild.id) ) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = guildPlayers.get(message.member.voice.channel.guild.id);
        guildPlayer.shuffle();
    }

}

module.exports = {
    Command : Command,
    Cmd_help : Cmd_help,
    Cmd_join : Cmd_join,
    Cmd_leave : Cmd_leave,
    Cmd_play : Cmd_play,
    Cmd_stop : Cmd_stop,
    Cmd_skip : Cmd_skip,
    Cmd_pause : Cmd_pause,
    Cmd_unpause : Cmd_unpause,
    Cmd_shuffle : Cmd_shuffle,
    guildPlayers : guildPlayers
}