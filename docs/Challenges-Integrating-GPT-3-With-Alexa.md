# Challenges integrating GPT-3 with Alexa

In the [[docx] Alexa Integration with OpenAI (+Costs)](https://github.com/jpartida97/alexa-davinci-skill/tree/main/docs/%235%20Alexa%20Integration%20with%20OpenAI%20(%2BCosts).docx) you can find unrefined 
notes about this, here a list of challenges faced integrating GPT-3 with Alexa. 

1. **Dealing with incomplete/cut answers.**
   <br/> \* It is usual to get responses finishing without completing a phrase.
   <br/> **\* Solution:**
   - I just remove the last sentence when this happens, everything after these characters [?!\.,] that does not end with a point.
        ```
        if(!answer.endsWith("?") && !answer.endsWith("!")) {
            var lastComma = answer.lastIndexOf(",");
            var lastPoint = answer.lastIndexOf(".");
            var lastExclamation = answer.lastIndexOf("!");
            if(lastPoint == -1 && lastComma != -1) {
                answer = answer.substring(0, lastComma + 1) + " etcetera. ";
            } else if(lastExclamation > lastPoint) {
                answer = answer.substring(0, lastExclamation + 1);
            } else {
                answer = answer.substring(0, lastPoint + 1);
            }
        }
        ``` 
     <br/>
2. **Dealing with lists.**
   <br/> \* It doesn't sound natural to hear lists items with the retrieved formats.
   <br/> **\* Solution:**
   - I interchanged the numbers and hyphens with commas.
    <br/><br/>
3. **8 seconds to provide a response.**
   <br/> \* In this scenario the Alexa Skill closes the connection with AWS Lambda ([#4-tips-for-implementing-device-discovery-in-your-smart-home-skills](https://developer.amazon.com/en-US/blogs/alexa/device-makers/2019/04/4-tips-for-implementing-device-discovery-in-your-smart-home-skills)).
   <br/> **\* Solution:**
    - I tried to use an **async function** but it seems the Lambda function won’t retrieve a response until all the threads (Promises) complete their execution.
    - I’ll **cut the context** to include only the first 100 chars, and the last 100, usually the AI says the topic in the first statement.
    - The  complexity of the topic increases the time of processing, **questions about Marxism can take more than 10 seconds**.
    - I decided to use directly the **HTTPS NodeJS package** to make the request and establish a timeout for the request.
    - To prevent empty responses the Skill makes **two requests** with different parameters (using less max_tokens or changing the model to Curie) 
      and retrieves the longest response in the 8 seconds time window.
      <br/><br/>
4. **Conversation prompt format.**
   <br/> \* GTP wasn’t completing the text as a conversation all the time. Sometimes it just continues completing 
   the last messages if the separator is a new line.
   <br/> **\* Solution:**
   - To **use tags** in order to differentiate the conversation participants, one for the user and another for the model.
        ```
        [Usuario] Hola, ¿cómo estás?
        [Modelo] Hola, estoy bien, ¿y tú?
        ```
   - It is even possible to **define a personality** for the model just by changing the name.
        ```
        [Persona_A] Hola, ¿cómo estás?
        [Tony Stark] Hola, estoy bien, ¿y tú?
        ```
   - I added a portion of text at the beginning of the prompt to specify the personality of the Model participant.
        ```
        Alexa es amable y le gusta la ciencia ficción.
     
        [Persona_A] Hola, ¿cómo estás?
        [Alexa] Hola, estoy bien, ¿y tú?
        ```
     <br/>
5. **Questioning loop and monotonous conversations.**
   <br/> \* The model usually enters into a questioning loop, to every answer it responds with a question, it is a boring 
   conversation pattern.
   <br/> **\* Solution:**
    - There’s a ½ probability of not permitting a question in the answer.
         ```
         req.write(JSON.stringify({
             model: model,
             prompt: message,
             temperature: TEMPERATURE,
             max_tokens: tokens,
             stop: (getRandom(4) < 2) ? "¿" : null
         }));
         ```
   - I added a **intent modifier** with a random value like "explain", "ask" or "analyze", here also can be 
     induced a conversation topic.
        ```
        Alexa es amable y [random_modifier].
     
        [Persona_A] Hola, ¿cómo estás?
        [Alexa] Hola, estoy bien, ¿y tú?
        ```
     <br/>
5. **Keeping conversation context.**
   <br/> \* Sending the last interactions as context, along with the current user message is useful, but the big picture is lost really fast, and 
   this usually means having incoherent conversations.
   <br/> **\* Solution:**
    - I make another HTTP request to the model to summarize the conversation topic in few tokens, to include this in the beginning of the message.
        ```
        Dime el tema de conversación: {
        Alexa [random_modifier] y hablamos de: "[summaryzed_conversation_topic]".
        [Persona_A] qué opinas de los legos.
        [Alexa] Las figuras de Lego son una excelente forma de estimular la creatividad de los niños y de 
        desarrollar sus habilidades de construcción y de solución de problemas.
        }
        ``` 
    - I do not format this response and delimit the response inside double quotes.
        ```
        Alexa [random_modifier] y hablamos de: "[summaryzed_conversation_topic]".
        [Persona_A] qué opinas de los legos.
        [Alexa] Las figuras de Lego son una excelente forma de estimular la creatividad de los niños y de 
        desarrollar sus habilidades de construcción y de solución de problemas.
        ``` 
