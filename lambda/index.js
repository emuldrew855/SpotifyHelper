// Global variables
const Alexa = require("ask-sdk-core"),
  requests = require("./requests.js"),
  util = require("./util.js"),
  speech = require("./speech.js"),
  playlists = require("./playlists"),
  addSongAPLA = require("./APLA/addSong.json"),
  helpAPLAReference = require("./APLA/help.json");
let accessToken,
  playlistName,
  playlistId,
  addSongOutput = "";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    let introOutput = speech.launch.welcomeMsg;
    accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    if (accessToken === undefined) {
      introOutput = speech.launch.unlinkedAccountErr;
      return handlerInput.responseBuilder
        .speak(introOutput)
        .withLinkAccountCard()
        .reprompt(introOutput)
        .getResponse();
    }
    util.accessToken = `Bearer ${accessToken}`;
    return await getIntro(introOutput, handlerInput);
  },
};

async function getIntro(introOutput, handlerInput) {
  const playlistResponse = await requests.getPlaylists(util.getPlaylistsPath);
  if (playlistResponse === undefined || playlistResponse.length === 0) {
    introOutput += speech.launch.noPlaylistErr;
  } else {
    introOutput += speech.launch.successMsg;
  }

  console.log("Intro Output: ", introOutput);
  return handlerInput.responseBuilder
    .speak(introOutput)
    .reprompt(introOutput)
    .getResponse();
}

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
    let removeSongResponse = "";
    if (requests.currentSong === "") {
      removeSongResponse = speech.remove.removeSongErr;
    } else {
      const removeSongPath = `/v1/playlists/${playlistId}/tracks`;
      requests.httpDELETE(removeSongPath, (theResult) => {});
      removeSongResponse = `Removing ${requests.currentSong} from playlist ${playlistName}`;
    }
    console.log(removeSongResponse);
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
    return await addSong(handlerInput);
  },
};

async function addSong(handlerInput) {
  const responseBuilder = handlerInput.responseBuilder;
  accessToken = `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`;
  util.accessToken = accessToken;
  playlistName = playlists.cleanPlaylistName(
    handlerInput.requestEnvelope.request.intent.slots.playlistname.value.toLocaleLowerCase()
  );
  console.log("Choosen Playlist Name: " + playlistName);
  let validPlaylist = false;
  // Check for valid playlist name
  const playlistResponse = await requests.getPlaylists(util.getPlaylistsPath);
  if (playlistResponse === undefined || playlistResponse.length === 0) {
    addSongOutput = speech.addSong.noPlaylistErr;
  }
  validPlaylist = await playlists.isValidPlaylist(playlistName);
  if (validPlaylist) {
    playlistId = playlists.playlistId;
  } else {
    addSongOutput = `The playlist ${playlistName} you requested wasn't found in your list of Spotify playlists`;
    console.log("Invalid Playlist name", playlistName);
  }
  // If valid playlist then make request to get current song
  if (validPlaylist) {
    const postSongResponse = await requests.addSong(
      util.getCurrentSongPath,
      playlistId
    );
    console.log("postSongResponse", postSongResponse);
    if (requests.currentSong === "No song playing") {
      addSongOutput = speech.addSong.noSongPlayingErr;
    }
    if (requests.currentSong !== "No song playing") {
      addSongOutput = `Adding ${requests.currentSong} song to playlist ${playlistName}`;
    }
  }

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
}

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
    if (requests.postSuccess === "") {
      whatPlaylistOutput = speech.whatPlaylist.playlistNotExistErr;
    }
    if (requests.currentSong === "No song playing") {
      whatPlaylistOutput = speech.whatPlaylist.noSongPlayingMsg;
    }
    whatPlaylistOutput = `You just added ${requests.currentSong} to your playlist ${playlistName}`;
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
    requests.getUserProfile(util.getCurrentUserProfilePath);
    const createPlaylistOutput = `Created new playlist: ${newPlaylistName}`;
    console.log(`Create playlist output: ${createPlaylistOutput}`);
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
    return handlerInput.responseBuilder.speak("Goodbye!").getResponse();
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
    const speakOutput = speech.err.err;
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
