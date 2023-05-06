const {
    joinVoiceChannel
} = require('@discordjs/voice');

const {
    SlashCommandBuilder 
} = require('discord.js');

const {GuildPlayer} = require("../playlist/player");
const InfoCenter = require("../infoCenter/infoCenter");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Pour que Gaspard rejoint la conversation'),
	async execute(interaction) {
        const guildId = interaction.guildId;

		if ( interaction.client.guildPlayers.has(guildId) ) {
            interaction.client.guildPlayers.get(guildId).playAudioFile("./presentation.ogg");
        } else {
            InfoCenter.InfoCenter.getInfoMessage(interaction.channel)
                .then((infoMsg) => {
                    // Bot is not connected to a audio channel
                    let connection = joinVoiceChannel({
                        channelId: interaction.member.voice.channel.id,
                        guildId: guildId,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                        selfDeaf: false,
                    });

                    console.log("joining : ", guildId);

                    interaction.client.guildPlayers.set(guildId, new GuildPlayer(connection, infoMsg));
                    interaction.client.guildPlayers.get(guildId).playAudioFile("./presentation.ogg");
                })
                .catch(err => console.log(err));
        }

        await interaction.reply({content: "bien le bonjour!", fetchReply: true})
            .then((message) => message.delete())
            .catch(console.error);
	},
}