//https://discord.com/developers/applications/
//https://discordapi.com/permissions.html
//https://discord.com/oauth2/authorize?client_id=746087602192646174&scope=bot&permissions=3148800
//https://www.youtube.com/watch?v=errnVwm_3mI
//https://discord.js.org/#/

const {
    Client,
    Intents,
    Partials,
    GatewayIntentBits
} = require('discord.js');

const {
    getVoiceConnection
} = require('@discordjs/voice');

const {
    addSpeechEvent
} = require("discord-speech-recognition");

const Commands = require("./commands/commands");

const bot = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ], partials: [Partials.Channel]
});

addSpeechEvent(bot, { lang: "fr-FR" });
 
bot.on("speech", (msg) => {
    if (msg.content)
    {
        try
        {
            const sentence = msg.content.toLowerCase();

            if (sentence === "gaspard joue ma musique")
            {
                if (msg.author.username != "JSpirit")
                {
                    msg.content = "!play https://www.youtube.com/watch?v=Bo0cpgAtzig";
                }
                else
                {
                    msg.content = "!play MINE DIAMONDS | miNECRAFT PARODY OF TAKE ON ME";
                }
                
                Commands.Cmd_play.parse(msg, bot);
            }
            else if ( sentence.startsWith('gaspard joue') || sentence.startsWith('gaspard lance') || sentence.startsWith('gaspard met') )
            {
                msg.content = "!play "+sentence.slice(24);
                Commands.Cmd_play.parse(msg, bot);
            }
            else if ( sentence === 'gaspard skip' )
            {
                msg.content = "!skip"
                Commands.Cmd_skip.parse(msg, bot);
            }
            else if (sentence === "gaspard présente-toi")
            {
                let connection = getVoiceConnection(msg.member.voice.channel.guild.id);
                Commands.playAudio(connection, "./presentation.ogg");
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }
});

//Toutes les actions à faire quand le bot se connecte
bot.on("ready", function () {
    console.log(`Logged in as ${bot.user.tag} !`);

    //Avatar
    bot.user.setAvatar("./avatar.jpg")
    .then(user => console.log("New avatar set!"))
    .catch(reason => console.log("Can't set avatar now !"));

    //Activité
    bot.user.setActivity("la qualité d'un restaurant", {type: 'WATCHING'});
})

bot.on("messageCreate", function (msg) {
    if (msg.author.bot)
    {
        return;
    }

    if (msg.content == "!gaspard")
    {
        msg.content = "!play MINE DIAMONDS | miNECRAFT PARODY OF TAKE ON ME";
    }

    let commandUsed =
    Commands.Cmd_help.parse(msg, bot) ||
    Commands.Cmd_join.parse(msg, bot) ||
    Commands.Cmd_leave.parse(msg, bot) ||
    Commands.Cmd_play.parse(msg, bot) ||
    Commands.Cmd_stop.parse(msg, bot) ||
    Commands.Cmd_pause.parse(msg, bot) ||
    Commands.Cmd_unpause.parse(msg, bot) ||
    Commands.Cmd_shuffle.parse(msg, bot) ||
    Commands.Cmd_skip.parse(msg, bot);
    
    if (commandUsed == true)
    {
        msg.delete();
    }
})


var fs = require('fs');
var apiKey = fs.readFileSync("apiKey.txt", 'utf8');

bot.login( apiKey.replace(/[^a-zA-Z0-9.]/g, "") );
