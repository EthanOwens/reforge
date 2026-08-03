Features to add/change:
- UI Changes
  - Move the variations, export/import, and AI-tailored suggestions to a sidebar with tabs
    - Files tab - has Variations options and import/export
      - export should be a drop down where you select the export type then when you click the type it will export as that file format
      - the import functionality should remain the same 
      - The variation name should be auto-filled as "<firstName> <lastName> - <jobTitle>", for instance "Ethan Owens - Graphic Designer" could be one. This will impact the file name and the saved variation name. Combine the "Name" and "Job title" boxes into 1 box for this variation naming scheme. The variation text box should update in real time when the name and job title sections in the schema are updated. This auto-fill functionality can be toggled off in the settings menu (see below)
    - AI-tailored tab has just the job description paste box and the "get suggestions" button
  - In the schema where there are an emojis (phone, star, maps pin, briefcase, etc) you should be able to click it to open up a menu to select an emoji to replace it with
  - Add a settings cog wheel in the bottom left
    - There should be 2 tabs at the beginning: "General", "Model API"
      - In the general tab include:
        - Toggle for auto-fill variation name
      - In the Model API tab include: 
        - Button to add new API provider 
          - Create a censored text box to paste an api key into. There will be an option to toggle the censor of the pasted characters and a save button. When saved it should auto detect which provider the key is from and show it as "<providerName> - API Key". You should be able to edit api key and delete api key as options
          - For each provider it should have a counter for the accumulated api costs for that provider have been from using the tool
  - Make a landing page for this application. The default landing page shoudl be where you go originally and should let you choose between resume maker, and other utility features
    - In the resume maker it should show the various schemas you were using, then after clicking on the schema it will show your variations (with the option to favorite any that will go in a top row for only favorites).
- Misc Changes
  - Add in .gdoc file format



Bugs to fix:
- The formatting for the pdf donwload adds in a white border around the resume and text like "reforge" and "1 of 1" around the edges. I attached a .png image of this. It should ONLY have exactly what the schema is. Look into if the print dialog is the best way of doing this or if another method will be cleaner (even if a little more effort)
- Importing should scrape the schema for relevant information and paste it into the schema. I tried importing the .docx version of the same file and it completely changed the schema formatting