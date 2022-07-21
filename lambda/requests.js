// variables
const axios = require("axios");
let https = require("https");
let host = "api.spotify.com";
const util = require("./util.js");
let trackURI = "",
  currentSong = "No song playing",
  postSuccess = "",
  postSongPath = "",
  userId = "",
  playlists = new Map();

module.exports.getPlaylists = async function getPlaylists(path) {
  let response = "";
  try {
    response = await axios.get(`https://${host}${path}`, {
      headers: {
        Authorization: util.accessToken,
      },
    });
  } catch (error) {
    console.log(error.response.body);
    return error.response.body;
  }
  for (const playlist of response.data.items) {
    playlists.set(playlist.id, playlist.name);
  }
  exports.playlists = playlists;
  return response.data.items;
};

module.exports.getUserProfile = async function getUserProfile(
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

module.exports.addSong = async function addSong(path, playlistId) {
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
      postSongPath = `/v1/playlists/${playlistId}/tracks?uris=${trackURI}`;
      const currentSong = `${response.data.item.name} by ${response.data.item.artists[0].name}`;
      console.log("Post Song Path: ", postSongPath);
      exports.currentSong = currentSong;
      exports.trackURI = trackURI;
      try {
        const postSuccess = await this.postSong(postSongPath);
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

module.exports.postSong = function postSong(path) {
  const options = {
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
  _callback
) {
  const data = JSON.stringify({ name: newPlaylistName });
  console.log("DATA stringify: ", data);
  const config = {
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
  const options = {
    method: "POST",
    hostname: host,
    path: path,
    headers: {
      Authorization: util.accessToken,
    },
    maxRedirects: 20,
  };

  const req = https
    .request(options, (res) => {
      console.log("POST REQUEST STARTED");
      let responseString = "";
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
  const options = {
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

  let req = https
    .request(options, (res) => {
      console.log("DELETE REQUEST STARTED");
      let responseString = "";
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

  const postData = JSON.stringify({ tracks: [{ uri: trackURI }] });
  req.setHeader("Content-Length", postData.length);
  req.write(postData);
  req.end();
};

exports.currentSong = currentSong;
exports.postSuccess = postSuccess;
