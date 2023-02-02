const Alexa = require('ask-sdk-core');
const https = require('https');

const options = {
	hostname: 'api.openai.com',
	port: 443,
	path: '/v1/completions',
	method: 'POST',
	headers: {
		'content-type': "application/json",
		'authorization': "Bearer USE-HERE-YOUR-OWN-SECRET-API-KEY"
	},
	timeout: 5000
};

// # # # String literals

const OPEN_AI_MODEL = "text-davinci-003";
const END_OF_TEXT = "\n\n";
const INTERACTION_SEPARATOR = END_OF_TEXT + " ";
const LETS_TALK = "Vamos a conversar. " + INTERACTION_SEPARATOR;
const SALUTATION = "Hola, ¿de qué quieres hablar?";
const SALUTATION_REPROMPT = "¿Algo te ha llamado la atención últimamente?";
const DEFAULT_RESPONSE_LENGTH = 70;
const INCREASED_RESPONSE_LENGTH = 140;
const STOP_COMMANDS = ["es suficiente", "adios", "nos vemos", "detente", "detente", "para", "es suficiente", "eso es todo"];
const STOP_CONFIRMATION_FAREWELL = "Entendido, fue un placer. ";
const SIMPLE_FAREWELL = "Nos vemos. ";
const INCREASE_ANSWER_LENGTH_COMMAND = "habla más";
const CONFIRMATION = ["Está bien. ", "De acuerdo. ", "Seguro. "];
const CONFIRMATION_REPROMPT = "¿Entonces?";
const DECREASE_ANSWER_LENGTH_COMMAND = "habla menos";
const REPEAT_COMMAND = "repite";
const WAIT_COMMANDS = ["espera", "sigue esperando"];
const BREAK_10_SECS = "<break time='10s'/>";
const WAITING_REPROMPT = "<amazon:effect name='whispered'>Sigo aquí.</amazon:effect>";
const NOT_UNDERSTOOD = ["Lo lamento, no te entendí.", "Lo lamento..., creo que no entendí."];
const NOT_UNDERSTOOD_REPROMPT = ["¿Tienes algo más que decir?", "Lo lamento..., creo que no entendí."];
const EJEM_REPROMPT = "Ejem. ";
const ETC = " etcétera. ";
const TIMEOUT = "Sigo pensando. ¿Sigues ahí?";

// # # # Handlers

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
	const attributes = handlerInput.attributesManager.getSessionAttributes();
	attributes.lastAlexaComment = LETS_TALK;
	attributes.lastUserComment = "";
	attributes.stillThinking = false;
	attributes.previousUserComment = "";
	attributes.responseLength = DEFAULT_RESPONSE_LENGTH;
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
  	for (const slot in slots) {
  		console.log("SlotName: " + slot.toString().toLowerCase());
  		if(slot.toString().toLowerCase() == "undefined") {
  			console.log("SlotValue: " + slots[slot].value);
  			if(slots[slot].value !== undefined) {
  				slotValue = slots[slot].value;
  			}
  			break;
  		}
  	}
	
	// Stopping Skill command
	for(index in STOP_COMMANDS) {
		if(slotValue.toLowerCase().startsWith(STOP_COMMANDS[index])) {
			return handlerInput.responseBuilder.speak(STOP_CONFIRMATION_FAREWELL)
					.withShouldEndSession(true)
					.getResponse();
		}
	}
	
	const attributes = handlerInput.attributesManager.getSessionAttributes();
	
	// Increasing answer length command
	if(slotValue.toLowerCase().startsWith(INCREASE_ANSWER_LENGTH_COMMAND)) {
		attributes.responseLength = INCREASED_RESPONSE_LENGTH;
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)])
				.reprompt(CONFIRMATION_REPROMPT)
				.getResponse();
	}
	
	// Stablishing default answer length command
	if(slotValue.toLowerCase().startsWith(DECREASE_ANSWER_LENGTH_COMMAND)) {
		attributes.responseLength = DEFAULT_RESPONSE_LENGTH;
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)])
				.reprompt(CONFIRMATION_REPROMPT)
				.getResponse();
	}
	
	// Repeating last AI response command
	if(slotValue.toLowerCase().startsWith(REPEAT_COMMAND)) {
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)] + attributes.lastAlexaComment)
				.reprompt(CONFIRMATION_REPROMPT)
				.getResponse();
	}
	
	// Waiting command
	for(index in WAIT_COMMANDS) {
		if(slotValue.toLowerCase().startsWith(WAIT_COMMANDS[index])) {
		return handlerInput.responseBuilder.speak(CONFIRMATION[getRandom(3)] + BREAK_10_SECS)
				.reprompt(BREAK_10_SECS + WAITING_REPROMPT)
				.getResponse();
		}
	}
	
	if(!slotValue.endsWith(".")) {
		slotValue += ". ";
	}
	
	try {
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
		
		// Making request to OpenAI
		var longResult = {data: null};
		var shortResult = {data: null};
		
		const openai = function(message, tokens, result) {
			var req = https.request(options, (res) => {
				res.on('data', (data) => {
					console.error("Response in tokens " + tokens);
					result["data"] = data;
				});
			}).on('error', (e) => {
				console.error("Error in tokens " + tokens);
			});
			req.on('timeout', () => {
				console.log("Timeout happened in tokens " + tokens);
				req.abort();
			});
			req.write(JSON.stringify({
				model: OPEN_AI_MODEL,
				prompt: message,
				temperature: 0.5,
				max_tokens: tokens
			}));
			req.end();
		}
		
		var longLength = INCREASED_RESPONSE_LENGTH;
		var shortLength = DEFAULT_RESPONSE_LENGTH;
		if(attributes.stillThinking) {
			longLength = Math.ceil(longLength / 2);
			shortLength = Math.ceil(shortLength / 2);
		}
		attributes.stillThinking = false;
		openai(talk + INTERACTION_SEPARATOR, longLength, longResult);
		openai(talk + INTERACTION_SEPARATOR, shortLength, shortResult);
		
		var completion = null;
		
		for(i = 0; i < 5; i++) {
			await new Promise(resolve => setTimeout(resolve, i * 500));
			if(longResult["data"] != null) {
				completion = longResult["data"];
				break;
			}
		}
		
		if(completion === null) {
			completion = shortResult["data"];
		}
		
		if(completion === null) {
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
			// Preventing comma separated lists to finish incomplete
			var lastComma = answer.lastIndexOf(",");
			if(answer.lastIndexOf(".") == -1 && lastComma != -1) {
				answer = answer.substring(0, lastComma + 1) + ETC;
			} else {
				answer = answer.substring(0, answer.lastIndexOf(".") + 1);
			}
		}
		
		// Cleaning AI response
		answer = answer.replace(/[\n|\t]/g, '')						// New lines and tabs
					   .replace(/\.[\s]*/g, '. ')					// Points without spaces
					   .replace(/(\:\s\-\s)+/g, '. ')				// Start of list ": -"
					   .replace(/([\.\s]+\-\s*)+/g, ', ')			// Lists items "- one. - two.-three-four -five"
					   .replace(/([0-9]+\.)$/g, ETC)				// Separate numbered lists "8. One 9. Two..."
					   .replace(/\&/g, " y ")
					   .replace(/([0-9]+\.)/g, ", ");				// Short numbered list ". 9.$"
		
		var result = answer + INTERACTION_SEPARATOR;
		console.log("Alexa processed answer: " + JSON.stringify(result));
		
		// Storing just the first 100 characters and last 100 characters for next request
		attributes.lastAlexaComment = result;
		if(result.length > 200) {
			attributes.lastAlexaComment = result.substring(0, 99) 
										+ result.substring(result.length - 101, result.length - 1);
		}
		console.log("Alexa stored answer: " + JSON.stringify(attributes.lastAlexaComment));
		handlerInput.attributesManager.setSessionAttributes(attributes);
		
		// Retrieving complete AI response
		return handlerInput.responseBuilder.speak(result)
				.reprompt(EJEM_REPROMPT)
				.getResponse();
	} catch(error) {
		console.log("Error: " + error);
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
    return request.type === `IntentRequest` && (
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
    console.log(`La sesión terminó porque ${JSON.stringify(handlerInput.requestEnvelope)}`);
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
    console.log(`Error handled: ${JSON.stringify(error)}`);
    console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);
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
