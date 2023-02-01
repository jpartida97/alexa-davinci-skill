# How to execute the project

In the [MS Word documents](https://github.com/jpartida97/alexa-davinci-skill/tree/main/docs) you can find unrefined notes about how I implemented this code and how to execute it, here I leave general notes about how to execute these files.

1. **Enter** to the Alexa Development Console (https://developer.amazon.com/alexa/console/ask) to administer your skills (created here or in Alexa Skills Blueprints).
2. **Click** on "_Create Skill_".
    - Specify Skill Name
    - Type of experience: "_Other_"
    - Model: "_Custom_"
    - Hosting services: "_Alexa-hosted (Node.js)_"
    - Template: "_Start from Scratch_"
4. Once in the Alexa Development Console, go to [_Interaction Model > JSON Editor_] and **paste the code** in the file [/models/alexa_davinci_skill_interaction_model.json](https://github.com/jpartida97/alexa-davinci-skill/blob/a4b3e2c440b95a0adc32887964588c50ed0e1b98/models/alexa_davinci_skill_interaction_model.json).
    - If you want to change the invocation phrase go to [_Custom > Invocations > Skill Invocation Name_].
    - I configure Routines in the Alexa phone app to open the Skill with any phrase I want.
      <br/> \* Use the "_Personalized_" action to make Alexa open the Skill.
6. **Click** on "_Save Model_" button.
7. **Enter** to AWS Services (https://aws.amazon.com/es/console/).
    - It is required to enter a payment method, it is required this to be verified successfully by AWS before accessing the AWS Lambda interfaces.
    - Here you can see the free tier available resources -> https://aws.amazon.com/es/free/.
    - From Alexa Development Console side, you can see the costs in the [Hosting](https://developer.amazon.com/alexa/console/ask/editor/usage) tab.
9. **Log-in** into the console (type "_Lambda_" in the search bar).
10. **Create** new Lambda function.
    - Select "_Author from scratch_" (or "_Crear desde cero_" in Spanish)
    - Function name (e.g. "_open-alexa-skill_", "_alexa-ai_", etc.)
    - Tiempo de ejecución: "_Node.js 18.x_"
    - Architecture: "_x86_64_"
11. **Configure** the ARN of the Lambda function (e.g. "arn:aws:lambda:us-east-#:############:function:<FunctionName>") in the [Alexa Development Console > Custom > Endpoint > Default Region], you can find it at _Function Overview_ in the AWS Lambda function page.
12. **Change** the _name_ field to match the function name (e.g. "_open-alexa-skill_") in the [package.json](https://github.com/jpartida97/alexa-davinci-skill/blob/main/lambda/custom/package.json) file.
13. **Sign Up** at OpenAI API (https://openai.com/api/).
    <br/> \* The first $18 US dollars are free (it is in that way when the file was updated).
14. **Create** new API key (https://beta.openai.com/account/api-keys).
15. **Change** the "_USE-HERE-YOUR-OWN-SECRET-API-KEY_" literal in the [index.js](https://github.com/jpartida97/alexa-davinci-skill/blob/main/lambda/custom/index.js) file with your OpenAI API key from (https://beta.openai.com/account/api-keys).
16. **Install** NodeJS and npm in your local.
    <br/> \* https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
14. **Execute** `$ npm install`
    - **Verify** the _node_modules_ directory was created, in my case these dependencies were dowloaded...
      -  ask-sdk-core
      -  ask-sdk-model
      -  ask-sdk-runtime
      -  asynckit
      -  axios
      -  combined-stream
      -  delayed-stream
      -  follow-redirects
      -  form-data
      -  https
      -  mime-db
      -  mime-types
      -  openai
15. **Zip** the project files (node_modules dir, index.js, package.json and package-lock.json) into a single file.
    <br/> \* Do not zip the entire files' container dir, the zip should contain the files in its root.
16. **Add** Alexa trigger from [_Function Overview > Add Trigger_].
    <br/> \* Take Skill ID from [_Alexa Development Console > Custom > Endpoint_].
18. **Upload** the _.zip_ file with the [_Code source > Upload from > .zip file_] option.
    <br/> \* Or [_Código fuente > Cargar desde > Archivo .zip_] in Spanish.
19. **Click** on "_Deploy_" button.
20. Go to "_Monitor_" tab and click on "_View CloudWatch logs_" to **see the logs** after every execution of the Skill.
