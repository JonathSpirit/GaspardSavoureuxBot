# GaspardSavoureuxBot
This is the source of a discord bot named "Gaspard Savoureux" a character from "Mister Ajikko" or in french "Le Petit chef".

This project is essentially an educational project but feel free too enhance by using it as a template for your own discord bot or work on this repository.

# What it can do ?

- It can play music from a Spotify URL (by fetching the title to Youtube).
- It can play music from a Youtube URL.
- It can play music from a Youtube playlist URL.
- It can play music with the provided words and search on Youtube.
- It can listen to your voice (in french) and play a music from Youtube with the provided word.
- You can customize some predefined music to play when someone say something.

and thats about it, I plan to upgrade with others functionality in the future.

# Commands

/join
/leave
/play
/pause
/resume
/stop
/skip

# How to install it
You will need node.js (It's working on >v18) and npm to use it

# API token
please put your api token and client ID in a project root file named "config.json" and paste your key in here like so :

```
{
    "token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "clientId": "99999999999999999"
}
```

# Why is there no server for the bot ?
Cause Youtube doesn't allow that :(

So you have to create your own token/application in the Discord dev portal and run the bot locally.
I do not endorse the responsability to some takedown notice or potential rules violations, as mentionned up there, this is an educational project.
