Changes:
- Change to a base UI for the homepage like the example gui in reforge_gui.png. (navigation and confgiuration on the left. Selection for the tool in the top middle ribbon. And the main selection page in the center)
  - When clicking on the schema in the main section it should highlight it and show options on the left configuration section for things like "rename", "open", "delete", and "export". Double clicking will open the schema as well.
  - The top tool selection bar should have the section you're on highlighted. When entering the gui for the first time all should be unselected and the main section should be empty
  - When opening a schema it should take you to the similar gui for selecting the variations. This should also add a "back" option in the left navigation bar to go back to the selected tool main page. Clicking the tool in the top ribbon should also bring you back to the main page
- In the settings -> General, there should be style options. Options at the moment: light, dark, off-white, and system.
  - Off-white should use grays (like EAEAEA, and D5D5D5)
- The API key at the moment shows dots going off the api box. They should show the prefix (what defines it as a certain provider. Like sk-ant-...), then a few dots, then truncate it with an elipses