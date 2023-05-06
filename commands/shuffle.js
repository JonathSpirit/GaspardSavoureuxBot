const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Pour que Gaspard mélange les musiques dans la liste'),
	async execute(interaction) {
        const guildId = interaction.guildId;

        if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return interaction.reply("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = interaction.client.guildPlayers.get(guildId);
        guildPlayer.shuffle();

        await interaction.reply("C'est fait petit chef !");
	},
}