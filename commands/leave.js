const {
    SlashCommandBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Pour que Gaspard part :('),
	async execute(interaction) {
        const guildId = interaction.guildId;

		if ( !interaction.client.guildPlayers.has(guildId) ) {
            // Bot is not connected to a audio channel
            return await interaction.reply("Je suis pas dans un channel petit chef !");
        }

        let guildPlayer = interaction.client.guildPlayers.get(guildId);
        guildPlayer.disconnect();

        interaction.client.guildPlayers.delete(guildId);

        console.log("leaving here : ", guildId);
        await interaction.reply("Aurevoir petit chef !");
	},
}