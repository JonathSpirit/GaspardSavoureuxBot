const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('playafter')
		.setDescription('Joue une musique avec un lien/mots clés juste après')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Un lien ou des mots clés')
                .setRequired(true)),
	async execute(interaction) {
        const guildId = interaction.guildId;

		if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return await interaction.reply("Je ne suis pas connecter petit chef, fais la commande /join !");
        }

        const inputArg = interaction.options.getString("input") ?? "";

        if (inputArg.length < 1) {
            return await interaction.reply("Manque le lien petit chef !");
        }

        let guildPlayer = interaction.client.guildPlayers.get(guildId);
        const interactionAuthor = interaction.user.username;

        await interaction.deferReply();
        await guildPlayer.parseSoundString(inputArg, interactionAuthor, (err) => {
            interaction.followUp(err);
        }, (song) => {
            guildPlayer.pushSoundAfter(song, interactionAuthor);
        })
        .then((info) => {
            if (info instanceof Array){
                interaction.editReply("Playlist : "+info[0]+"\nnombre de vidéo/musique : "+info[1]);
            }else{
                interaction.editReply("Ajout de \""+info+"\" !");
            }
        })
        .catch((err) => {interaction.editReply("Petit souci chef, je ne peux pas mettre cette musique !\n"+err)})
	},
}