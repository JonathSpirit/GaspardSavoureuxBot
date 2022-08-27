
function isYoutubeUrl(string) {
    let regex = new RegExp('(?:https:\\/\\/)*?www\\.youtube\\.com\\/watch\\?v=[a-zA-Z0-9]*(?:&list=[a-zA-Z0-9]*)?(?:&index=[0-9]*)?', 'g');
    return regex.test(string);
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
    shuffleArray : shuffleArray,
    isSpotifyUrl : isSpotifyUrl
}