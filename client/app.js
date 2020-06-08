var col = require(`colyseus.js`);
const client = new col.Client(`ws://localhost:2567`);

//Create a Room and Join a player
client
    .create(`game`, { pokerType: `Omaha` })
    .then((room) => {
        console.log(
            `Client with sessionId ${room.sessionId} joined ${room.name}`
        );

        room.onMessage(`myinfo`, (message) => {
            console.log(`Client: I am ${JSON.stringify(message)}`);
        });

        room.onStateChange((state) => {
            //console.log(`Client: You are ${JSON.stringify(state)}`);
        });

        room.onMessage(`blinds`, (message) => {
            if (message.smallBlind.id == room.sessionId) {
                console.log(
                    `I am the SMALL BLIND ${JSON.stringify(message.smallBlind)}`
                );
            } else if (message.bigBlind.id == room.sessionId) {
                console.log(
                    `I am the BIG BLIND ${JSON.stringify(message.bigBlind)}`
                );
            }
        });

        room.onMessage(`message`, (message) => {
            console.log(message);
        });

        room.onMessage(`InvalidConfig`, (message) => {
            console.log(message);
        });

        nextMove(room);

        preFlop(room);

        flop(room);

        turn(room);

        river(room);
    })
    .catch((e) => {
        console.log(`Could not Join the Room!!`);
    });

//Join 9 New Players
for (let i = 0; i < 9; i++) {
    client
        .join(`game`)
        .then((room) => {
            console.log(
                `Client with sessionId ${room.sessionId} joined ${room.name}`
            );

            room.onMessage(`myinfo`, (message) => {
                console.log(`Client: I am ${JSON.stringify(message)}`);
            });

            room.onStateChange((state) => {
                //console.log(`Client: You are ${JSON.stringify(state)}`);
            });

            room.onMessage(`blinds`, (message) => {
                if (message.smallBlind.id == room.sessionId) {
                    console.log(
                        `I am the SMALL BLIND ${JSON.stringify(
                            message.smallBlind
                        )}`
                    );
                } else if (message.bigBlind.id == room.sessionId) {
                    console.log(
                        `I am the BIG BLIND ${JSON.stringify(message.bigBlind)}`
                    );
                }
            });

            room.onMessage(`message`, (message) => {
                console.log(message);
            });

            nextMove(room);

            preFlop(room);

            flop(room);

            turn(room);

            river(room);

            if (i == 8) room.send(`startGame`, { calledBy: room.sessionId });
        })
        .catch((e) => {
            console.log(`Could not Join the Room!!`);
        });
}

function preFlop(room) {
    room.onMessage(`preFlop`, (message) => {
        const activePlayerIndex = message.activePlayerIndex;
        if (room.sessionId == message.players[activePlayerIndex].id) {
            console.log(`Entered PRE-FLOP Round!!`);
            let player = message.players[activePlayerIndex];
            console.log(
                `Current active player in ${message.phase} is ${player.id}`
            );

            player.currentBet = message.currentBet;
            room.send(`call`, {
                activePlayerIndex: activePlayerIndex,
                player: player
            });

            //room.send(`check`, {activePlayerIndex: activePlayerIndex, player: player});

            //player.currentBet = message.currentBet * 2;
            //room.send(`raise`, {activePlayerIndex: activePlayerIndex, player: player});

            //room.send(`fold`, {activePlayerIndex: activePlayerIndex, player: player});
        }
    });
}

function flop(room) {
    room.onMessage(`flop`, (message) => {
        const activePlayerIndex = message.activePlayerIndex;
        if (room.sessionId == message.players[activePlayerIndex].id) {
            console.log(`Entered FLOP Round!!`);
            let player = message.players[activePlayerIndex];
            console.log(
                `Current active player in ${message.phase} is ${player.id}`
            );

            //player.currentBet = message.currentBet;
            //room.send(`call`, {activePlayerIndex: activePlayerIndex, player: player});

            room.send(`check`, {
                activePlayerIndex: activePlayerIndex,
                player: player
            });

            //player.currentBet = message.currentBet * 2;
            //room.send(`raise`, {activePlayerIndex: activePlayerIndex, player: player});

            //room.send(`fold`, {activePlayerIndex: activePlayerIndex, player: player});
        }
    });
}

function turn(room) {
    room.onMessage(`turn`, (message) => {
        const activePlayerIndex = message.activePlayerIndex;
        if (room.sessionId == message.players[activePlayerIndex].id) {
            console.log(`Entered TURN Round!!`);
            let player = message.players[activePlayerIndex];
            console.log(
                `Current active player in ${message.phase} is ${player.id}`
            );

            //player.currentBet = message.currentBet;
            //room.send(`call`, {activePlayerIndex: activePlayerIndex, player: player});

            //room.send(`check`, {activePlayerIndex: activePlayerIndex, player: player});

            player.currentBet = message.currentBet * 2;
            room.send(`raise`, {
                activePlayerIndex: activePlayerIndex,
                player: player
            });

            //room.send(`fold`, {activePlayerIndex: activePlayerIndex, player: player});
        }
    });
}
function river(room) {
    room.onMessage(`river`, (message) => {
        const activePlayerIndex = message.activePlayerIndex;
        if (room.sessionId == message.players[activePlayerIndex].id) {
            console.log(`Entered RIVER Round!!`);
            console.log(
                `Community Cards are ${JSON.stringify(message.communityCards)}`
            );
            let player = message.players[activePlayerIndex];
            console.log(
                `Current active player in ${message.phase} is ${player.id}`
            );

            player.currentBet = message.currentBet;
            room.send(`call`, {
                activePlayerIndex: activePlayerIndex,
                player: player
            });

            //room.send(`check`, {activePlayerIndex: activePlayerIndex, player: player});

            //player.currentBet = message.currentBet * 2;
            //room.send(`raise`, {activePlayerIndex: activePlayerIndex, player: player});

            //room.send(`fold`, {activePlayerIndex: activePlayerIndex, player: player});
        }
    });
}

function nextMove(room) {
    room.onMessage(`nextPlayerMove`, (message) => {
        const activePlayerIndex = message.activePlayerIndex;
        if (room.sessionId == message.players[activePlayerIndex].id) {
            console.log(`NEXT MOVE!!`);
            //console.log(JSON.stringify(message));
            let player = message.players[activePlayerIndex];
            console.log(`Current active player is ${player.id}`);

            player.currentBet = message.currentBet;
            room.send(`call`, {
                activePlayerIndex: activePlayerIndex,
                player: player
            });

            //room.send(`check`, {activePlayerIndex: activePlayerIndex, player: player});

            //player.currentBet = message.currentBet * 2;
            //room.send(`raise`, {activePlayerIndex: activePlayerIndex, player: player});

            //room.send(`fold`, {activePlayerIndex: activePlayerIndex, player: player});
        }
    });
}
