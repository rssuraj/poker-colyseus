import { Room, Client, SchemaSerializer } from 'colyseus';
import { MapSchema, ArraySchema } from '@colyseus/schema';
import { GameState, Player, Card } from './State';
import { CardUtils } from './utils/CardUtils';
import { PlayerUtils } from './utils/PlayerUtils';
import { GameConfig } from './GameConfig';

export class GameRoom extends Room<GameState> {
    playerCount: number = 0; //Tracks the number of players in the room

    phases: string[] = [`preFlop`, `flop`, `turn`, `river`]; // all phases in the game

    raisesMadePerRound: number = 0; //Track and limit the Raise made in a phase to the config value

    pokerConfig: GameConfig; //Config based on pokerType

    playerUtils: PlayerUtils; //Utilities for Players

    cardUtils: CardUtils; //Utilities for Cards

    //Create the Room
    onCreate(options: any) {
        console.log(`Room ${this.roomName} created with roomId ${this.roomId}`);

        //Setup Helper class objects
        this.cardUtils = new CardUtils();
        this.playerUtils = new PlayerUtils();

        //Set state
        this.setState(new GameState());

        //Create config
        this.state.pokerType = options.pokerType;
        if (this.state.pokerType) {
            this.pokerConfig = new GameConfig();
            this.pokerConfig.setupConfig(this.state.pokerType);
            this.maxClients = this.pokerConfig.maxPlayers;
        } else {
            console.log(
                `Invalid PokerType ${JSON.stringify(
                    options
                )} provided in options!!`
            );
            console.log(`Locking the room as this is invalid`);
            this.broadcast(
                `InvalidConfig`,
                `Invalid PokerType ${JSON.stringify(
                    options
                )} provided in options!!`
            );
            this.lock();
        }

        console.log(`Poker Config ${JSON.stringify(this.pokerConfig)}`);

        //Set message handlers
        this.initializeMessageHandlers();
    }

    //New Player Joins the Room
    onJoin(client: Client, options: any) {
        console.log(
            `Server: Client joined with id ${client.id} and sessionId ${client.sessionId}`
        );

        //Create a new player and add to MapSchema
        let newPlayer: Player = this.addPlayer(client.sessionId);
        this.state.players[this.playerCount] = newPlayer;
        this.playerCount++;

        //Lock the room when maxPlayers entered
        if (this.playerCount == this.pokerConfig.maxPlayers) {
            console.log(`${this.roomId} Room Locked!!`);
            this.lock();
        }
    }

    //Existing Player Leaves the Room
    async onLeave(client: Client, consented: boolean) {
        console.log(
            `Server: Client left with id ${client.id} and sessionId ${client.sessionId}`
        );

        try {
            //If consented, remove without wait
            if (consented) {
                this.removePlayer(client);
            }

            //Wait for reconnection on connection lost
            await this.allowReconnection(client, 20);
            console.log(
                `Client with id ${client.id} successfully reconnected!!`
            );
        } catch (e) {
            console.log(`Player has not reconnected, removing from Room`);
            this.removePlayer(client);
        }
    }

    //Destroy the Room
    onDispose() {
        console.log(`${this.roomName} Room with id ${this.roomId} Disposed!!`);
    }

    //Initialize all the message handler to be handled from Client
    initializeMessageHandlers() {
        //Message to start Game
        this.onMessage(`startGame`, (client, message) => {
            //Lock the room if players are atleast equal to min players and
            //`startGame` message has been recieved
            if (
                this.playerCount >= this.pokerConfig.minPlayers &&
                !this.locked
            ) {
                console.log(`${this.roomId} Room Locked!!`);
                this.lock();
            }

            if (
                this.playerCount >= this.pokerConfig.minPlayers &&
                this.locked
            ) {
                //Distribute Cards
                this.distributeCards(client);

                //Choose 2 blinds
                this.chooseBlinds();

                //Start phase
                if (!this.moveToNextPhase(this.phases[0])) {
                    this.state.phase = this.phases[0];
                    this.broadcast(this.phases[0], this.state);
                }
            }
        });

        //Message from client when makes a CALL
        this.onMessage(`call`, (client, message) => {
            console.log(`Player with id ${message.player.id} Made a Call`);
            let player: Player = this.state.players[message.activePlayerIndex];
            player.currentBet = message.player.currentBet;
            player.totalChips -= message.player.currentBet;
            this.state.pot += player.currentBet;

            this.state.activePlayerIndex =
                (message.activePlayerIndex + 1) % this.playerCount;

            //Move to next step or Next Player
            if (!this.moveToNextPhase(this.state.phase))
                this.broadcast(`nextPlayerMove`, this.state);
        });

        //Message from client when makes a RAISE
        this.onMessage(`raise`, (client, message) => {
            console.log(`Player with id ${message.player.id} Made a Raise`);
            if (this.raisesMadePerRound === this.pokerConfig.maxRaisePerRound) {
                console.log(
                    `${this.pokerConfig.maxRaisePerRound} raises have been made in the current round ${this.state.phase}, please call`
                );
                client.send(
                    `message`,
                    `${this.pokerConfig.maxRaisePerRound} raises have been made in the current round ${this.state.phase}, please call`
                );
            }

            this.raisesMadePerRound++;
            let player: Player = this.state.players[message.activePlayerIndex];
            player.currentBet = message.player.currentBet;
            this.state.pot += player.currentBet;
            player.totalChips -= message.player.currentBet;
            this.state.currentBet = message.player.currentBet;

            this.state.activePlayerIndex =
                (message.activePlayerIndex + 1) % this.playerCount;

            //Move to next step or Next Player
            if (!this.moveToNextPhase(this.state.phase))
                this.broadcast(`nextPlayerMove`, this.state);
        });

        //Message from client when makes a FOLD
        this.onMessage(`fold`, (client, message) => {
            console.log(`Player with id ${message.player.id} Made a fold`);
            delete this.state.players[message.activePlayerIndex];
            this.playerCount--;

            this.state.activePlayerIndex =
                (message.activePlayerIndex + 1) % this.playerCount;

            //Move to next step or Next Player
            if (!this.moveToNextPhase(this.state.phase))
                this.broadcast(`nextPlayerMove`, this.state);
        });

        //Message from client when makes a CHECK
        this.onMessage(`check`, (client, message) => {
            console.log(`Player with id ${message.player.id} Made a Check`);

            this.state.activePlayerIndex =
                (message.activePlayerIndex + 1) % this.playerCount;

            //Move to next step or Next Player
            if (!this.moveToNextPhase(this.state.phase))
                this.broadcast(`nextPlayerMove`, this.state);
        });
    }

    //adds a new player to the Room
    addPlayer(sessionId: string): Player {
        let newPlayer: Player = new Player();
        newPlayer.id = sessionId;
        newPlayer.totalChips = 2000;
        newPlayer.currentBet = 0;
        console.log(`New Player ${newPlayer.id} added Successfully!!`);
        return newPlayer;
    }

    //removes a player from the Room
    removePlayer(client: Client) {
        delete this.state.players[client.sessionId];
        this.playerCount--;
        console.log(`${client.sessionId} Player removed!!`);
    }

    //distributes Cards to all players
    distributeCards(client: Client) {
        this.state.deck = this.cardUtils.getDeck();
        for (let i = 0; i < this.pokerConfig.holeCards; i++) {
            for (let playerId in this.state.players) {
                let player: Player = this.state.players[playerId];
                let res = this.cardUtils.popCards(this.state.deck, 1);
                this.state.deck = res.deck;
                res.chosenCards[0].isHole = true;
                player.cards.push(res.chosenCards[0]);

                if (player.cards.length === this.pokerConfig.holeCards)
                    client.send('myinfo', player);
            }
        }
    }

    //Choose Small & Big Blinds
    chooseBlinds() {
        this.state.dealerIndex = this.playerUtils.getRandomPlayer(
            this.playerCount
        );
        this.state.players[this.state.dealerIndex].isDealer = true;
        this.state.minBet = this.pokerConfig.minBet;
        this.state.currentBet = this.pokerConfig.minBet;

        this.state.smallBlindPlayerIndex =
            (this.state.dealerIndex + 1) % this.playerCount;
        this.state.bigBlindPlayerIndex =
            (this.state.dealerIndex + 2) % this.playerCount;

        this.state.activePlayerIndex =
            (this.state.bigBlindPlayerIndex + 1) % this.playerCount;

        console.log(
            `SmallIndex ${this.state.smallBlindPlayerIndex} and BigIndex ${this.state.bigBlindPlayerIndex}`
        );
        this.broadcast(`blinds`, {
            smallBlind: this.state.players[this.state.smallBlindPlayerIndex],
            bigBlind: this.state.players[this.state.bigBlindPlayerIndex]
        });
    }

    //Move to next phase if all players bets are equal else return false to move to next player
    moveToNextPhase(phase: string): boolean {
        if (
            this.state.players[this.state.activePlayerIndex].currentBet ===
                this.state.currentBet &&
            phase !== `river`
        ) {
            if (this.state.phase === this.pokerConfig.betDoubleInRound) {
                this.state.minBet = this.state.minBet * 2;
            }

            this.state.currentBet = this.state.minBet;
            const nexPhaseIndex = this.phases.indexOf(phase) + 1;
            console.log(
                `The previous Phase ${phase} has pot ${this.state.pot}`
            );
            console.log(
                `The phase index ${nexPhaseIndex} and Phase ${this.phases[nexPhaseIndex]}`
            );
            this.state.phase = this.phases[nexPhaseIndex];

            let res = this.cardUtils.revealPhaseComunityCards(
                this.state.phase,
                this.state.deck
            );
            this.state.deck = res.deck;
            res.communityCards.forEach((comCard) => {
                this.state.communityCards.push(comCard);
            });

            this.broadcast(this.phases[nexPhaseIndex], this.state);
            return true;
        }

        //When river then compute Hands because its SHOWDOWN time
        if (phase === `river`) {
            console.log(`SHOW DOWN TIME, COMPUTE THE HANDS`);
            this.state.players = this.cardUtils.computeHands(
                this.state.players,
                this.state.communityCards,
                this.pokerConfig.holeCardsToBeUsed,
                this.pokerConfig.cardsInHand,
                this.playerUtils.rankByHand
            );

            let winners: ArraySchema<Player> = this.playerUtils.determineWinners(
                this.state.players
            );
            winners.forEach((player) => {
                this.state.winningPlayers.push(player);
            });
            return true;
        }

        return false;
    }
}
