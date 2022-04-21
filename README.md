# Userscripts

Userscripts to be used with Tampermonkey or Greasemonkey

### How to install

* Make sure to have the [Tampermonkey extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) installed in your Chrome
* Open the desired script's file in Github by clicking on the filename
* Click on the "Open raw" icon on the top right
* Tampermonkey should open and ask whether you want to install the file

********

# Scripts

### REDIS Commander JSON Helper

#### Installation
* Click this link: https://github.com/Satoshi-Engineering/userscripts/raw/main/Redis_Commander_JSON_Helper.user.js
* Now you need to configure the __URL(s) of your instance(s) of REDIS Commander__ locally in your Tampermonkey
* Open the installed Userscript via "Installed Userscripts" and a click on "Redis Commander JSON Helper"
* Go to the "Settings" tab of the Userscript
* Add the desired URL(s) in the section "Includes/Excludes" -> "User includes"

#### Purpose
REDIS Commander (https://joeferner.github.io/redis-commander/) does not allow inline editing of JSON records. This userscript creates two buttons that, when clicked, pre-fill the REDIS command line with 
the key of the record and the path of the currently selected JSON key. The first button is to be used to enter a value, the second creates a command that sets the selected key to value `null`.
