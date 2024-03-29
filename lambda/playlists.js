const FuzzySet = require("fuzzyset");
const requests = require("./requests.js");
let cleanedPlaylists = new Map();

module.exports.cleanPlaylistName = function cleanPlaylistName(playlistName) {
  if (playlistName.includes("playlist ")) {
    playlistName = playlistName.replace("playlist ", "");
  }
  if (playlistName.includes("playlist")) {
    playlistName = playlistName.replace("playlist", "");
  }
  if (
    playlistName.includes("add song to ") ||
    playlistName.includes("add song to")
  ) {
    playlistName = playlistName.replace("add song to ", "");
  }
  return playlistName;
};

async function cleanFoundPlaylists() {
  requests.playlists.forEach(function (value, key) {
    const emojiRegex =
      /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
    let m;
    while ((m = emojiRegex.exec(value)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === emojiRegex.lastIndex) {
        emojiRegex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach((match) => {
        value = value.replace(emojiRegex, "");
        requests.playlists[key] = value;
        console.log(`Found Emoji:  ${match}` + " for playlist " + value);
      });
    }
    cleanedPlaylists.set(key, value);
  });
}

module.exports.isValidPlaylist = async function isValidPlaylist(playlistName) {
  await cleanFoundPlaylists();
  let playlistMatch = FuzzySet([...cleanedPlaylists.values()]);
  console.log(
    `Fuzzy Set Dict:${JSON.stringify(playlistMatch.get(playlistName))}`
  );
  if (
    playlistMatch.get(playlistName) !== null &&
    playlistMatch.get(playlistName)[0][0] > 0.6
  ) {
    console.log(
      `Valid playlistName ${playlistName} with match of: ${
        playlistMatch.get(playlistName)[0][0]
      }`
    );
    exports.playlistId = getByValue(
      cleanedPlaylists,
      playlistMatch.get(playlistName)[0][1] // Name of playlist index
    );
    return true;
  }
  return false;
};

function getByValue(map, searchValue) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue) return key;
  }
}
