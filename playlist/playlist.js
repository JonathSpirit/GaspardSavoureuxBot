
const fs = require('fs');
const readline = require('readline');

class Playlist {

    discordClientID;
    playlistData;

    constructor(discordClientID) {
        this.playlistData = [];
        this.discordClientID = discordClientID;
    }

    buildPlaylistPath()
    {
        return "./data/" + String(this.discordClientID) + "_list.txt";
    }

    exist()
    {
        return fs.existsSync(this.buildPlaylistPath());
    }

    create() {
        if (this.exist())
        {
            return false;
        }

        this.playlistData = [];
        fs.writeFileSync(this.buildPlaylistPath(), "");
        return true;
    }

    save() {
        if (!this.exist())
        {
            if (!this.create())
            {
                return false;
            }
        }

        const fileStream = fs.createWriteStream(this.buildPlaylistPath());

        this.playlistData.forEach(name => {
            fileStream.write(name + "\n");
        });

        fileStream.close();
        return true;
    }

    async load() {
        if (!this.exist())
        {
            return false;
        }

        this.playlistData = [];
        const fileStream = fs.createReadStream(this.buildPlaylistPath());

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (line.length < 1)
            {
                continue;
            } 
            this.playlistData.push(line);
        }

        fileStream.close();
        return true;
    }
}

module.exports = {
    Playlist : Playlist
}