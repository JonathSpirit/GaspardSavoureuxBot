
const fs = require('fs');
const readline = require('readline');

class Playlist {

    playlistName;
    playlistData;
    isValid;

    constructor() {
        this.playlistData = [];
        this.playlistName = "";
        this.isValid = false;
    }

    create(name) {
        this.playlistData = [];
        this.isValid = false;

        if (typeof(name)!=='string')
        {
            return false;
        }
        for (var i=0;i<name.length;i++)
        {
            if( (name.charCodeAt(i) < 48) ||
                (name.charCodeAt(i) >= 58 && name.charCodeAt(i) <= 64) ||
                (name.charCodeAt(i) >= 91 && name.charCodeAt(i) <= 96) ||
                (name.charCodeAt(i) > 122) )
            {
                return false;
            }
        }

        this.playlistName = name;
        this.isValid = true;
        return true;
    }

    save() {
        if (!this.isValid)
        {
            return false;
        }
        
        try {
            let data = "";
            this.playlistData.forEach(function(v) { data+=v + "\r\n"; });

            fs.writeFileSync("./playlist_"+this.playlistName+".txt", data);

            return true;
        } catch (err) {
            console.error(err)
            return false;
        }
    }

    load(name) {
        this.playlistData = [];
        this.isValid = false;

        if (typeof(name)!=='string')
        {
            return false;
        }
        for (var i=0;i<name.length;i++)
        {
            if( (name.charCodeAt(i) < 48) ||
                (name.charCodeAt(i) >= 58 && name.charCodeAt(i) <= 64) ||
                (name.charCodeAt(i) >= 91 && name.charCodeAt(i) <= 96) ||
                (name.charCodeAt(i) > 122) )
            {
                return false;
            }
        }

        this.playlistName = name;

        try {
            this.playlistData = fs.readFileSync("./playlist_"+name+".txt", 'utf-8')
                .split('\r\n')
                .filter(Boolean);

            this.isValid = true;

            return true;
        } catch (err) {
            this.playlistData = [];
            console.error(err)
            return false;
        }
    }
}

module.exports = {
    Playlist : Playlist
}