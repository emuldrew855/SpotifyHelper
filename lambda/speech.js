const launch = {
  welcomeMsg: "Hello and welcome to Playlist Helper. ",
  unlinkedAccountErr:
    "You must link your Spotify account with this app. Please use the Alexa app to link your Spotify account.",
  noPlaylistErr:
    "You have no created playlists on your Spotify account to add to. Please add a playlist before using this voice skill",
  successMsg:
    "You can add songs you are currently listening to on your Alexa device, to your Spotify playlist. Say Add song to.... then your playlist name",
};

const remove = {
  removeSongErr:
    "No previous song has been added. Therefore we were unable to remove from your given playlist",
};

const addSong = {
  noPlaylistErr:
    "You have no created playlists on your Spotify account to add to. Please add a playlist before using this voice skill",
  noSongPlayingErr: "You must be playing a song to add to your playlist",
};

const whatPlaylist = {
  playlistNotExistErr:
    "Your playlist does not exist, please try adding to a valid playlist",
  noSongPlayingMsg:
    "No song has been added. You need to be playing a song on Spotify to add a song to your playlist. Please try the Add song command again",
};

const err = {
  err: `Sorry, I had trouble doing what you asked. Please try again. Ensure you are playing a song on Spotify to add to your playlist`,
};

exports.whatPlaylist = whatPlaylist;
exports.addSong = addSong;
exports.remove = remove;
exports.launch = launch;
exports.err = err;
