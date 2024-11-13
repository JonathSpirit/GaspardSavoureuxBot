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
                .addIntegerOption(option => 
                    option.setName('quantity')
                        .setDescription('Nombre de musique à jouer (1 par défaut)')
                        .setRequired(false))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription("Joue une musique aléatoire d'une playlist aléatoire dans le channel")
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Nombre de musique à jouer (1 par défaut)')
                        .setRequired(false))
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
            const quantity = interaction.options.getInteger("quantity") || 1;
            if (quantity < 1) {
                return await interaction.reply({content: "Nombre de musique invalide petit chef !", ephemeral: true });
            }
            if (playlist.playlistData.length < 1) {
                return await interaction.reply({content: "Playlist vide petit chef !", ephemeral: true });
            }

            let guildPlayer = interaction.client.guildPlayers.get(guildId);
            const interactionAuthor = interaction.user.username;
    
            await interaction.reply("Ajout de "+quantity+" musique(s) aléatoire(s) de la playlist de "+interactionAuthor+" !");

            let randomUniqueIndex = [];
            for (let i=0; i<playlist.playlistData.length; i++) {
                randomUniqueIndex.push(i);
            }
            randomUniqueIndex = randomUniqueIndex.sort(() => Math.random() - 0.5);

            for (let i=0; i<quantity; i++) {
                if (randomUniqueIndex.length < 1) {
                    console.log("Not enough songs in playlist to play !");
                    interaction.editReply("Finalement, ajout de "+i+" musique(s) aléatoire(s) car pas assez de musique dans la playlist !");
                    break;
                }
                const randomIndex = randomUniqueIndex.pop();
                const inputArg = playlist.playlistData[randomIndex];

                await guildPlayer.parseSoundString(inputArg, interactionAuthor, (err) => {
                    interaction.followUp(err);
                }, (song) => {
                    guildPlayer.pushSound(song);
                })
                .then((info) => {
                })
                .catch((err) => {interaction.followUp({ content: "Petit souci chef, je ne peux pas mettre cette musique !\n"+err, ephemeral: true })})
            }
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
        else if (subCmd === "shuffle") {
            const quantity = interaction.options.getInteger("quantity") || 1;
            if (quantity < 1) {
                return await interaction.reply({content: "Nombre de musique invalide petit chef !", ephemeral: true });
            }

            await interaction.deferReply();

            const channel = await interaction.guild.channels.fetch(interaction.channelId, { cache: true, force: false }) ;
            let randomUniqueIndex = [];
            let playlists = [];
            await channel.members.forEach(async member => {
                console.log("Member : "+member.user.id);

                if (member.user.bot) {
                    console.log("Member : "+member.user.id+" is a bot");
                    return;
                }

                let newPlaylist;
                if (playlist.discordClientID === member.user.id) {
                    console.log("Member : "+member.user.id+" is same as transaction author");
                    newPlaylist = playlist;
                }
                else
                {
                    console.log("Member : "+member.user.id+" is another user");
                    newPlaylist = new Playlist(member.user.id);
                    await newPlaylist.load();
                }

                if (newPlaylist.playlistData.length < 1) {
                    return;
                }

                console.log("Pushing playlist from "+member.user.id);
                playlists.push(newPlaylist);
                randomUniqueIndex.push(new Array());
                //Fill randomUniqueIndex with 0 1 2 3 until the number max of playlist.playlistData.length
                for (let i=0; i<newPlaylist.playlistData.length; i++) {
                    randomUniqueIndex[randomUniqueIndex.length-1].push(i);
                }
                //Shuffle the array
                randomUniqueIndex[randomUniqueIndex.length-1] = randomUniqueIndex[randomUniqueIndex.length-1].sort(() => Math.random() - 0.5);
            });
            if (playlists.length < 1) {
                return await interaction.editReply({content: "Pas assez de playlist valide petit chef !", ephemeral: true });
            }

            let guildPlayer = interaction.client.guildPlayers.get(guildId);
            const interactionAuthor = interaction.user.username;

            await interaction.editReply("Ajout de "+quantity+" musique(s) aléatoire(s) de "+playlists.length+" playlist(s) !");

            for (let i=0; i<quantity; i++) {
                const randomPlaylistIndex = Math.floor(Math.random() * playlists.length);
                const randomPlaylist = playlists[randomPlaylistIndex];
                const randomIndex = randomUniqueIndex[randomPlaylistIndex].pop();

                const inputArg = randomPlaylist.playlistData[randomIndex];

                console.log("Pushing "+inputArg+" from "+randomPlaylist.discordClientID);
                await guildPlayer.parseSoundString(inputArg, interactionAuthor, (err) => {
                    interaction.followUp(err);
                }, (song) => {
                    guildPlayer.pushSound(song);
                })
                .then((info) => {
                })
                .catch((err) => {interaction.followUp({ content: "Petit souci chef, je ne peux pas mettre cette musique !\n"+err, ephemeral: true })})

                if (randomUniqueIndex[randomPlaylistIndex].length < 1) {
                    playlists.splice(randomPlaylistIndex, 1);
                    randomUniqueIndex.splice(randomPlaylistIndex, 1);
                    if (playlists.length < 1) {
                        console.log("Not enough songs in playlist to play !");
                        interaction.editReply("Finalement, ajout de "+i+" musique(s) aléatoire(s) car pas assez de musique dans les playlists !");
                        break;
                    }
                }
            }
        }
	},
}