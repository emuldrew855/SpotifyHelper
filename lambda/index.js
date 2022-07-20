// Global variables
const Alexa = require("ask-sdk-core");
const requests = require("./requests.js");
const util = require("./util.js");
let accessToken =
  "Bearer BQAOUOgDG4Rq5lGK3BOaeF0wZO9N6q4fC-ZL-zXmWb7C1wwJ4vbnjfM_d77c9_tTq7LsgFKno7FtzlZ89G8CNMtdKK2QskemtcGhct_9bHsYbWMBdFQl68l34IEQlkk8atI4n8hX4UbfZ7RuLAAAJotuFBUZyej3KaX-1HPYzHlpurhRcN2hWHvPXcHoKeXjkSSGP1BNUd3WRFDHixsKeQ";
let validPlaylist = "notValid";
let playlistName = "";
let playlistId = "";
let addSongOutput = "";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    let introOutput = "Hello and welcome to Playlist Helper. ";
    accessToken = `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`;
    util.accessToken = accessToken;
    if (
      handlerInput.requestEnvelope.context.System.user.accessToken == undefined
    ) {
      introOutput =
        "You must link your Spotify account with this app. Please use the Alexa app to link your Spotify account.";
      return handlerInput.responseBuilder
        .speak(introOutput)
        .withLinkAccountCard()
        .reprompt(introOutput)
        .getResponse();
    } else {
      await requests
        .httpGETPlaylistAsync(util.getPlaylistsPath)
        .then((playlistResponse) => {
          console.log("Playlist Response: ", playlistResponse);
          if (playlistResponse === undefined || playlistResponse.length == 0) {
            console.log("No playlists found");
            introOutput +=
              "You have no created playlists on your Spotify account to add to. Please add a playlist before using this voice skill";
          } else {
            introOutput +=
              "You can add songs you are listening to your Spotify playlist. Say Add song to.... then your playlist name";
            requests.playlists.forEach(function (value, key) {
              console.log(key + " = " + value);
            });
          }
        })
        .catch((e) => console.log(e));
      console.log("Intro Output: ", introOutput);
      return handlerInput.responseBuilder
        .speak(introOutput)
        .reprompt(introOutput)
        .getResponse();
    }
  },
};

// Custom Intents
const RemoveSongIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "RemoveSongIntent"
    );
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    let removeSongResponse =
      "No previous song has been added. Therefore we were unable to remove from your given playlist";
    console.log(
      `Playlist Info: PlaylistID: ${playlistId},Playlist Name: ,${playlistName}`
    );
    console.log(
      `Song Info: Song Name:,${requests.currentSong}, Song URI:  ${requests.trackURI}`
    );
    const removeSongPath = `/v1/playlists/${playlistId}/tracks`;
    if (requests.currentSong == "") {
      console.log("No song available to remove");
    } else {
      removeSongResponse = `Removing ${requests.currentSong} from ${playlistName}`;
      requests.currentSong = "No song playing";
    }
    requests.httpDELETE(removeSongPath);
    return responseBuilder
      .speak(removeSongResponse)
      .reprompt(removeSongResponse)
      .getResponse();
  },
};

const AddSongIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AddSongIntent"
    );
  },
  async handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    playlistName =
      handlerInput.requestEnvelope.request.intent.slots.playlistname.value;
    if (playlistName.toLocaleLowerCase().includes("playlist")) {
      playlistName = playlistName.toLocaleLowerCase().replace("playlist ", "");
      console.log("Playlist: " + playlistName);
    } else if (playlistName.toLocaleLowerCase().includes("add song to")) {
      playlistName = playlistName
        .toLocaleLowerCase()
        .replace("add song to ", "");
      console.log("Playlist: " + playlistName);
    }
    console.log("Choosen Playlist Name: " + playlistName);
    addSongOutput = "You must add a song first";
    const addSongAPLA = require("./APLA/addSong.json");
    validPlaylist = "notValid";
    // Check for valid playlist name
    accessToken = `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`;
    util.accessToken = accessToken;
    await requests
      .httpGETPlaylistAsync(util.getPlaylistsPath)
      .then((playlistResponse) => {
        console.log("Playlist Response: ", playlistResponse);
        if (playlistResponse === undefined || playlistResponse.length == 0) {
          console.log("No playlists found");
          addSongOutput =
            "You have no created playlists on your Spotify account to add to. Please add a playlist before using this voice skill";
        } else {
          requests.playlists.forEach(function (value, key) {
            if (
              value
                .toLocaleLowerCase()
                .includes(playlistName.toLocaleLowerCase())
            ) {
              console.log("Valid playlistName", value);
              playlistName = value;
              playlistId = key;
              validPlaylist = "valid";
            } else {
              addSongOutput = "Not a valid playlist please try again";
              console.log("Invalid Playlist name", value);
            }
          });
        }
      })
      .catch((e) => console.log(e));
    // If valid play list then make request to get current song
    await requests
      .httpGETSongPostSongAsync(util.getCurrentSongPath, playlistId)
      .then((postSongResponse) => {
        console.log("postSongResponse", postSongResponse);
        if (requests.currentSong == "No song playing") {
          addSongOutput = "You must be playing a song to add to your playlist";
        } else if (
          validPlaylist == "valid" &&
          requests.currentSong != "No song playing"
        ) {
          addSongOutput = `Adding ${requests.currentSong} song to ${playlistName}`;
        }
      })
      .catch((e) => console.log(e));
    console.log("Add Song Decision: " + addSongOutput);
    return responseBuilder
      .speak(addSongOutput)
      .addDirective({
        type: "Alexa.Presentation.APLA.RenderDocument",
        token: "developer-provided-string",
        document: addSongAPLA,
        datasources: {
          data: {
            addSongOutput: addSongOutput,
          },
        },
      })
      .reprompt(addSongOutput)
      .getResponse();
  },
};

const WhatPlaylistIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "WhatPlaylistIntent"
    );
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    let whatPlaylistOutput = "";
    if (requests.postSuccess != "") {
      whatPlaylistOutput = `You just added ${requests.currentSong} to your playlist ${playlistName}`;
    } else {
      whatPlaylistOutput =
        "Your playlist does not exist, please try adding to a valid playlist";
    }
    if (requests.currentSong == "No song playing") {
      whatPlaylistOutput =
        "No song has been added. You need to be playing a song on Spotify to add a song to your playlist. Please try the Add song command again";
    }
    console.log("What playlist output: ", whatPlaylistOutput);
    return responseBuilder.speak(whatPlaylistOutput).getResponse();
  },
};

const CreatePlaylistIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "CreatePlaylistIntent"
    );
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    let newPlaylistName =
      handlerInput.requestEnvelope.request.intent.slots.createdPlaylistName
        .value;
    let createPlaylistOutput = "Created new playlist: " + newPlaylistName;
    let path = util.getCurrentUserProfilePath;
    requests.httpGETUserProfile(path);
    console.log("Create playlist output: ", createPlaylistOutput);

    return responseBuilder
      .speak(createPlaylistOutput)
      .reprompt(createPlaylistOutput)
      .getResponse();
  },
};

// Built in intents
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const helpAPLAReference = require("./APLA/help.json");

    return handlerInput.responseBuilder
      .speak()
      .addDirective({
        type: "Alexa.Presentation.APLA.RenderDocument",
        token: "developer-provided-string",
        document: helpAPLAReference,
      })
      .reprompt()
      .getResponse();
  },
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = "Goodbye!";
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  },
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again. Ensure you are playing a song on Spotify to add to your playlist`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    WhatPlaylistIntent_Handler,
    CreatePlaylistIntent_Handler,
    AddSongIntent_Handler,
    RemoveSongIntent_Handler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
