const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Pour que Gaspard skip la musique actuelle'),
	async execute(interaction) {
        const guildId = interaction.guildId;

        if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return interaction.reply("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = interaction.client.guildPlayers.get(guildId);
        guildPlayer.skip();

        await interaction.reply("C'est fait petit chef !");
	},
}