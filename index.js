//https://discord.com/developers/applications/
//https://discordapi.com/permissions.html
//https://discord.com/oauth2/authorize?client_id=746087602192646174&scope=bot&permissions=3148800
//https://www.youtube.com/watch?v=errnVwm_3mI
//https://discord.js.org/#/
//https://www.npmjs.com/package/discord-ytdl-core

const {
    Client,
    Partials,
    GatewayIntentBits,
    Collection,
    Events,
    REST,
    Routes
} = require('discord.js');

const {
    addSpeechEvent
} = require("discord-speech-recognition");

const {
    clientId,
    token
} = require('./config.json');

const fs = require('node:fs');
const path = require('node:path');

//Loading custom voice replies
class CustomReply
{
    url = "";
    isLink = false;

    constructor(url, isLink)
    {
        this.url = url;
        this.isLink = isLink;
    }
}

let customReply = new Map();
{
    let rawdata = fs.readFileSync("./customReply.json");
    let customReplyJson = JSON.parse(rawdata);
    customReplyJson["customReply"].forEach(element => {
        customReply.set(element.text, new CustomReply(element.url, element.isLink));
    });
    console.log(customReply);
}

//Creating the bot
const bot = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ], partials: [Partials.Channel]
});

//Load slash commands
//Directly taken from : https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files
bot.commands = new Collection();
const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFilePaths = fs.readdirSync(foldersPath);

for (const commandFileName of commandFilePaths) {
    const commandFilePath = path.join(foldersPath, commandFileName);

    if (fs.lstatSync(commandFilePath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandFilePath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandFilePath, file);
            const command = require(filePath);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                bot.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    } else if (commandFileName.endsWith('.js')) {
        const command = require(commandFilePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            bot.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${commandFilePath} is missing a required "data" or "execute" property.`);
        }
    } else {
        console.log(`[WARNING] Ignoring file ${commandFileName}.`);
    }
}

//Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

//Deploying global commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

//Prepare a map containing all Players by guild id
bot.guildPlayers = new Map();

//Add speech event for voice recognition
addSpeechEvent(bot, { lang: "fr-FR" });
 
bot.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) {
        return;
    }

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

bot.on("speech", (msg) => {
    if (msg.content)
    {
        try
        {
            const guildId = msg.channel.guildId;
            const sentence = msg.content.toLowerCase();

            if (!bot.guildPlayers.has(guildId)) {
                return;
            }

            if (customReply.has(sentence))
            {
                let reply = customReply.get(sentence);
                if (reply.isLink) {
                    bot.guildPlayers.get(guildId).parseSoundString(reply.url, msg.author.username, null);
                } else {
                    bot.guildPlayers.get(guildId).playAudioFile(reply.url);
                }
            }

            if ( sentence.startsWith('gaspard joue') )
            {
                bot.guildPlayers.get(guildId).parseSoundString(sentence.slice('gaspard joue'.length), msg.author.username, null);
            }
            else if ( sentence.startsWith('gaspard lance') )
            {
                bot.guildPlayers.get(guildId).parseSoundString(sentence.slice('gaspard lance'.length), msg.author.username, null);
            }
            else if ( sentence.startsWith('gaspard met') )
            {
                bot.guildPlayers.get(guildId).parseSoundString(sentence.slice('gaspard met'.length), msg.author.username, null);
            }
            else if ( sentence === 'gaspard skip' || sentence === 'gaspard suivant' )
            {
                bot.guildPlayers.get(guildId).skip();
            }
            else if ( sentence === 'gaspard stop' )
            {
                bot.guildPlayers.get(guildId).stop();
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }
});

bot.on("ready", function () {
    console.log(`Logged in as ${bot.user.tag} !`);

    //Avatar
    bot.user.setAvatar("./avatar.jpg")
    .then(user => console.log("New avatar set!"))
    .catch(reason => console.log("Can't set avatar now !"));

    //Activity
    bot.user.setActivity("la qualité d'un restaurant", {type: 'WATCHING'});
});

bot.on('voiceStateUpdate', (oldState, newState) => {
    // if nobody left the channel in question, return.
    if (oldState.channelId !== oldState.guild.members.me.voice.channelId || newState.channel) {
        return;
    }
    
    // otherwise, check how many people are in the channel now
    if (oldState.channel.members.size - 1 === 0) {
        setTimeout(() => {
            if (oldState.channel.members.size - 1 === 0) {
                if (bot.guildPlayers.has(oldState.guild.members.me.voice.channel.guild.id)) {
                    bot.guildPlayers.get(oldState.guild.members.me.voice.channel.guild.id).disconnect();
                    bot.guildPlayers.delete(oldState.guild.members.me.voice.channel.guild.id);
                    console.log("timeout here : ", oldState.guild.members.me.voice.channel.guild.id);
                }
            }
        }, 10000);
    }
});

bot.login(token);
