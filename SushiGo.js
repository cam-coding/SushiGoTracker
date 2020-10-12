playerCount = Object.entries(gameui.gamedatas.players).length;
mainPlayerId = gameui.getCurrentPlayerId().toString();
playerIdToName = new Map();
turnRotation = new Map();
hands = [];
currentRound = 0;
deck = [];
roundCounts = [];

var cardType = [
    "tempura",
    "sashimi",
    "dumpling",
    "maki1",
    "maki2",
    "maki3",
    "salmonnigiri",
    "squidnigiri",
    "eggnigiri",
    "pudding",
    "wasabi",
    "chopsticks"
];

function Card(id, name) {
    this.id = id;
    this.name = name;
}

function Hand(playerId, cards) {
    this.playerId = playerId;
    this.cards = cards;
}

function CardCount(card, count){
    this.card = card;
    this.count = count;
}

function setupDeck() {
    deck.push(new CardCount("tempura", 14));
    deck.push(new CardCount("sashimi", 14));
    deck.push(new CardCount("dumpling", 14));
    deck.push(new CardCount("maki1", 12));
    deck.push(new CardCount("maki2", 8));
    deck.push(new CardCount("maki3", 6));
    deck.push(new CardCount("salmonnigiri", 10));
    deck.push(new CardCount("squidnigiri", 5));
    deck.push(new CardCount("eggnigiri", 5));
    deck.push(new CardCount("pudding", 10));
    deck.push(new CardCount("wasabi", 6));
    deck.push(new CardCount("chopsticks", 4));
}

function startGame() {
    setupPlayers(Object.entries(gameui.gamedatas.players));
    resetRoundCounts();
    setupDeck();
    setupRound();
}

function setupRound() {
    currentRound = gameui.gamedatas.round;
    turnRotation = new Map();
    if (hands.length != 0)
    {
        for (var x in hands) {
            hands[x].cards = null;
        }
    }

    setupMyHand(gameui.playerHand);
    setupTurnRotation(gameui.gamedatas.turn);
    printCardsRemaining();
}

function resetRoundCounts() {
    roundCounts = [];
    for (var x in cardType)
    {
        roundCounts.push(new CardCount(cardType[x], 0));
    }
}

function setupPlayers(players) {
    for (var x in players) {
        playerIdToName.set(players[x][1].id, players[x][1].name);
        hands.push(new Hand(players[x][1].id, null));
    }
}

function setupTurnRotation(turn) {
    key = mainPlayerId;
    value = turn[Number(mainPlayerId)].toString();

    while (!turnRotation.has(key)) {
        turnRotation.set(key, value);
        key = value;
        value = turn[Number(key)].toString();
    }
}

function setupMyHand(hand) {
    if (hands[hands.findIndex(x => x.playerId === mainPlayerId)].cards === null)
    {
        handArray = [];
        for (var x in hand.items) {
            handArray.push(new Card(hand.items[x].id, hand.items[x].type));
        }
        hands[hands.findIndex(x => x.playerId === mainPlayerId)].cards = handArray;
    }
}

function rotateHands() {
    currentId = turnRotation.get(mainPlayerId);
    end = mainPlayerId;
    nextId = turnRotation.get(currentId);
    nextInsert = hands.find(x => x.playerId === nextId).cards;
    currentInsert = hands.find(x => x.playerId === currentId).cards;

    while (currentId != end) {
        hands[hands.findIndex(x => x.playerId === nextId)].cards = currentInsert;
        currentId = nextId;
        nextId = turnRotation.get(currentId);
        currentInsert = nextInsert;
        nextInsert = hands.find(x => x.playerId === nextId).cards;
    }
    hands[hands.findIndex(x => x.playerId === nextId)].cards = currentInsert;
}

function printCardsRemaining() {
    console.log("********************");
    for (type in cardType)
    {
        console.log(cardType[type] + ": " +
        (deck[deck.findIndex(x => x.card === cardType[type])].count - 
        roundCounts[roundCounts.findIndex(x => x.card === cardType[type])].count) +
        " left");
    }
    console.log("********************");
    console.log()
}

function printHands() {
    console.log("********************");
    console.log(prettyHand(mainPlayerId));
    current = turnRotation.get(mainPlayerId);
    while (current != mainPlayerId) {
        console.log(prettyHand(current));
        current = turnRotation.get(current);
    }
    console.log("********************");
}

function prettyHand(id) {
    var cards = hands.find(x => x.playerId === id).cards;
    str = "" + playerIdToName.get(id) + ": ";
    if (cards !== null)
    {
        for (var x in cards) {
            str = str + cards[x].name + ", ";
        }
    }
    return str;
}

var orig = gameui.notif_playCards;
gameui.notif_playCards = function (_39) {
    try {
        var id = _39.args.player_id;
        var handIndex = hands.findIndex(x => x.playerId === id);
        var cards = hands[handIndex].cards;
        if (cards != null) {
            var cardIndex = cards.findIndex(x => x.id === _39.args.card1.id);
            hands[handIndex].cards.splice(cardIndex, 1);
            roundCounts[roundCounts.findIndex(x => x.card === _39.args.card1.type)].count++;
            if (_39.args.card2 !== null) {
                var card2Index = cards.findIndex(x => x.id === _39.args.card2.id);
                hands[handIndex].cards.splice(card2Index, 1);
                roundCounts[roundCounts.findIndex(x => x.card === _39.args.card2.type)].count++;
                hands[handIndex].cards.push(new Card(_39.args.chopsticks.id, "chopsticks"));
                roundCounts[roundCounts.findIndex(x => x.card === "chopsticks")].count--;
            }
        }
        orig.call(this, _39);
    } 
    catch (e) {
        console.log("cam: notif_playCards error" + e);
    }
}

var origEnteringState = gameui.onEnteringState;
gameui.onEnteringState = function (_1c, _1d) {
    try {
        switch (_1c) {
            case "multiplayerTurn":
                if (currentRound !== gameui.gamedatas.round) {
                    setupRound();
                }
                else {
                    rotateHands();
                    setupMyHand(gameui.playerHand);
                    console.clear();
                    printHands();
                }
                break;
            case "dummmy":
                break;
        }
        origEnteringState.call(this, _1c, _1d);
    } 
    catch (e) {
        console.log("cam: onEnteringState error" + e);
    }
}

startGame();