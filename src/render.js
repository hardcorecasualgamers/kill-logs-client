const { remote, shell } = require('electron')
const Tail = require('tail').Tail
const FolderObserver = require('./folderObserver')
const { dialog } = remote

// globals/defaults
const apiServerUrl = 'https://classic-kill-api.herokuapp.com'
// const apiServerUrl = 'http://localhost:3000'
const logo = document.getElementById('logo')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginForm = document.getElementById('loginForm')
const hSword = document.getElementById('hSword')
const aSword = document.getElementById('aSword')
const logoutBtn = document.getElementById('logoutBtn')
const loginContainer = document.getElementById('loginContainer')
const main = document.getElementById('main')
const dropbtn = document.getElementById('dropbtn')
const dropdownContent = document.getElementById('dropdownContent')
const characterText = document.getElementById('characterText')
const pathText = document.getElementById('pathText')
const popup = document.getElementById('popup')
const popup__inner_content = document.getElementById('popup__inner_content')

let locStorage = window.localStorage
let folder = locStorage.getItem('dir') || ''
let server = locStorage.getItem('server') || ''
let guild = locStorage.getItem('guild') || ''
let character = locStorage.getItem('character') || ''
let faction = locStorage.getItem('faction') || ''
let token = locStorage.getItem('token') || ''
let cAt = locStorage.getItem('cAt') || ''
let characterList = []

/**
 * toggles between login screen and main UI
 */
const toggleMainUI = () => {
    loginContainer.classList.toggle('hidden')
    logoutBtn.classList.toggle('hidden')
    main.classList.toggle('hidden')
}

/**
 * toggles loading animation
 */
const toggleLoadingSpinner = () => {
    hSword.classList.toggle('loadingH')
    aSword.classList.toggle('loadingA')
}

/**
 * deletes JWT, cAt, and resets local vars
 */
const deleteToken = () => {
    cAt, token = ''
    locStorage.setItem('cAt', '')
    locStorage.setItem('token', '')
}

const openWebsit = () => {
    shell.openExternal('https://www.killlogs.com/')
}

// Have logo link to Kill Logs by opening OS default browser
logo.onclick = openWebsit


// set character and directory text
if(character !== '' && server !== '') {
    characterText.textContent = `${character}-${server}`
}
pathText.textContent = folder

// If token is older than a week, delete it
if(cAt !== '' && Date.now() - cAt > 604800000) {
    deleteToken()
}

// Check if the user has token, and display appropriate UI
if(cAt !== '') {
    toggleMainUI()
}

// regular expressions
const lineRegEx = /^(?<month>\d{1,2})\/(?<day>\d{1,2}) (?<hour>\d{1,2}):(?<minute>\d{1,2}):(?<second>\d{2}).(?<millisecond>\d{3})  (?<event>[^,]+),(?<other>.+)/
const deathRegEx = /[^,]+,[^,]+,[^,]+,[^,]+,(?<victimId>[^,]+),"(?<victimName>[^,"]+)/
const meleeRegEx = /(?<sourceId>[^,]+),"(?<sourceName>[^,"]+)",([^,]+),([^,]+),(?<destId>[^,]+),"(?<destName>[^,"]+)",([^,]+),([^,]+),(?<infoId>[^,]+),(?<ownerId>[^,]+),(?<currHp>[^,]+),(?<maxHp>[^,]+),(?<attackPw>[^,]+),(?<spellPw>[^,]+),(?<armor>[^,]+),(?<powerType>[^,]+),(?<currPw>[^,]+),(?<maxPw>[^,]+),(?<pwCost>[^,]+),(?<posY>[^,]+),(?<posX>[^,]+),(?<mapId>[^,]+),(?<facing>[^,]+),(?<level>[^,]+),(?<damage>[^,]+),(?<rawAmount>[^,]+),(?<overkill>[^,]+),(?<school>[^,]+),(?<resisted>[^,]+),(?<blocked>[^,]+),(?<absorbed>[^,]+),(?<critical>[^,]+),(?<glancing>[^,]+),(?<crushing>[^,]+)/
const rangeRegEx = /(?<sourceId>[^,]+),"(?<sourceName>[^,"]+)",([^,]+),([^,]+),(?<destId>[^,]+),"(?<destName>[^,"]+)",([^,]+),([^,]+),(?<spellId>[^,]+),"(?<spellName>[^,"]+)",([^,]+),(?<infoId>[^,]+),(?<ownerId>[^,]+),(?<currHp>[^,]+),(?<maxHp>[^,]+),(?<attackPw>[^,]+),(?<spellPw>[^,]+),(?<armor>[^,]+),(?<powerType>[^,]+),(?<currPw>[^,]+),(?<maxPw>[^,]+),(?<pwCost>[^,]+),(?<posY>[^,]+),(?<posX>[^,]+),(?<mapId>[^,]+),(?<facing>[^,]+),(?<level>[^,]+),(?<damage>[^,]+),(?<rawAmount>[^,]+),(?<overkill>[^,]+),(?<school>[^,]+),(?<resisted>[^,]+),(?<blocked>[^,]+),(?<absorbed>[^,]+),(?<critical>[^,]+),(?<glancing>[^,]+),(?<crushing>[^,]+)/
const serverRegEx = RegExp(`(?<name>[^-]+)-(?<server>${server})`)

// =========================
// Setup user authentication
const logout = () => {
    locStorage.clear();
    toggleMainUI()
}

logoutBtn.onclick = logout

const login = async e => {
    e.preventDefault()
    toggleLoadingSpinner()
    const email = emailInput.value
    const password = passwordInput.value
    emailInput.value = ''
    passwordInput.value = ''
    // fetch user info
    try {
        // Show spinner while making network request
        const response = await fetch(`${apiServerUrl}/api/users/signin`, {
          body: JSON.stringify({ email, password }),
          mode: 'cors',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
        });
        // Parse body as json
        const json = await response.json();
        if (json.token) {
            // save token
            token = json.token
            locStorage.setItem('token', token)
            cAt = Date.now() - 10000
            locStorage.setItem('cAt', cAt)
            toggleMainUI()
            toggleLoadingSpinner()
            return;
        }
        if (json.error) {
            throw new Error(json.error);
        }
        // If no json returned throw error
        throw new Error('something went wrong');
      } catch (error) {
        toggleLoadingSpinner()
        let msg;
        if (error.name === 'SyntaxError') {
          msg = 'You have reached your max number of server requests. Try again in a few minutes.';
        } else if (error.name === 'TypeError') {
          msg = 'Check your internet connection try again.';
        } else {
          msg = `${error.name} - ${error.message}`;
        }
        // show error popup
        popup__inner_content.textContent = msg
        popup.classList.toggle('showPopup')
        const handler = e => {
            popup.classList.toggle('showPopup')
            window.removeEventListener('click', handler)
        }
        window.addEventListener('click', handler)
        console.error(error);
      }
}

loginForm.addEventListener('submit', login)

// ===================
// Set up kill parsing
const tempEvents = []
const savedEvents = []
const killReports = []

/**
 * parses and stores a line of text if it contains a damage or death event on player's server
 * @param {string} line - the text to be parsed
 */
const parseLine = (line) => {
    // first split the line into a more manageable part
    const match = line.match(lineRegEx)
    if (match) {
        const { month, day, hour, minute, second, millisecond, event, other } = match.groups
        // check if the match contains a damage or death event
        switch (event) {
            case 'UNIT_DIED':
                const deathMatch = other.match(deathRegEx)
                if (deathMatch) {
                    const { victimName } = deathMatch.groups
                    // push into tempEvents if this was a kill on our server
                    const isOurServer = serverRegEx.test(victimName)
                    if (isOurServer) tempEvents.push({ month, day, hour, minute, second, millisecond, event, victimName })
                    // console.log(victimName + " died.")
                } else {
                    console.error('Error parsing death event')
                }
                break
            case 'SWING_DAMAGE':
                const meleeMatch = other.match(meleeRegEx)
                if (meleeMatch) {
                    const { sourceName, destName, posX, posY, mapId, damage } = meleeMatch.groups
                    // push into tempEvents if this was a melee on our server
                    const isOurServer = serverRegEx.test(sourceName) && serverRegEx.test(destName)
                    if (isOurServer) tempEvents.push({ month, day, hour, minute, second, millisecond, event, sourceName, destName, posX, posY, mapId, damage })
                    // console.log(sourceName + " melees " + destName + " for " + damage)
                } else {
                    console.error('Error parsing melee damage event')
                }
                break
            case 'RANGE_DAMAGE':
            case 'SPELL_DAMAGE':
            case 'SPELL_PERIODIC_DAMAGE':
            case 'DAMAGE_SHIELD':
                const rangeMatch = other.match(rangeRegEx)
                if (rangeMatch) {
                    const { sourceName, destName, spellName, posX, posY, mapId, damage } = rangeMatch.groups
                    // push into tempEvents if this was a ranged damage on our server
                    const isOurServer = serverRegEx.test(sourceName) && serverRegEx.test(destName)
                    if (isOurServer) tempEvents.push({ month, day, hour, minute, second, millisecond, event, sourceName, destName, spellName, posX, posY, mapId, damage })
                    // console.log(sourceName + " hits " + destName + " with " + spellName + " for " + damage)
                } else {
                    console.error('Error parsing ranged damage event')
                }
        }
    } else {
        console.error('Error parsing line')
    }
}

/**
 * Looks through savedEvents and attempts to find a death and the killer
 * @returns {number} The index where the death occurred
 */
const findDeath = () => {
    // Find a death and make a death array slice from the previous 9 events
    let deathInd = savedEvents.findIndex(val => val.event === 'UNIT_DIED')
    if (deathInd === -1) return -1
    const victim = savedEvents[deathInd].victimName
    const cut = deathInd > 10 ? 10 : deathInd
    const deathSlice = savedEvents.slice(deathInd - cut, deathInd).reverse()
    // Now look through this slice and find the kill
    const kill = deathSlice.find(val => val.destName === victim)
    if (kill) {
        // get time of death
        const { month, day, hour, minute, second, millisecond, sourceName, destName, posX, posY, mapId, damage } = kill
        const killerName = sourceName.match(serverRegEx).groups.name
        if (killerName === character) {
            const victimName = destName.match(serverRegEx).groups.name
            const year = new Date().getFullYear()
            const timeOfDeath = new Date(year, Number(month)-1, day, hour, minute, second, millisecond)
            if (kill.event === 'SWING_DAMAGE') {
                killReports.push({ timeOfDeath, spellName: 'melee', posX, posY, mapId, damage, killerName, victimName, server, guild, faction })
            } else {
                killReports.push({ timeOfDeath, spellName: kill.spellName, posX, posY, mapId, damage, killerName, victimName, server, guild, faction })
            }
        }
    }
    savedEvents.splice(deathInd, 1)
    return deathInd
}

// ======================================
// Setup characters and populate dropdown
const chooseCharacter = e => {
    // parse out name/server/guild from id
    const arr = e.target.id.split('-')
    character = arr[0]
    server = arr[1]
    guild = arr[2]
    faction = arr[3]
    locStorage.setItem('character', character)
    locStorage.setItem('server', server)
    locStorage.setItem('guild', guild)
    locStorage.setItem('faction', faction)
    characterText.textContent = `${character}-${server}`
    dropdownContent.classList.toggle('show')
}

const getCharacters = async () => {
    if(characterList.length < 1) {
        try {
            // Show spinner while making network request
            toggleLoadingSpinner()
            const response = await fetch(`${apiServerUrl}/api/users/get-characters`, {
                mode: 'cors',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-auth-token': token
                },
            });
            if(response.ok === false) {
                throw new Error('Your session has expired. Please login again.')
            }
            console.log(response)
            // Parse body as json
            const json = await response.json();
            if(json.length > 0) {
                characterList = json
            }
            toggleLoadingSpinner()
        } catch (error) {
            toggleLoadingSpinner()
            let msg
            if (error.name === 'SyntaxError') {
                msg = 'You have reached your max number of server requests. Try again in a few minutes.';
            } else if (error.name === 'TypeError') {
                msg = 'Check your internet connection try again.';
            } else {
                msg = `${error.name} - ${error.message}`;
            }
            // show error popup
            popup__inner_content.textContent = msg
            popup.classList.toggle('showPopup')
            const handler = e => {
                popup.classList.toggle('showPopup')
                window.removeEventListener('click', handler)
            }
            window.addEventListener('click', handler)
            console.error(error);
        }
        // populate dropdown once
        for (let i = 0; i < characterList.length; i++) {
            const btn = document.createElement('button')
            btn.setAttribute('id', `${characterList[i].name}-${characterList[i].server}-${characterList[i].guild || ''}-${characterList[i].faction}`);
            btn.textContent = `${characterList[i].name}-${characterList[i].server}`
            btn.className = 'dropdown-item'
            btn.onclick = chooseCharacter
            dropdownContent.appendChild(btn)
        } 
    }
dropdownContent.classList.toggle('show')
}

dropbtn.onclick = getCharacters

// =========================================
// Set up dialog to get combat log directory
const dirBtn = document.getElementById('dirBtn')
const getDir = async () => {
    const dialogPromise = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if(dialogPromise.filePaths[0] && dialogPromise.filePaths[0] != ''){
        folder = pathText.textContent = dialogPromise.filePaths[0]
        locStorage.setItem('dir', folder)
    }
}
dirBtn.onclick = getDir

// ========================
// Setup folder observation
const folderObserver = new FolderObserver()

// Toggle logging
let watcher
const startLogging = () => {
    toggleLoadingSpinner()
    watcher = folderObserver.watchFolder(folder)
}
const stopLogging = () => {
    toggleLoadingSpinner()
    folderObserver.stopWatching(watcher)
}
let toggleStartBtn = document.getElementById('toggleStartBtn')
let toggleText = 'Start Logging'
const handleLoggingToggle = e => {
    if(toggleText === 'Start Logging') {
        // check if there is a character and directory selected
        if(!folder || !character || !server) {
            // show error popup
            popup__inner_content.textContent = 'You must first select a character and choose your warcraft logs directory.'
            popup.classList.toggle('showPopup')
            setTimeout(() => {
                popup.classList.toggle('showPopup')
            }, 3000);
        } else {
            toggleText =  toggleStartBtn.textContent = 'Stop Logging'
            startLogging()
        }
    } else {
        toggleText =  toggleStartBtn.textContent = 'Start Logging'
        stopLogging()
    }
}
toggleStartBtn.addEventListener('click', handleLoggingToggle)

// COMBAT LOG ADDED EVENT
folderObserver.on('file-added', log => {
    console.log(log.message)
    const options = { fromBeginning: true, flushAtEOF: true }
    tail = new Tail(`${folder}/WoWCombatLog.txt`, options)

    tail.on("line", function (data) {
        parseLine(data)
    })

    tail.on("error", function (error) {
        console.log('ERROR: ', error)
    })
})

// COMBAT LOG CHANGED EVENT
folderObserver.on('file-changed', log => {
    console.log(log.message)
})

// COMBAT LOG DELETED EVENT
folderObserver.on('file-deleted', log => {
    console.log(log.message)
})

// ========================
// Set up sending kill data
/**
* Adds kills to MongoDB and returns the newly created kills
* @param {object} kills - The kills to be added
*/
const createExternalKills = async (kills) => {
    // authenticate with API to gain access to POST kills on behalf of your character or group
    try {
      const response = await fetch(`${apiServerUrl}/api/kills`, {
        body: JSON.stringify(kills),
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-auth-token': token
        },
      });
      // Parse body as json
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error);
      }
      if (json) {
        // return the newly created kills
        return console.log(json);
      }
      // If no json returned throw error
      throw new Error('No json error or kills response.');
    } catch (error) {
        console.error(error);
    }
  };

/**
 * Check savedEvents for deaths and if so send to API
 */
function sendKills() {
    setInterval(function () {
        if(tempEvents.length > 0){
            savedEvents.push(...tempEvents)
            tempEvents.splice(0, tempEvents.length)
            let deathInd = 0
            while (deathInd !== -1) {
                deathInd = findDeath()
            }
            savedEvents.splice(0, savedEvents.length)
            if(killReports.length > 0) {
                createExternalKills(killReports)
                killReports.splice(0, killReports.length)
            }
        }
    }, 1000*6*2.5)
}
sendKills()
