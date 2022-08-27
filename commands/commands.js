//https://www.npmjs.com/package/discord-ytdl-core

const ytdl = require("discord-ytdl-core");

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

const {Song} = require("../playlist/song");

const InfoCenter = require("../infoCenter/infoCenter");
const Utils = require("../utils/utils");

let playerQueue = [];
let player = createAudioPlayer();
let lastGuildId = null;
let messagePinned = null;

function playAudio(connection, path) {
    try
    {
        const audio = createAudioResource(path);

        player.play(audio);

        return true;

    } catch(err) {
        console.log(err);
        return false;
    }
}

async function playUrlAudio(connection, youtubeUrl) {
    try
    {
        let valid = true;

        var stream = await ytdl(youtubeUrl, {
            highWaterMark: 1 << 25,
            opusEncoded: true,
            filter: 'audioonly',
        })
        .on("error", () => valid=false);

        if (valid)
        {
            const resource = createAudioResource(stream, { inputType: StreamType.Opus });
            player.play(resource);
        }

    } catch(err) {
        return Promise.reject();
    }
}

function updateInfoMessage() {
    let dataEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Liste des musiques');
    
    if (playerQueue.length == 0) {
        dataEmbed.addFields({name: "aucune musique est jouée !", value: "!play <URL> ou <MOT CLES>"});
    } else {
        playerQueue.forEach((song, index) => {
            if (index == 0) {
                dataEmbed.addFields({name: "musique actuel, [par "+song.initiator+"] :",
                    value: '['+song.title+']('+song.youtubeUrl+')' + ' - ' + song.artist + ' - (' + song.length + ')'});
            } else {
                dataEmbed.addFields({name: "musique suivante "+index+", [par "+song.initiator+"] :",
                    value: '['+song.title+']('+song.youtubeUrl+')' + ' - ' + song.artist + ' - (' + song.length + ')'});
            }
        });
    }

    const dataEmbedArray = [dataEmbed];
    messagePinned.edit({embeds: dataEmbedArray})
        .then()
        .catch(err => console.log(err));
}

async function pushSound(connection, song) {
    if (song.valid) {
        console.log("pushing: "+song.title);
        playerQueue.push(song);

        if (player.state.status == 'idle') {
            await playUrlAudio(connection, song.youtubeUrl).then(() => updateInfoMessage());
        } else {
            await updateInfoMessage();
        }
    } else {
        console.log("not a valid song !");
    }
}

player.on(AudioPlayerStatus.Playing, () => {
	console.log('The audio player has started playing!');
});

player.on(AudioPlayerStatus.Idle, () => {
	console.log('The audio player has started idle!');
    let connection = getVoiceConnection(lastGuildId);

    if (connection) {
        if (playerQueue.length > 0) {
            playerQueue.shift();
        }

        if (playerQueue.length > 0) {
            playUrlAudio(connection, playerQueue[0].youtubeUrl).then(() => updateInfoMessage());
        } else {
            updateInfoMessage();
        }
    } else {
        playerQueue = [];
        updateInfoMessage();
    }
});

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
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);
        lastGuildId = message.member.voice.channel.guild.id;

        if (!connection) {
            // Bot is not connected to a audio channel
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.member.guild.id,
                adapterCreator: message.member.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            InfoCenter.InfoCenter.getInfoMessage(message.channel)
                .then((infoMsg) => {
                    messagePinned = infoMsg;
                })
                .catch(err => console.log(err));

            connection.subscribe(player);
        }

        const audioGaspard = createAudioResource('./presentation.ogg');
        player.play(audioGaspard);
    }

}

class Cmd_play extends Command {

    static match(message) {
        return message.content.startsWith("!play");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je ne suis pas connecter petit chef, fais la commande !join !");
        }

        let args = message.content.split(' ');

        if (args.length < 2) {
            return message.channel.send("Manque le lien petit chef !");
        }

        args.shift();
        let arg = args.join(" ");

        let song = new Song();
        song.fetch(arg, message.author.username).then(() => pushSound(connection, song) )
            .catch((err) => console.log(err));
    }

}

class Cmd_leave extends Command {

    static match(message) {
        return message.content.startsWith("!leave");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        playerQueue = [];
        player.stop(true);

        connection.disconnect();
        connection.destroy();
    }

}

class Cmd_stop extends Command {

    static match(message) {
        return message.content.startsWith("!stop");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        playerQueue = [];
        player.stop(true);
    }

}

class Cmd_skip extends Command {

    static match(message) {
        return message.content.startsWith("!skip") || message.content.startsWith("!next");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        player.stop(true);
    }

}

class Cmd_pause extends Command {

    static match(message) {
        return message.content.startsWith("!pause");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        player.pause();
    }

}

class Cmd_unpause extends Command {

    static match(message) {
        return message.content.startsWith("!unpause");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        player.unpause();
    }

}

class Cmd_shuffle extends Command {

    static match(message) {
        return message.content.startsWith("!shuffle");
    }

    static action(message, client) {
        let connection = getVoiceConnection(message.member.voice.channel.guild.id);

        if (!connection) {
            // Bot is not connected to a audio channel
            return message.channel.send("Je suis pas dans un channel petit chef !");
        }

        Utils.shuffleArray(playerQueue);
        updateInfoMessage();
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
    playAudio : playAudio
}