const Utils = require("../utils/utils");
const fetch = require('isomorphic-unfetch');
const { getPreview } = require('spotify-url-info')(fetch);
const { Innertube } = require("youtubei.js/web");

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
                console.log("Fetching song from spotify url: ", url);

                await getPreview(url).then(data => {
                    this.title = data['title'];
                    this.artist = data['artist'];
                });

                const innertube = await Innertube.create({retrieve_player: false, enable_session_cache: false, enable_safety_mode: true});

                await innertube.search(this.title + ' ' + this.artist, {client: 'YTMUSIC', type: 'video'})
                .then(searchResults => {
                    if (searchResults.results.length < 1) {
                        throw Error("No results found for search: "+url);
                    }

                    this.title = String(searchResults.results[1].title.text);
                    this.artist = String(searchResults.results[1].author.name);
                    this.length = String(searchResults.results[1].length_text.text);
                    this.youtubeUrl = "https://www.youtube.com/watch?v=" + searchResults.results[1].video_id;
                    this.valid = true;

                    console.log("Song fetched from search: ", this.youtubeUrl);
                    console.log("Title: ", this.title);
                    console.log("Artist: ", this.artist);
                    console.log("Length: ", this.length);
                })
                .catch(err => {
                    throw Error("can't fetch from arguments: "+url+" , "+err);
                });
            }
            else if ( Utils.isYoutubeUrl(url) ) {
                const id = Utils.extractYoutubeID(url);
                url = Utils.extractYoutubeUrl(url);

                const innertube = await Innertube.create({retrieve_player: false, enable_session_cache: false, enable_safety_mode: true});

                await innertube.getBasicInfo(id)
                .then(videoInfo => {
                    this.title = videoInfo.basic_info.title;
                    this.artist = videoInfo.basic_info.author;
                    this.length = String(videoInfo.basic_info.duration); //TODO: durationFormatted is not available in youtubei.js
                    this.youtubeUrl = url;
                    this.valid = true;

                    console.log("Song fetched from youtube url: ", this.youtubeUrl);
                    console.log("Title: ", this.title);
                    console.log("Artist: ", this.artist);
                    console.log("Length: ", this.length);
                })
                .catch(err => {
                    throw Error("can't fetch from youtube url: "+url+" , "+err);
                });
            }
            else {
                const innertube = await Innertube.create({retrieve_player: false, enable_session_cache: false, enable_safety_mode: true});

                await innertube.search(url, {client: 'YTMUSIC', type: 'video'})
                .then(searchResults => {
                    if (searchResults.results.length < 1) {
                        throw Error("No results found for search: "+url);
                    }

                    this.title = String(searchResults.results[1].title.text);
                    this.artist = String(searchResults.results[1].author.name);
                    this.length = String(searchResults.results[1].length_text.text);
                    this.youtubeUrl = "https://www.youtube.com/watch?v=" + searchResults.results[1].video_id;
                    this.valid = true;

                    console.log("Song fetched from search: ", this.youtubeUrl);
                    console.log("Title: ", this.title);
                    console.log("Artist: ", this.artist);
                    console.log("Length: ", this.length);
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