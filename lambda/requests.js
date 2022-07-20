// variables
const axios = require("axios");
var https = require("https");
var host = "api.spotify.com";
const util = require("./util.js");
let postSongPath = "";
var playlists = new Map();
var trackURI = "";
var currentSong = "No song playing";
var postSuccess = "";
var userId = "";
exports.currentSong = currentSong;
exports.postSuccess = postSuccess;
// methods
module.exports.httpGETPlaylistAsync = async function httpGETPlaylistAsync(
  path
) {
  let response = "";
  try {
    response = await axios.get(`https://${host}${path}`, {
      headers: {
        Authorization: util.accessToken,
      },
    });
  } catch (error) {
    console.log(error.response.body);
  }
  for (const playlist of response.data.items) {
    playlists.set(playlist.id, playlist.name);
  }
  exports.playlists = playlists;
  return response.data.items;
};

module.exports.httpGETUserProfile = async function httpGETUserProfile(
  path,
  newPlaylistName
) {
  let response = "";
  try {
    response = await axios.get("https://" + host + path, {
      headers: {
        Authorization: util.accessToken,
      },
    });
    exports.userId = response.data.id;
    console.log("User id: ", response.data.id);
    console.log("GET/ user profile response: ", response);
    let createNewPlaylistPath =
      util.createNewPlaylistPath + response.data.id + "/playlists";
    console.log("Create new playlist path: ", createNewPlaylistPath);
    this.httpPOSTPlaylist(
      createNewPlaylistPath,
      newPlaylistName,
      (theResult) => {
        console.log("Create new playist response: ", JSON.parse(theResult));
      }
    );
  } catch (error) {
    console.log(error);
    console.log(error.response.body);
  }

  return response;
};

module.exports.httpGETSongPostSongAsync =
  async function httpGETSongPostSongAsync(path, playlistId) {
    let response = "";
    try {
      response = await axios.get("https://" + host + path, {
        headers: {
          Authorization: util.accessToken,
        },
      });
      console.log("Song response:", response);
      if (response.status == "204") {
        response = "No song playing";
        console.log("GET SONG: Error response: ", response);
        exports.currentSong = response;
      } else {
        trackURI = response.data.item.uri;
        postSongPath = `/v1/playlists/"${playlistId}/tracks?uris=${trackURI}`;
        const currentSong = `${response.data.item.name} by ${response.data.item.artists[0].name}`;
        console.log("Current song: ", currentSong);
        exports.currentSong = currentSong;
        exports.trackURI = trackURI;
        try {
          const postSuccess = await this.httpPostSongAsync(postSongPath);
          console.log(postSuccess);
          exports.postSuccess = "Success";
        } catch (error) {
          console.error(error);
          exports.postSuccess = "Error";
        }
      }
    } catch (error) {
      console.log(error);
    }

    return response;
  };

module.exports.httpPostSongAsync = function httpPostSongAsync(path) {
  var options = {
    method: "POST",
    hostname: host,
    path: path,
    headers: {
      Authorization: util.accessToken,
    },
    maxRedirects: 20,
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log("Post song Response: ", res);
      let body = "";
      res.on("data", (chunk) => (body += chunk.toString()));
      res.on("error", reject);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode <= 299) {
          console.log(
            "Request Succeeded. status:  " + res.statusCode + " body:",
            body
          );
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        } else {
          reject(
            "Request failed. status: " + res.statusCode + ", body: " + body
          );
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
};

module.exports.httpPOSTPlaylist = function httpPOSTPlaylist(
  path,
  newPlaylistName,
  callback
) {
  var data = JSON.stringify({ name: newPlaylistName });
  console.log("DATA stringify: ", data);
  var config = {
    method: "post",
    url: path,
    headers: {
      Authorization: util.accessToken,
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
};

module.exports.httpPOST = async function httpPOST(path, callback) {
  var options = {
    method: "POST",
    hostname: host,
    path: path,
    headers: {
      Authorization: util.accessToken,
    },
    maxRedirects: 20,
  };

  var req = https
    .request(options, (res) => {
      console.log("POST REQUEST STARTED");
      var responseString = "";

      //accept incoming data asynchronously
      res.on("data", (chunk) => {
        responseString = responseString + chunk;
      });

      //return the data when streaming is complete
      res.on("end", () => {
        callback(responseString);
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
  req.end();
};

module.exports.httpDELETE = function httpDELETE(path, callback) {
  var options = {
    method: "DELETE",
    hostname: host,
    path: path,
    Content: "application/json",
    "Content-Type": "application/json",
    headers: {
      Authorization: util.accessToken,
    },
    maxRedirects: 20,
  };

  var req = https
    .request(options, (res) => {
      console.log("DELETE REQUEST STARTED");
      var responseString = "";

      //accept incoming data asynchronously
      res.on("data", (chunk) => {
        responseString = responseString + chunk;
      });

      //return the data when streaming is complete
      res.on("end", () => {
        callback(responseString);
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });

  var postData = JSON.stringify({ tracks: [{ uri: trackURI }] });

  req.setHeader("Content-Length", postData.length);

  req.write(postData);

  req.end();
};
