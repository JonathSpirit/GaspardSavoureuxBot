const {
    SlashCommandBuilder 
} = require('discord.js');

const {Playlist} = require("../playlist/playlist");
const play = require('./play');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('playlist')
		.setDescription('Joue/Configure une playlist')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Joue une musique aléatoire dans la playlist')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set un fichier txt contenant des titres de musiques')
                .addAttachmentOption(option => 
                    option.setName('file')
                        .setDescription('Fichier txt')
                        .setRequired(true)
                )
        ),
	async execute(interaction) {
        const guildId = interaction.guildId;

		if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return await interaction.reply("Je ne suis pas connecter petit chef, fais la commande /join !");
        }

        const userId = interaction.user.id;
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === "play") {
            //Create file
            let playlist = new Playlist(userId);
            if (!playlist.create())
            {
                if (!await playlist.load())
                {
                    console.error("Can't create or load playlist !");
                    return await interaction.reply("Petit souci chef, je ne peux pas charger la playlist !");
                }
                console.log("Playlist "+userId+" loaded !");
            }

            const inputArg = playlist.playlistData[Math.floor(Math.random() * playlist.playlistData.length)];

            let guildPlayer = interaction.client.guildPlayers.get(guildId);
            const interactionAuthor = interaction.user.username;
    
            await interaction.deferReply();
            await guildPlayer.parseSoundString(inputArg, interactionAuthor, (err) => {
                interaction.followUp(err);
            }, (song) => {
                guildPlayer.pushSound(song);
            })
            .then((info) => {
                if (info instanceof Array){
                    interaction.editReply("Playlist : "+info[0]+"\nnombre de vidéo/musique : "+info[1]);
                }else{
                    interaction.editReply("Ajout de \""+info+"\" !");
                }
            })
            .catch((err) => {interaction.editReply("Petit souci chef, je ne peux pas mettre cette musique !\n"+err)})
        }
        else if (subCmd === "set") {
            const file = interaction.options.getAttachment("file");
            if (!file) {
                return await interaction.reply("Manque le fichier petit chef !");
            }

            let playlist = new Playlist(userId);
            if (!playlist.exist())
            {
                if (!playlist.create())
                {
                    console.error("Can't create or load playlist !");
                    return await interaction.reply("Petit souci chef, je ne peux pas charger la playlist !");
                }
            }

            const fileData = await fetch(file.attachment)
            const fileBuffer = await fileData.text()
            const fileString = fileBuffer.toString();

            const lines = fileString.split(/\r?\n/);
            console.log("lines : "+lines.length);
            for (let i=0; i<lines.length; i++) {
                if (lines[i].length < 1) {
                    console.log("line "+i+" : empty");
                    continue;
                }
                console.log("line "+i+" : "+lines[i]);
                playlist.playlistData.push(lines[i]);
            }

            if (!playlist.save()) {
                return await interaction.reply("Petit souci chef, je ne peux pas sauvegarder la playlist !");
            }

            return await interaction.reply("Playlist sauvegardée !");
        }
	},
}