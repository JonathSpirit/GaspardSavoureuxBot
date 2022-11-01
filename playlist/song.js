const Utils = require("../utils/utils");
const fetch = require('isomorphic-unfetch');
const { getPreview } = require('spotify-url-info')(fetch);
const YouTube = require("youtube-sr").default;

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

                await YouTube.search(this.title + ' ' + this.artist, {limit: 1, safeSearch: true})
                .then(searchResults => {
                    this.title = searchResults[0].title;
                    this.artist = searchResults[0].channel.name;
                    this.length = searchResults[0].durationFormatted;
                    this.youtubeUrl = searchResults[0].url;
                    this.valid = true;
                })
                .catch(err => {
                    throw Error("can't fetch from spotify url: "+url+" , "+err);
                });
            }
            else if ( Utils.isYoutubeUrl(url) ) {
                url = Utils.extractYoutubeUrl(url);

                await YouTube.getVideo(url)
                .then(searchResults => {
                    this.title = searchResults.title;
                    this.artist = searchResults.channel.name;
                    this.length = searchResults.durationFormatted;
                    this.youtubeUrl = url;
                    this.valid = true;
                })
                .catch(err => {
                    throw Error("can't fetch from youtube url: "+url+" , "+err);
                });
            }
            else {
                await YouTube.search(url, {limit: 1, safeSearch: true})
                .then(searchResults => {
                    this.title = searchResults[0].title;
                    this.artist = searchResults[0].channel.name;
                    this.length = searchResults[0].durationFormatted;
                    this.youtubeUrl = searchResults[0].url;
                    this.valid = true;
                })
                .catch(err => {
                    throw Error("can't fetch from arguments: "+url+" , "+err);
                });
            }
        }
    }
}

module.exports = {
    Song : Song
}