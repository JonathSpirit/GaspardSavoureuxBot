
function isYoutubeUrl(string) {
    let regex = new RegExp('(?:https:\\/\\/)*?www\\.youtube\\.com\\/watch\\?v=[a-zA-Z0-9\\-_]*(?:&list=[a-zA-Z0-9\\-_]*)?(?:&index=[0-9]*)?', 'g');
    return regex.test(string);
}

function isYoutubePlaylistUrl(string) {
    let regex = new RegExp('(?:https:\\/\\/)*?www\\.youtube\\.com\\/playlist\\?list=[a-zA-Z0-9\\-_]*', 'g');
    return regex.test(string);
}

function extractYoutubeUrl(string) {
    let regex = new RegExp('(www\\.youtube\\.com\\/watch\\?v=[a-zA-Z0-9\\-_]*)', 'g');
    results = regex.exec(string);
    if (results !== null) {
        return "https://"+results[0];
    }
    return null;
}

function extractYoutubeID(string) {
    let regex = new RegExp('watch\\?v=([a-zA-Z0-9\\-_]*)', 'g');
    results = regex.exec(string);
    if (results !== null) {
        return results[1];
    }
    return null;
}

function isSpotifyUrl(string) {
    let regex = new RegExp('(?:https:\\/\\/)?open\\.spotify\\.com\\/track\\/[a-zA-Z0-9]*(?:\\?si=[a-zA-Z0-9]*)?', 'g');
    return regex.test(string);
}

function shuffleArray(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    if (randomIndex == 0) { // Avoid shuffle on the first element
        continue;
    }

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

module.exports = {
    isYoutubeUrl : isYoutubeUrl,
    isYoutubePlaylistUrl : isYoutubePlaylistUrl,
    extractYoutubeUrl : extractYoutubeUrl,
    extractYoutubeID : extractYoutubeID,
    shuffleArray : shuffleArray,
    isSpotifyUrl : isSpotifyUrl
}