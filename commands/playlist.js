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
                .setDescription('Joue une musique aléatoire dans ta playlist')
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set un fichier txt contenant des titres de musiques')
                .addAttachmentOption(option => 
                    option.setName('file')
                        .setDescription('Fichier txt')
                        .setRequired(true))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste les musiques de ta playlist')
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retire une musique de ta playlist')
                .addIntegerOption(option => 
                    option.setName('index')
                        .setDescription('Index de la musique')
                        .setRequired(true))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajout une musique dans ta playlist')
                .addStringOption(option => 
                    option.setName('url')
                        .setDescription('URL/titre/mots clés de la musique')
                        .setRequired(true))
            ),
	async execute(interaction) {
        const guildId = interaction.guildId;

		if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return await interaction.reply({ content: "Je ne suis pas connecter petit chef, fais la commande /join !", ephemeral: true });
        }

        const userId = interaction.user.id;
        const subCmd = interaction.options.getSubcommand();

        let playlist = new Playlist(userId);
        if (!playlist.exist())
        {
            if (!playlist.create())
            {
                console.error("Can't create playlist !");
                return await interaction.reply({ content: "Petit souci chef, je ne peux pas charger la playlist !", ephemeral: true });
            }
            console.log("Playlist "+userId+" created !");
        }
        else
        {
            if (!await playlist.load())
            {
                console.error("Can't load playlist !");
                return await interaction.reply({ content: "Petit souci chef, je ne peux pas charger la playlist !", ephemeral: true });
            }
            console.log("Playlist "+userId+" loaded !");
        }

        if (subCmd === "play") {
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
            .catch((err) => {interaction.editReply({ content: "Petit souci chef, je ne peux pas mettre cette musique !\n"+err, ephemeral: true })})
        }
        else if (subCmd === "set") {
            const file = interaction.options.getAttachment("file");
            if (!file) {
                return await interaction.reply({content: "Manque le fichier petit chef !", ephemeral: true });
            }

            const fileData = await fetch(file.attachment)
            const fileBuffer = await fileData.text()
            const fileString = fileBuffer.toString();

            playlist.playlistData = [];

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
                return await interaction.reply({content: "Petit souci chef, je ne peux pas sauvegarder la playlist !", ephemeral: true });
            }

            return await interaction.reply({content: "Playlist sauvegardée !", ephemeral: true });
        }
        else if (subCmd === "add") {
            const url = interaction.options.getString("url");
            if (!url) {
                return await interaction.reply({content: "Manque l'url/titre/mots clés de la musique petit chef !", ephemeral: true });
            }

            playlist.playlistData.push(url);
            console.log("Pushing "+url+" to playlist "+userId);

            if (!playlist.save()) {
                return await interaction.reply({ content: "Petit souci chef, je ne peux pas sauvegarder la playlist !", ephemeral: true });
            }

            return await interaction.reply({ content: "Musique ajoutée !", ephemeral: true });
        }
        else if (subCmd === "list") {
            let list = "";
            for (let i=0; i<playlist.playlistData.length; i++) {
                list += i+" : "+playlist.playlistData[i]+"\n";
            }

            return await interaction.reply({content: "Playlist : \n"+list, ephemeral: true });
        }
        else if (subCmd === "remove") {
            const index = interaction.options.getInteger("index");
            if (!index) {
                return await interaction.reply({content: "Manque l'index de la musique petit chef !", ephemeral: true });
            }

            if (index >= playlist.playlistData.length) {
                return await interaction.reply({content: "Index invalide petit chef !", ephemeral: true });
            }

            playlist.playlistData.splice(index, 1);

            if (!playlist.save()) {
                return await interaction.reply({ content: "Petit souci chef, je ne peux pas sauvegarder la playlist !", ephemeral: true });
            }

            return await interaction.reply({content: "Musique retirée !", ephemeral: true });
        }
	},
}