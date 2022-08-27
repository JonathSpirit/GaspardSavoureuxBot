const ytsr = require('ytsr');
const Utils = require("../utils/utils");
const fetch = require('isomorphic-unfetch');
const { getPreview } = require('spotify-url-info')(fetch);

class Song {
    title;
    artist;
    initiator;
    initialSearch;
    length;
    youtubeUrl;
    valid;

    constructor() {
        this.title = "";
        this.artist = "";
        this.initiator = "";
        this.initialSearch = "";
        this.length = "0:00";
        this.youtubeUrl = "";
        this.valid = false;
    }

    async fetch(url, initiator) {
        this.valid = false;
        this.initiator = initiator;
        this.initialSearch = url;

        if (typeof url === 'string' || url instanceof String) {
            if (Utils.isSpotifyUrl(url)) {
                await getPreview(url).then(data => {
                    this.title = data['title'];
                    this.artist = data['artist'];
                });

                const searchResults = await ytsr(this.title + ' ' + this.artist, {limit:1});

                if (searchResults.items) {
                    if (searchResults.items.length > 0) {
                        this.title = searchResults.items[0].title;
                        this.artist = searchResults.items[0].author.name;
                        this.length = searchResults.items[0].duration;
                        this.youtubeUrl = searchResults.items[0].url;
                        this.valid = true;
                        return;
                    }
                }
                throw Error("can't fetch from spotify url: "+url);
            }
            else if ( Utils.isYoutubeUrl(url) ) {
                const searchResults = await ytsr(url, {limit:1});

                if (searchResults.items) {
                    if (searchResults.items.length > 0) {
                        this.title = searchResults.items[0].title;
                        this.artist = searchResults.items[0].author.name;
                        this.length = searchResults.items[0].duration;
                        this.youtubeUrl = searchResults.items[0].url;
                        this.valid = true;
                        return;
                    }
                }
                throw Error("can't fetch from youtube url: "+url);
            }
            else {
                const searchResults = await ytsr(url, {limit:1});

                if (searchResults.items) {
                    if (searchResults.items.length > 0) {
                        this.title = searchResults.items[0].title;
                        this.artist = searchResults.items[0].author.name;
                        this.length = searchResults.items[0].duration;
                        this.youtubeUrl = searchResults.items[0].url;
                        this.valid = true;
                        return;
                    }
                }
                throw Error("can't fetch from arguments: "+url);
            }
        }
    }
}

module.exports = {
    Song : Song
}