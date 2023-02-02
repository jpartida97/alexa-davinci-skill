const Alexa = require('ask-sdk-core');
const https = require('https');

// # # # OpenAI configuration

const INCREASED_RESPONSE_LENGTH = 150;
const DEFAULT_RESPONSE_LENGTH = 70;
const TIMEOUT_VALUE = 5;
const options = {
	hostname: 'api.openai.com',
	port: 443,
	path: '/v1/completions',
	method: 'POST',
	headers: {
		'content-type': "application/json",
		'authorization': "Bearer USE-HERE-YOUR-OWN-SECRET-API-KEY"
	},
	timeout: (TIMEOUT_VALUE * 1000)
};

// # # # String literals

const OPENAI_DAVINCI_MODEL = "text-davinci-003";
const OPENAI_CURIE_MODEL = "text-curie-001";
const END_OF_TEXT = "\n\n";
const INTERACTION_SEPARATOR = END_OF_TEXT + " ";
const LETS_TALK = "Vamos a conversar. " + INTERACTION_SEPARATOR;
const SALUTATION = "Hola, ¿de qué quieres hablar?";
const SALUTATION_REPROMPT = "¿Algo te ha llamado la atención últimamente?";
const STOP_COMMANDS = ["es suficiente", "adios", "nos vemos", "basta", "eso es todo"];
const STOP_CONFIRMATION_FAREWELL = "Entendido, fue un placer. ";
const SIMPLE_FAREWELL = "Nos vemos. ";
const CONFIRMATION = ["Está bien. ", "De acuerdo. ", "Seguro. "];
const CONFIRMATION_REPROMPT = "¿Entonces?";
const REPEAT_COMMAND = "repite";
const WAIT_COMMANDS = ["espera", "sigue esperando"];
const BREAK_10_SECS = "<break time='10s'/>";
const WAITING_REPROMPT = "<amazon:effect name='whispered'>Sigo aquí.</amazon:effect>";
const NOT_UNDERSTOOD = ["Lo lamento, no te entendí.", "Lo lamento..., creo que no entendí."];
const NOT_UNDERSTOOD_REPROMPT = ["¿Tienes algo más que decir?", "Lo lamento..., creo que no entendí."];
const EJEM_REPROMPT = "Ejem. ";
const ETC = " etcétera. ";
const TIMEOUT = "Sigo pensando. ¿Sigues ahí?";
const COMPLEX_TOPIC = "No se me viene nada a la mente, ¿tú que piensas?";
const DATA = "data";

// # # # Handlers

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
	const attributes = handlerInput.attributesManager.getSessionAttributes();
	attributes.stillThinking = false;
	attributes.previousUserComment = "";
	attributes.lastUserComment = "";
	attributes.lastAlexaComment = LETS_TALK;
	handlerInput.attributesManager.setSessionAttributes(attributes);
    return handlerInput.responseBuilder
			  .speak(SALUTATION)
			  .reprompt(SALUTATION_REPROMPT)
			  .getResponse();
  },
};

const ResponseHandler = {
  canHandle(handlerInput) {
    console.log("Inside ResponseHandler");
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
           request.intent.name === 'UndefinedIntent';
  },
  async handle(handlerInput) {
    console.log("Inside ResponseHandler - handle");
  	
	// Retrieving user input
  	let slots = handlerInput.requestEnvelope.request.intent.slots;
	var slotValue = "";
	if(slots["Undefined"] != null) {
		slotValue = slots["Undefined"].value;
	}
	
	console.log("SlotValue: " + slotValue);
	
	// Stopping Skill command
	for(var stop in STOP_COMMANDS) {
		if(slotValue.toLowerCase().startsWith(STOP_COMMANDS[stop])) {
			return handlerInput.responseBuilder.speak(STOP_CONFIRMATION_FAREWELL)
					.withShouldEndSession(true)
					.getResponse();
		}
	}
	
	// Waiting command
	for(var wait in WAIT_COMMANDS) {
		if(slotValue.toLowerCase().startsWith(WAIT_COMMANDS[wait])) {
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)] + BREAK_10_SECS)
				.reprompt(BREAK_10_SECS + WAITING_REPROMPT)
				.getResponse();
		}
	}
	
	const attributes = handlerInput.attributesManager.getSessionAttributes();
	
	// Repeating last AI response command
	if(slotValue.toLowerCase().startsWith(REPEAT_COMMAND)) {
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)] + attributes.lastAlexaComment)
				.reprompt(CONFIRMATION_REPROMPT)
				.getResponse();
	}
	
	if(!slotValue.endsWith(".")) {
		slotValue += ". ";
	}
	
	// Preparing prompt with context
	var talk;
	if(attributes.stillThinking){
		talk = attributes.previousUserComment
				+ attributes.lastAlexaComment
				+ attributes.lastUserComment;
	} else {
		talk = attributes.lastUserComment
				+ attributes.lastAlexaComment
				+ slotValue;
		attributes.previousUserComment = attributes.lastUserComment;
		attributes.lastUserComment = slotValue + INTERACTION_SEPARATOR;
	}
	console.log("Talk: " + JSON.stringify(talk));
	
	try {
		// OpenAI request function
		const openai = function(message, tokens, result, model) {
			var req = https.request(options, (res) => {
				res.on('data', (data) => {
					console.log("Response in tokens " + tokens);
					console.log("Response is " + data);
					result[DATA] = data;
				});
			}).on('error', (e) => {
				console.error("Error in tokens " + tokens);
				console.error(e);
			});;
			req.on('timeout', () => {
				console.log("Timeout happened in tokens " + tokens);
				req.abort();
			});
			req.write(JSON.stringify({
				model: model,
				prompt: message,
				temperature: 0.5,
				max_tokens: tokens
			}));
			req.end();
		}
		
		// Two max_tokens to ensure retrieve an answer in 8 seconds
		var longResult = {"data": null};
		var shortResult = {"data": null};
		if(attributes.stillThinking) {
			openai(talk + END_OF_TEXT, DEFAULT_RESPONSE_LENGTH, longResult, OPENAI_DAVINCI_MODEL);
			openai(talk + END_OF_TEXT, DEFAULT_RESPONSE_LENGTH, shortResult, OPENAI_CURIE_MODEL);
		} else {
			openai(talk + END_OF_TEXT, INCREASED_RESPONSE_LENGTH, longResult, OPENAI_DAVINCI_MODEL);
			openai(talk + END_OF_TEXT, DEFAULT_RESPONSE_LENGTH, shortResult, OPENAI_DAVINCI_MODEL);
		}
		attributes.stillThinking = false;
		
		// Checking if longest max_tokens answer before 5 seconds
		var completion = null;
		for(var i = 0; i < TIMEOUT_VALUE; i++) {
			await new Promise(resolve => setTimeout(resolve, i * 500));
			if(longResult[DATA] != null) {
				completion = longResult[DATA];
				break;
			}
		}
		if(completion === null) {
			completion = shortResult[DATA];
		}
		if(completion == null || completion == "") {
			attributes.stillThinking = true;
			handlerInput.attributesManager.setSessionAttributes(attributes);
			return handlerInput.responseBuilder.speak(TIMEOUT)
				.reprompt(EJEM_REPROMPT)
				.getResponse();
		}
		
		var answer = JSON.parse(completion).choices[0].text;
		console.log("Alexa answer: " + JSON.stringify(answer));
		
		// Preventing AI to make multiple questions one after another
		var questionIndex = answer.search(/\?/g);
		if(questionIndex != -1) {
			answer = answer.substring(0, questionIndex + 1);
		}
		
		// Preventing incomplete responses
		if(!answer.endsWith("?") && !answer.endsWith("!")) {
			var lastComma = answer.lastIndexOf(",");
			var lastPoint = answer.lastIndexOf(".");
			var lastExclamation = answer.lastIndexOf("!");
			if(lastPoint == -1 && lastComma != -1) {
				answer = answer.substring(0, lastComma + 1) + ETC;
			} else if(lastExclamation > lastPoint) {
				answer = answer.substring(0, lastExclamation + 1);
			} else {
				answer = answer.substring(0, lastPoint + 1);
			}
		}
		
		if(answer == "") {
			attributes.stillThinking = true;
			handlerInput.attributesManager.setSessionAttributes(attributes);
			return handlerInput.responseBuilder.speak(COMPLEX_TOPIC)
				.reprompt(EJEM_REPROMPT)
				.getResponse();
		}
		
		// Cleaning AI response
		answer = answer.replace(/[\n|\t]/g, '')						// No new lines and tabs
					   .replace(/\.[\s]*/g, '. ')					// Points without spaces
					   .replace(/(\:\s*\-\s*)+/g, '. ')				// Start of list ": -"
					   .replace(/([\.\s]+\-\s*)+/g, ', ')			// Lists items "- one. - two.-three-four -five"
					   .replace(/([0-9]+\.)$/g, ETC)				// Separate numbered lists "8. One 9. Two..."
					   .replace(/\&/g, " y ")						// Alexa cannot say &
					   .replace(/([0-9]+\.)/g, ", ");				// Short numbered list ". 9.$"
		
		answer += INTERACTION_SEPARATOR;
		console.log("Alexa processed answer: " + JSON.stringify(answer));
		
		// Storing just the first 100 characters and last 100 characters for next request
		attributes.lastAlexaComment = answer;
		if(answer.length > 200) {
			attributes.lastAlexaComment = answer.substring(0, 99) 
										+ answer.substring(answer.length - 101, answer.length - 1);
		}
		console.log("Alexa stored answer: " + JSON.stringify(attributes.lastAlexaComment));
		handlerInput.attributesManager.setSessionAttributes(attributes);
		
		// Retrieving complete AI response
		return handlerInput.responseBuilder.speak(answer)
				.reprompt(EJEM_REPROMPT)
				.getResponse();
	} catch(error) {
		console.log("Error in OpenAI request: " + error);
	}
	
	return handlerInput.responseBuilder.speak(NOT_UNDERSTOOD[getRandom(2)])
			.reprompt(NOT_UNDERSTOOD_REPROMPT[getRandom(2)])
			.getResponse();
  }
};

const ExitHandler = {
  canHandle(handlerInput) {
    console.log("Inside ExitHandler");
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && (
              request.intent.name === 'AMAZON.StopIntent' ||
              request.intent.name === 'AMAZON.PauseIntent' ||
              request.intent.name === 'AMAZON.CancelIntent'
           );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(SIMPLE_FAREWELL)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('La sesión terminó porque ${JSON.stringify(handlerInput.requestEnvelope)}');
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    console.log("Inside ErrorHandler");
    return true;
  },
  handle(handlerInput, error) {
    console.log("Inside ErrorHandler - handle");
    console.log("Error handled: ${JSON.stringify(error)}");
    console.log("Handler Input: ${JSON.stringify(handlerInput)}");
    return handlerInput.responseBuilder
      .speak(NOT_UNDERSTOOD[getRandom(2)])
      .reprompt(NOT_UNDERSTOOD_REPROMPT[getRandom(2)])
      .getResponse();
  },
};

// # # # Helper methods

function getRandom(max) {
	return Math.floor(Math.random() * max);
}

// # # # Exporting AWS Lambda Function

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    ResponseHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
