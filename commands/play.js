const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Joue une musique avec un lien/mots clés')
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

        guildPlayer.parseSoundString(inputArg, interactionAuthor, interaction);
	},
}