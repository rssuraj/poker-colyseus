# Poker Back-end server

The back-end server for Poker in TypeScript and Node.js with Colyseus for client-server communication. The project has no client UI and was mainly done for the backend server. I may add the UI in the future.
The Poker types supported are `Texas Holdem` and `Omaha` both of which can be passed from the client when a `startGame` event is fired by a client.

## Client folder

This folder has a `app.js` file with minimal code to join players in a room and send different events to the server as the course of game moves forward.

## Tech-stack used

```
TypeScript, JavaScript, Node.js, Colyseus
```

## Getting started

```
clone/fork the repository
In server/ folder:
    npm install
    npm start
In client/ folder:
    npm install
    npm start
```

The logs will be displayed on the console for both client and Server with all information from the time players joined until the last when winners are decided based on each player's hand.

## Structure of back-end server

- `app.ts`: main entry point, register a game room handler and attach [`@colyseus/monitor`]
- `GameRoom.ts`: A Game room handler for all the logic of handling Poker Game between configured number of players
- `State.ts`: Containing all the state related information like Players, Cards, Winners, ComunityCards, etc.,
- `GameConfig.ts`: Specifies configuration related to type of Poker(`TexasHldem` or `Omaha`)
- `utils/PlayerUtils.ts`: A class which provides some utility methods to perform on the players
- `utils/CardUtils.ts`: A class which provides some utility methods to perform on the cards(Player/Community)
- `package.json`: Node.js config file with all dependencies
- `tsconfig.json`: TypeScript configuration file

## Configure Poker Type
Has to be send as `options` parameter when creating a room on client and can have following values for now:
    1. `TexasHoldem`
    2. `Omaha`
Example:
    client.create(`game`, {pokerType: `Omaha`}).then(room => {
        //Some handlers/code
    }

## Starting the Game
Game can be started by sending `startGame` message from client to server. Game is started when players are >2.
Example:
    room.send(`startGame`, {});

Room gets locaked if the maxPlayers config value is reached and no additional players can enter the room.

## Phases/Rounds After Game Start
`preFlop`:
    1. Cards are distributed to all players.
    2. Small & Big Blinds are choosen.
    3. Betting is started by broadcasting a `preFlop` message to all clients
    4. Each player can:
        a. `call`: Bet same amount what previous player has made.
        b. `raise`: Raise the Bet amount by betting more then what previous player has made.
        c. `fold`: The player is leaves from the game.
    5. Once all players have made the same bet, then the next round starts.

`flop`:
    1. The server broadcasts a `flop` message to all clients
    2. Three community cards are revealed an put into the sate object by server
    4. Each player can:
        a. `call`: Bet same amount what previous player has made.
        b. `raise`: Raise the Bet amount by betting more then what previous player has made.
        c. `fold`: The player is leaves from the game.
        d. `check`: This can be done only when the current player is first to act in this round or the player before him has also checked.
    5. Once all players have made the same bet, then the next round starts.

`turn`:
    1. The server broadcasts a `turn` message to all clients
    2. A single community card is revealed an put into the sate object by server
    4. Each player can:
        a. `call`: Bet same amount what previous player has made.
        b. `raise`: Raise the Bet amount by betting more then what previous player has made.
        c. `fold`: The player is leaves from the game.
        d. `check`: This can be done only when the current player is first to act in this round or the player before him has also checked.
    5. Once all players have made the same bet, then the next round starts.

`river`:
    1. The server broadcasts a `river` message to all clients
    2. A single community card is revealed an put into the sate object by server
    4. Each player can:
        a. `call`: Bet same amount what previous player has made.
        b. `raise`: Raise the Bet amount by betting more then what previous player has made.
        c. `fold`: The player is leaves from the game.
        d. `check`: This can be done only when the current player is first to act in this round or the player before him has also checked.
    5. Once all players have made the same bet, then the SHOWDOWN happens.

## Each Player acting on his/her turn
A message is sent from client to server when the player makes a move with player object having the bet value in `currentBet` property.
In case of `check` and `fold`, only `activePlayerIndex` property is sufficient:
    1. `call`: room.send(`call`, {activePlayerIndex: activePlayerIndex, player: player});
    2. `raise`: room.send(`raise`, {activePlayerIndex: activePlayerIndex, player: player});
    3. `fold`: room.send(`fold`, {activePlayerIndex: activePlayerIndex});
    4. `check`: room.send(`check`, {activePlayerIndex: activePlayerIndex});

The server responds back when a player's turn is finished by updating the `activePlayerIndex` to next player and broadcasting the message `nextPlayerMove`.
The client whose sessionId matches the activePlayerIndex's sessionId will answer the mssage by acting on his/her turn:
Example: this.broadcast(`nextPlayerMove`, this.state);

## Compute Each player's best hand
`TexasHoldem`:
    1. The 2 player dealt cards and 5 community cards are used to determine the best hand.
    2. The best hand is calculated with following contrainsts:
        a. Atleast 1 player dealt card has to be used in the best hand computed.
        b. Bothe the player dealt cards can also be used if they form a best hand.

`Omaha`:
    1. The 4 player dealt cards and 5 community cards are used to determine the best hand.
    2. The best hand is calculated with following contrainsts:
        a. Exactly 2 player dealt cards has to be used in the best hand computed.
        
## Authors

* **Suraj Singh** - *Initial work*
