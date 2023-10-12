const scoreToWin = 4000;
let enableUniqueDice = true;
let muted = true;
let players = 1;
let bots = 0;
let botList = [];
const dieType = { // set the odds for each die side 99.96/9996
    common: {odds: ["", 1666, 1666, 1666, 1666, 1666, 1666]}, // default die, 16.66% odds for each side
    lucky: {odds: ["", 2730, 450, 910, 1360, 1820, 2730], skin: 'd-lucky'}
};
const scoring = { // scoring value for each outcome [number of dice][roll]: [score awarded]
    11: 100,  12: -3000, 13: -3000, 14: -3000, 15: 50,   16: -3000, // -3000 renders the submission invalid
    21: 200,  22: -3000, 23: -3000, 24: -3000, 25: 100,  26: -3000,
    31: 1000, 32: 200,   33: 300,   34: 400,   35: 500,  36: 600,
    41: 2000, 42: 400,   43: 600,   44: 800,   45: 1000, 46: 1200,
    51: 3000, 52: 600,   53: 900,   54: 1200,  55: 1500, 56: 1800,
    61: 4000, 62: 800,   63: 1200,  64: 1600,  65: 2000, 66: 2400,
    str: 1500, tpair: 1000
};





const debug = false; // true to use rigRolls as dice roll results
const rigRolls = [1, 2, 3, 4, 5, 6]; // define each die roll while debug is true
const container = document.getElementById('container');

let player = {};
let playing = []; // list player by turn order, playing[0] being the currently playing player
let scores = [];
let round = 0;

let diceBag = [] // holds selected dice types
let diceOnTable = {}; // currently available dice
let diceSelection = [];
let allowedSelection = true; // for buttoms state

let evtID; // used for event screen type: busted/win/player turn

for(uniqueDie in dieType) {
    const diceOdds = dieType[uniqueDie]['odds'].slice();
    let currentStack = 0;
    for(let i = 2; i < 7; i++) {
        currentStack += diceOdds[i - 1];
        dieType[uniqueDie]['odds'][i] = currentStack;
    }
}

// Die rendering params
const dieSide = ["",
//   1   2   3    4   5   6
     0,  0,  90, -90, 0,  0,
     0, -90, 0,   0,  90, 180,
//  oposite side
     6,  5,  4,   3,  2,  1
];
const diceSpread = {lX: 90,X: 0, Y: 250, mX: 230, mY: 50};

function rollDice(mute) {
    if(!muted && !mute){
        document.getElementById('roll-audio').play();
    }
    clearDiceSelection();
    Array.from(document.querySelectorAll('.lit')).forEach(
        (el) => el.classList.remove('lit')
    );
    Array.from(document.querySelectorAll('.shadow')).forEach(
        (el) => el.classList.remove('shadow')
    );
    let diceRoll = new Uint32Array(Object.keys(diceOnTable).length);
    window.crypto.getRandomValues(diceRoll);
    diceRoll.forEach(function(item, index){
        diceRoll[index] = Math.floor(item / (0xffffffff + 1) * 9996) + 1;
    });
    if(debug) {
        diceRoll = rigRolls;
    }

    let i = 0;
    for(const currentDice in diceOnTable){
        if(debug) {
            diceRoll = rigRolls;
        }
        else {
            if(diceRoll[i] > dieType[diceOnTable[currentDice]['type']]['odds'][2]) {
                if(diceRoll[i] > dieType[diceOnTable[currentDice]['type']]['odds'][3]) {
                    if(diceRoll[i] > dieType[diceOnTable[currentDice]['type']]['odds'][4]) {
                        if(diceRoll[i] > dieType[diceOnTable[currentDice]['type']]['odds'][5]) {
                            if(diceRoll[i] > dieType[diceOnTable[currentDice]['type']]['odds'][6]) {
                                diceRoll[i] = 6;
                            }
                            else {
                                diceRoll[i] = 5;
                            }
                        }
                        else {
                            diceRoll[i] = 4;
                        }
                    }
                    else {
                        diceRoll[i] = 3;
                    }
                }
                else {
                    diceRoll[i] = 2;
                }
            }
            else {
                diceRoll[i] = 1;
            }

        }
        Object.assign(diceOnTable[currentDice], { rolled: diceRoll[i] })
        document.documentElement.style.setProperty('--rotation' + i, dieRotation(diceOnTable[currentDice]['rolled']));
        document.getElementById(currentDice).style.transform = "var(--rotation" + i + ")";
        document.getElementById(currentDice + "s" + diceOnTable[currentDice]['rolled']).classList.add('lit');
        document.getElementById(currentDice + "s" + dieSide[diceOnTable[currentDice]['rolled'] + 12]).classList.add('shadow');
        let diceTilt = Math.floor(Math.random() * 361);
        document.getElementById(currentDice).style.rotate = diceTilt + "deg";
        let screenCheck = window.matchMedia("(max-width: 512px)").matches;
        if(screenCheck) {
            document.getElementById(currentDice).style.marginLeft = (Math.floor(Math.random() * diceSpread.mX) + 10) + "px";
        if(i) {
            document.getElementById(currentDice).style.marginTop = Math.floor(Math.random() * diceSpread.mY + 20) + "px";
        }
        }
        else {
        if(i) {
            document.getElementById(currentDice).style.marginLeft = (Math.floor(Math.random() * (window.matchMedia("(max-width: 512px)").matches ? diceSpread.X : diceSpread.lX)) + 30) + "px";
        }
            document.getElementById(currentDice).style.marginTop = Math.floor(Math.random() * diceSpread.Y) + "px";
        };
        i++;
    }
    if(!mute) {
        if(!bustCheck()) { // no valid play available
            player[playing[0]].currentScore = 0;
            player[playing[0]].roundScore= 0;
            evtID = 1;
            showScreenEvent();
            return;
        }
        else {
            allowedSelection = false;
            if(botTurn) {
                setTimeout(() => {
                    bot();
                }, 500);
            }
        }
        setTimeout(() => {
            updateButtons();
        }, 1);
    }
}
function dieRotation(value) {
    return "rotateX(" + dieSide[value] + "deg) rotateY(" + dieSide[value + 6] + "deg)";
}

function createDie() {
    const newDie = document.createElement('div');
    newDie.classList.add('die');
    const newDieN = Object.keys(diceOnTable).length;
    newDie.setAttribute('id', "d" + newDieN);
    if(!botTurn) {
        newDie.addEventListener('click', function() {
            selectDie([newDie.id])}
        );
    }
    for(let i = 1; i < 7; i++) {
        const newSide = document.createElement('div');
        newSide.classList.add('side');
        if(diceBag[newDieN]){
            newSide.classList.add(dieType[diceBag[newDieN]]['skin']);
        }
        newSide.setAttribute('id', "d" + newDieN + "s" + i);
        newDie.appendChild(newSide);
        const newSideNumber = document.createElement('h1');
        newSideNumber.innerText = i;
        newSide.appendChild(newSideNumber);
    }
    const diceT = diceBag[newDieN]? diceBag[newDieN] : 'common';
    Object.assign(diceOnTable, { [newDie.id]: {"type": diceT} });
    container.appendChild(newDie);
}

function throwDice(n) {
    for(let i = 0; i < 6; i++){
        createDie();
    }
    rollDice(true);
    if(players + bots == 1) {
        document.getElementById("current-round").innerText = player[playing[0]].round;
    }
    else {
        let sortScore = [];
        for(pl in player) {
            sortScore.push(["<b>P" + pl + ":</b> ", player[pl].totalScore]);
        }
        sortScore.sort((a, b) => b[1] - a[1]);
        if(players + bots > 5) {
            sortScore.length = 5;
        }
        sortScore = sortScore.join("<br>");
        sortScore = sortScore.replaceAll(",", "");
        document.getElementById("current-round").innerHTML = sortScore;
    }
    setTimeout(() => {
        rollDice();
    }, 1);
}

function selectDie(selectedDie) {
    if(diceSelection.includes(selectedDie[0])) {
        document.getElementById(selectedDie + "s" + dieSide[diceOnTable[selectedDie]['rolled'] + 12]).classList.remove('selected');
        diceSelection.splice(diceSelection.indexOf(selectedDie[0]), 1);
    }
    else {
        document.getElementById(selectedDie + "s" + dieSide[diceOnTable[selectedDie]['rolled'] + 12]).classList.add('selected');
        diceSelection.push(selectedDie[0]);
    }
    selectCheck();
}

function clearDiceSelection() {
    while(diceSelection.length) {
        document.getElementById(diceSelection[0] + "s" + dieSide[diceOnTable[diceSelection[0]]['rolled'] + 12]).classList.remove('selected');
        diceSelection.splice(0, 1);
    };
}

function purgeDices() { // remove all dice
    for(const currentDice in diceOnTable){
        document.getElementById(currentDice).remove();
        if(diceSelection.includes(currentDice)) {
            diceSelection.splice(diceSelection.indexOf(currentDice), 1);
        }
    }
    diceOnTable = {};
}

function removeDie() {
    while(diceSelection.length){
        document.getElementById(diceSelection[0]).remove();
        delete diceOnTable[diceSelection[0]];
        diceSelection.splice(0, 1);
    }
}

let currentSelection = [];
function selectCheck() { // checking if selected dice results in a valid play
    currentSelection = [];
    for(let currentDice of diceSelection) {
        currentSelection.push(diceOnTable[currentDice]['rolled']);
    }
    const uniqueRolls = new Set(currentSelection);

    player[playing[0]].currentScore = 0;
    if(currentSelection.length == 6 && uniqueRolls.size == 6) {
        player[playing[0]].currentScore = scoring.str;
    }
    else {
        let rolls = ["", 0, 0, 0, 0, 0, 0];
        for(let el in currentSelection) {
            rolls[currentSelection[el]]++;
        }
        for(let el of uniqueRolls){
            player[playing[0]].currentScore += parseFloat(scoring["" + rolls[el] + el]);
        }
        if(currentSelection.length == 6 && uniqueRolls.size == 3) {
            let tpairCheck = 0;
            uniqueRolls.forEach((uR) => {
                if(rolls[uR] == 2) {
                    tpairCheck++;
                }
            });
            if(tpairCheck == 3) {
                player[playing[0]].currentScore = scoring.tpair;
            }
        }
    }
    if(player[playing[0]].currentScore > 0) {
        allowedSelection = true;
    }
    else {
        allowedSelection = false;
        player[playing[0]].currentScore = 0;
    }
    if(!botTurn){
        updateButtons();
    }
    document.getElementById("current-score").innerText = player[playing[0]].currentScore;
}

function bet() {
    tPair = false;
    if(!allowedSelection) {
        console.log("Invalid selection");
        return;
    }
    player[playing[0]].roundScore += player[playing[0]].currentScore;
    player[playing[0]].currentScore = 0;
    removeDie();
    if(Object.keys(diceOnTable).length) {
        rollDice();
    }
    else {
        throwDice(6);
    }
    updateScoreDisplay();
}

function stop() {
    tPair = false;
    if(!allowedSelection) {
        console.log("Invalid selection");
        return;
    }
    player[playing[0]].totalScore += player[playing[0]].currentScore + player[playing[0]].roundScore;
    player[playing[0]].currentScore = 0;
    player[playing[0]].roundScore = 0;
    if(player[playing[0]].totalScore >= scoreToWin) {
        updateScoreDisplay();
        evtID = 2;
        showScreenEvent();
        return;
    }
    updateScoreDisplay();
    if(players + bots > 1) {
        evtID = 3;
        showScreenEvent();
    }
    else {
        passTurn();
        purgeDices();
        throwDice(6);
    }
}

function passTurn() {
    if(players + bots > 1) {
        playing.push(playing[0]);
        playing.shift();
        updateScoreDisplay();
    }
    player[playing[0]].round++;
    if(players + bots == 1) {
        document.getElementById("current-round").innerText = player[playing[0]].round;
    }
    if(botList.includes(playing[0])) {
        botTurn = true;
    }
    else {
        botTurn = false;
    }
    playerNameDisplay.innerText = "Player " + playing[0];
    if(botTurn) {
        document.getElementById('bot-display').style.visibility = "visible";
        document.getElementById('button-container').style.visibility = "hidden";
    }
    else {
        document.getElementById('bot-display').style.visibility = "hidden";
        document.getElementById('button-container').style.visibility = "visible";
    }
}

let uniqueRolls;
let currentRoll;
let tPair = false;
function bustCheck() { // true for valid play
    currentRoll = [];
    for(const currentDice in diceOnTable) {
        currentRoll.push(diceOnTable[currentDice]['rolled']);
    }
    uniqueRolls = new Set(currentRoll);

    if(currentRoll.includes(1) || currentRoll.includes(5)){
        return true;
    }
    else if(Object.keys(diceOnTable).length - uniqueRolls.size > 1) {
        let uP = 0;
        uniqueRolls.forEach((uR) => {
            let uC = 0;
            currentRoll.forEach((cR) => (cR === uR && uC++));
            if(uC > 2) {
                return true;
            }
            if(uC > 1) {
                uP++;
            }
        });
        if(uP > 2) {
            tPair = true;
            return true;
        }
    }
    else if(Object.keys(diceOnTable).length == 6 && uniqueRolls.size == 6) {
        return true;
    }
    else {
        return false;
    }
}



// HUD
function clearGame() {
    purgeDices();
    player = {};
    playing = [];
    scores = [];
    diceBag = [];
};

function updateScoreDisplay() {
    document.getElementById("current-score").innerText = player[playing[0]].currentScore;
    document.getElementById("round-score").innerText = player[playing[0]].roundScore;
    document.getElementById("total-score").innerText = player[playing[0]].totalScore;
}

function updateButtons() {
    if(allowedSelection) {
        document.getElementById('bet-button').style.color = "white";
        document.getElementById('stop-button').style.color = "white";
    }
    else {
        document.getElementById('bet-button').style.color = "#444444";
        document.getElementById('stop-button').style.color = "#444444";
    }
}


// Game Screens
const evtScreen = document.getElementById('screen-message');
function dismissEventScreen(botDismissCall) {
    if(!botTurn || evtID == 2 || botDismissCall) {
        switch(evtID) {
            case 1:
                document.getElementById('screen-message').style.visibility = "hidden";
                document.getElementById('screen-message').style.animationName = "";
                document.getElementById('screen-text').style.animationName = "";
                evtID = 3;
                if(players + bots > 1) {
                    showScreenEvent();
                }
                else {
                    passTurn();
                    purgeDices();
                    throwDice(6);                
                }
                break;
            case 2:
                document.getElementById('screen-message').style.visibility = "hidden";
                document.getElementById('screen-message').style.animationName = "";
                document.getElementById('screen-text').style.animationName = "";
                clearGame();
                continueMenu();
                break;
            case 3:
                document.getElementById('screen-message').style.visibility = "hidden";
                playerNameDisplay.innerText = "Player " + playing[0];
                purgeDices();
                throwDice(6);
                break;
            default:
                document.getElementById('screen-message').style.visibility = "hidden";
                document.getElementById('screen-message').style.animationName = "";
                document.getElementById('screen-text').style.animationName = "";
        }
    }
}
evtScreen.addEventListener('click', () => {
    dismissEventScreen();
});

function showScreenEvent() {
    switch(evtID) {
        case 1:
            document.getElementById('screen-message').style.visibility = "visible";
            document.getElementById('screen-message').style.animationName = "screenEvt";
            document.getElementById('screen-text').style.animationName = "screenEvtText";
            document.getElementById('screen-text').style.color = "darkred";
            document.getElementById('screen-text').innerText = "Busted";
            break;
        case 2:
            document.getElementById('screen-message').style.visibility = "visible";
            document.getElementById('screen-message').style.animationName = "screenEvt";
            document.getElementById('screen-text').style.animationName = "screenEvtText";
            document.getElementById('screen-text').style.color = "white";
            document.getElementById('bot-display').style.visibility = "hidden";
            document.getElementById('button-container').style.visibility = "visible";
            if(players + bots > 1) {
                document.getElementById('screen-text').innerHTML = "Player " + playing[0] + "<br>Win<br><em>" + player[playing[0]].totalScore + "</em>";
            }
            else {
                document.getElementById('screen-text').innerHTML = player[playing[0]].round + " round" + (player[playing[0]].round > 1 ? "s" : "") + "<br>Win<br><em>" + player[playing[0]].totalScore + "</em>";
            }
            break;
        case 3:
            document.getElementById('screen-message').style.visibility = "visible";
            document.getElementById('screen-text').style.animationName = "screenEvtText";
            document.getElementById('screen-text').style.color = "white";
            passTurn();
            document.getElementById('screen-text').innerText = "Player " + playing[0] + "\nturn.";
            break;
        default:
            document.getElementById('screen-message').style.visibility = "visible";
            document.getElementById('screen-message').style.animationName = "screenEvt";
            document.getElementById('screen-text').style.animationName = "screenEvtText";
            document.getElementById('screen-text').style.color = "darkred";
            document.getElementById('screen-text').innerText = "Nób";
    }
    if(botTurn && evtID != 2) {
        setTimeout(() => {
            dismissEventScreen(true);
        }, 1000);
    }
}

function continueMenu() {
    menuScreen.style.visibility = "visible";
    continueScreen.style.visibility = "visible";
}

function restartGame() {
    menuScreen.style.visibility = "hidden";
    continueScreen.style.visibility = "hidden";
    start();
}

function backToMenu() {
    continueScreen.style.visibility = "hidden";
    playerSelectionScreen.style.visibility = "visible";
    currentPlayerDisplay.style.visibility = "hidden";
}

const settingsScreen = document.getElementById('settings-screen');
function settings() {
    settingsScreen.style.visibility = "visible";
}

function applySettings() {
    settingsScreen.style.visibility = "hidden";
    enableUniqueDice = document.getElementById('unique-dice').checked;
    muted = document.getElementById('mute-checkbox').checked;
}

const menuScreen = document.getElementById('menu-bg');
const playerCountDisplay = document.getElementById('player-count');
const playerSelectionScreen = document.getElementById('player-selection');
const botCountDisplay = document.getElementById('bot-count');
const botSelectionScreen = document.getElementById('bot-selection');
const continueScreen = document.getElementById('continue-screen');
const currentPlayerDisplay = document.getElementById('current-player');
const playerNameDisplay = document.getElementById('player-name');

function addPlayer() {
    players++;
    playerCountDisplay.innerText = players;
}
function removePlayer() {
    if(players > 0) {
        players--;
        playerCountDisplay.innerText = players;
    }
    if(players + bots == 0) {
        bots = 1;
        botCountDisplay.innerText = bots;
    }
}
function addBot() {
    bots++;
    botCountDisplay.innerText = bots;
}
function removeBot() {
    if(bots > 0) {
        bots--;
        botCountDisplay.innerText = bots;
    }
    if(players + bots == 0) {
        players = 1;
        playerCountDisplay.innerText = players;
    }
}

function start() {
    if(enableUniqueDice) {
        diceBag = ['lucky', 'lucky'];
    }
    if(!players) {
        botTurn = true;
        document.getElementById('bot-display').style.visibility = "visible";
        document.getElementById('button-container').style.visibility = "hidden";
    }
    if(players + bots == 1) {
        document.getElementById('word').innerText = "Round";
        createPlayers();
        menuScreen.style.visibility = "hidden";
        playerSelectionScreen.style.visibility = "hidden";
        throwDice(6);
        updateScoreDisplay();
    }
    else {
        document.getElementById('word').innerText = "";
        document.getElementById("current-round").style.fontSize = "1em";
        currentPlayerDisplay.style.visibility = "visible";
        playerNameDisplay.innerText = "Player 1";
        createPlayers();
        menuScreen.style.visibility = "hidden";
        playerSelectionScreen.style.visibility = "hidden";
        throwDice(6);
        updateScoreDisplay();
    }
}

function createPlayers() {
    for(let i = 1; i < players + 1; i++) {
        Object.assign(player, { [i]: {currentScore: 0, roundScore: 0, totalScore: 0, round: 0} });
        playing.push(i);
        scores[i - 1] = 0;
        scores[players + bots + i - 1] = i;
    }
    for(let i = 1; i < bots + 1; i++) {
        Object.assign(player, { [playing.length + 1]: {currentScore: 0, roundScore: 0, totalScore: 0, round: 0} });
        playing.push(playing.length + 1);
        botList.push(playing.length);
        scores[playing.length - 1] = 0;
        scores[players + bots + playing.length - 1] = playing.length;
    }
}


let botTurn = false;
function bot() {
    uniqueRolls = new Set(currentRoll);
    let choosenPlay = [];
    let possiblePlay = {};
    let choosenScore = 0;
    if(Object.keys(diceOnTable).length == 6 && uniqueRolls.size == 6) {
        choosenPlay = [0,1,2,3,4,5];
        choosenScore = scoring['str'];
    }
    else if(tPair) {
        choosenPlay = [0,1,2,3,4,5];
        choosenScore = scoring['tpair'];
    }
    else {
        let uP = 0;
        uniqueRolls.forEach((uR) => {
            let uC = 0;
            currentRoll.forEach((cR) => (cR === uR && uC++));
            let uCP
            if(uC > 2) {
                uCP = [];
                currentRoll.forEach((cVal, index) => (cVal === uR ? uCP.push(index) : null))
                Object.assign(possiblePlay, { [uR]: {score: scoring["" + uC + uR], selection: uCP} })
            }
            else if(uR == 1 || uR == 5) {
                uCP = [];
                currentRoll.forEach((cVal, index) => (cVal === uR ? uCP.push(index) : null))
                Object.assign(possiblePlay, { [uR]: {score: scoring["" + uC + uR], selection: uCP} })
            }
        });
        if(possiblePlay) {
            for(let selOpt in possiblePlay){
                for(let [key, val] of Object.entries(possiblePlay[selOpt].selection)) {
                    choosenPlay.push(val);
                }
                choosenScore += possiblePlay[selOpt].score;
            }
            choosenPlay = [...new Set(choosenPlay)];
        }
    }
    choosenPlay.forEach((dN) => selectDie([Object.keys(diceOnTable)[dN]]));
    if(choosenScore + player[playing[0]].roundScore > 299) {
        setTimeout(() => {
            stop();
        }, 1000);
    }
    else {
        setTimeout(() => {
            bet();
        }, 1000);
    }
}
