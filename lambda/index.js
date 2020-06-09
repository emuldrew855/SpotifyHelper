// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const invocationName = "playlist helper";
var https = require('https'); 
var accessToken = 'Bearer BQBpGSRRy_QJv2XQU7bv3E6GY91jZ0lGyc8HucCemTzQSojd8ZDWNAolhMBZyxKMHbjNJ0qCgyRe-wS2_SPF7LgDJQAV0S6EsIctWnTs_Sn9Bpc6ryvWdziQP4_yPTGxjMdrm7dgI4YC5xdLE8dRy3ZWL1RXeaNQLGAPZAYGYG9k92zXHSeFRhD99sgf9xQjpaazDVr3W3p_kqTsE-yLjw';
var authorizationToken = 'Bearer ';
var validPlaylist= 'notValid';
var songAdded = '';
var trackURI;
var playlistName = '';
var playlistId= '';
var playlists = new Map();
// Session Attributes 
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log('LAUNCH REQUEST INTENT');
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        accessToken = 'Bearer ' + handlerInput.requestEnvelope.context.System.user.accessToken;
        console.log('Auth Token: ', accessToken);
        const speakOutput = 'hello' + ' and welcome to ' + invocationName + ' ! You can add songs you are listening to your Spotify playlist.';
        const path= '/v1/me/playlists'
        httpGet('', path, (theResult) => {
                var obj = JSON.parse(theResult);
                for(var i = 0; i < obj.items.length; i++) {
                    playlists.set(obj.items[i].id ,obj.items[i].name)
                }
                playlists.forEach(function(value, key) {
                  console.log(key + ' = ' + value)
                })
          })
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(authorizationToken)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};


const RemoveSongIntent_Handler ={ 
     canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log('REMOVE SONG INTENT');
        return request.type === 'IntentRequest' && request.intent.name === 'RemoveSongIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let query = trackURI; 
        let removeSongResponse = 'No previous song has been added. Therefore we were unable to remove from your given playlist';
        console.log('Playlist Info: PlaylistID: ', playlistId, ' Playlist Name: ', playlistName);
        console.log('Song Info: Song Name:' , songAdded, ' Song URI: ', trackURI);
        var path = '/v1/playlists/' + playlistId +'/tracks'; 
        if(songAdded == '') {
            console.log('No song available to remove ')
            
        }else {
            removeSongResponse = 'Removing ' + songAdded + ' from ' + playlistName; 
            songAdded = '';
        }
        httpDELETE(query, path,  (theResult) => {
                    var obj = JSON.parse(theResult);
        }) 
        return responseBuilder
            .speak(removeSongResponse)
            .reprompt(removeSongResponse)
            .getResponse();
    },   
};

const AddSongIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log('ADD SONG INTENT');
        return request.type === 'IntentRequest' && request.intent.name === 'AddSongIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const path = '/v1/me/player/currently-playing';
        playlistName = handlerInput.requestEnvelope.request.intent.slots.playlistname.value; 
        var addSongOutput = 'Adding to '
        // Check for valid playlist name
        playlists.forEach(function(value, key) {
        if(value.toLocaleLowerCase().includes(playlistName.toLocaleLowerCase())) {
                  console.log('Valid playlistName', value);
                  playlistName = value;
                  playlistId = key;
                  validPlaylist = 'valid';
                  addSongOutput += playlistName;
         }else{
                  console.log('Invalid Playlist name', value);
          }
        })
        // If valid play list then make request to get current song
        if(validPlaylist != 'notValid') {
            httpGet('', path,  (theResult) => {
                    console.log('Get Song Response: '+ theResult);
                    if(theResult == '') {
                        console.log('No song currently being played');
                        songAdded = '';
                    }else {
                        var obj = JSON.parse(theResult);
                        songAdded = obj.item.name + ' by ' +  obj.item.artists[0].name;
                        trackURI = obj.item.uri; 
                        console.log('Song: ', songAdded, ' TrackUI: ' , trackURI);
                    }
            })
        }else {
            addSongOutput = 'Not a valid playlist please try again';
        }
        return responseBuilder
            .speak(addSongOutput)
            .reprompt('try again, ' + addSongOutput)
            .getResponse();
    },
};

const WhatPlaylistIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        console.log('WHAT PLAYLIST INTENT');
        return request.type === 'IntentRequest' && request.intent.name === 'WhatPlaylistIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let whatPlaylistOutput = '';
        if(validPlaylist != 'notValid') {
            console.log('PlaylistID: ', playlistId);
            console.log('Track URI: ' , trackURI);
            var path=	'/v1/playlists/' + playlistId + '/tracks?uris=' + trackURI;
            httpPOST('', path,  (theResult) => {
                    var obj = JSON.parse(theResult);
                    console.log("Object: ", obj);
            })
            whatPlaylistOutput = 'You just added ' + songAdded + ' to your playlist ' + playlistName; 
        }else {
            whatPlaylistOutput = 'You playlist does not exist, please try adding to a valid playlist';
        }
        if(songAdded == '') {
            whatPlaylistOutput = 'No song selected. You need to be playing a song on Spotify to add a song to your playlist. Please try the Add song command again'
        }
        

        return responseBuilder
            .speak(whatPlaylistOutput)
            .reprompt('try again, ' + whatPlaylistOutput)
            .getResponse();
    },
};


// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
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
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        WhatPlaylistIntent_Handler,
        AddSongIntent_Handler,
        RemoveSongIntent_Handler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
    
    
// 3.  Helper Functions ===================================================================

function httpGet(query,path, callback) {
  var options = {
  'method': 'GET',
  'hostname': 'api.spotify.com',
  'path': path,
  'headers': {
      'Authorization': accessToken
  },
  'maxRedirects': 20
};

    var req = https.request(options, res => {
        console.log("GET REQUEST STARTED");
        var responseString = "";
        
        //accept incoming data asynchronously
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        //return the data when streaming is complete
        res.on('end', () => {;
            callback(responseString);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });;
    req.end();
}

function httpPOST(query,path, callback) {
  var options = {
  'method': 'POST',
  'hostname': 'api.spotify.com',
  'path': path,
  'headers': {
    'Authorization': accessToken
  },
  'maxRedirects': 20
};

    var req = https.request(options, res => {
        console.log("POST REQUEST STARTED");
        var responseString = "";
        
        //accept incoming data asynchronously
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        //return the data when streaming is complete
        res.on('end', () => {;
            callback(responseString);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });;
    req.end();
}


function httpDELETE(query,path, callback) {
  var options = {
  'method': 'DELETE',
  'hostname': 'api.spotify.com',
  'path': path,
  'Content': 'application/json',
  'Content-Type': 'application/json',
  'headers': {
    'Authorization': accessToken
  },
  'maxRedirects': 20
};

    var req = https.request(options, res => {
        console.log("DELETE REQUEST STARTED");
        var responseString = "";
        
        //accept incoming data asynchronously
        res.on('data', chunk => {
            responseString = responseString + chunk;
        });
        
        //return the data when streaming is complete
        res.on('end', () => {;
            callback(responseString);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });;
    
    var postData = JSON.stringify({"tracks":[{"uri":query}]});

    req.setHeader('Content-Length', postData.length);
    
    req.write(postData);

    
    req.end();
}
