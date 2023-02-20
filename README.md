# Alexa Davinci (GPT-3) Conversation Skill

If that's your intention, I hope this documentation can help you to implement an Alexa skill that uses the OpenAI (GPT-3) Davinci model.

### About the development philosophy

The purpose of the OpenAI Davinci AI used here is basically text completion, this is a relevant note to approach the challenges related with its implementation, and to understand that, as it is capable of completing conversation-like texts it is possible to simulate a conversation with it.

Maybe this kind of AI won't be able to show us something that we don't already know, but it certainly is capable of helping us to make the best use of what we already have.

### Disclaimer
- This is **just me sharing personal notes**, for the most of them I include the source and references.
- My **notes aren't refined**, and I'm not expecting to continue working on them now that I achieved my goal of connecting Alexa with OpenAI.
- Docs are in English, but **string literals in code are in Spanish**.
- The **coding** is made for **NodeJS** and **lacks of refinement**, though it is ready right now for conversation.
- Everytime I test it I find new **failure scenarios** (the most common are the ones related with lists), probably you will too.
- The best use for this Alexa Skill is to make consecutive questions, build context and ask. Davinci AI **model isn't good for human/natural/engaging conversations**, as it cannot simulate humor or any other emotion-focused intention.

### How to execute the project
\* https://github.com/jpartida97/alexa-davinci-skill/blob/main/docs/How-To-Execute.md

### Challenges integrating GPT-3 with Alexa
\* https://github.com/jpartida97/alexa-davinci-skill/blob/main/docs/Challenges-Integrating-GPT-3-With-Alexa.md
- Dealing with incomplete/cut answers.
- Dealing with lists.
- 8 seconds to provide a response.
- Conversation prompt format.
- Questioning loop and monotonous conversations.

### How to talk with Alexa-Davinci skill
- "Alexa, abre conversación inteligente." - (to open skill)
- "Repite." - (to repeat the previous AI response)
- "Espera." - (to make Alexa wait 30 seconds for an answer)
- "Eso es todo. " - (to stop the Alexa Skill)
