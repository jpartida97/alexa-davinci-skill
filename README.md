# alexa-davinci-skill

If that's your intention, I hope this documentation can help you to implement an Alexa skill that uses the OpenAI Davinci model.

### About the development philosophy

The purpose of the OpenAI Davinci AI used here is basically text completion, this is a relevant note to approach the challenges related with its implementation, and to understand that, as it is capable of completing conversation-like texts it is possible to simulate a conversation with it.

Maybe this kind of AI won't be able to show us something that we don't already know, but it certainly is capable of helping us to make the best use of what we already have.

### Disclaimer
- This is **just me sharing personal notes**, for the most of them I include the source and references.
- My **notes aren't refined**, and I'm not expecting to continue working on them now that I achieved my goal of connecting Alexa with OpenAI.
- Docs are in English, but **string literals in code are in Spanish**.
- The **coding** is made for **NodeJS** and **lacks of refinement**, though it is ready right now for conversation.
- Everytime I test it I find new **fail scenarios** (the most common are the ones related with lists), probably you will too.

### How to execute the project
https://github.com/jpartida97/alexa-davinci-skill/blob/main/docs/How-To-Execute.md

### How to talk with Alexa-Davinci skill
- "Alexa, abre conversación inteligente." - (to open skill)
- "Repite." - (to repeat the previous AI response)
- "Espera." - (to make Alexa wait 30 seconds for an answer)
- "Eso es todo. " - (to stop the Alexa Skill)
