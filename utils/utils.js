
function isYoutubeUrl(string) {
    let regex = new RegExp('(?:https:\\/\\/)*?www\\.youtube\\.com\\/watch\\?v=[a-zA-Z0-9]*(?:&list=[a-zA-Z0-9]*)?(?:&index=[0-9]*)?', 'g');
    return regex.test(string);
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function shuffleArray(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

module.exports = {
    isYoutubeUrl : isYoutubeUrl,
    isValidHttpUrl : isValidHttpUrl,
    shuffleArray : shuffleArray
}