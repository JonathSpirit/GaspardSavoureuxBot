const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Pour le lien vers le Git'),
	async execute(interaction) {
        return await interaction.reply("https://github.com/JonathSpirit/GaspardSavoureuxBot");
	},
}