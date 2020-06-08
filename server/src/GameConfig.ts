//Class to maintain all configuration related details per pokerType
export class GameConfig {
    pokerType: string = undefined;

    minPlayers: number = undefined;

    maxPlayers: number = undefined;

    holeCards: number = undefined;

    holeCardsToBeUsed: number = undefined;

    cardsInHand: number = undefined;

    maxRaisePerRound: number = undefined;

    minBet: number = undefined;

    betDoubleInRound: string = undefined;

    setupConfig(pokerType: string) {
        this.pokerType = pokerType;
        console.log(`${this.pokerType == "TexasHoldem"}`);
        if(this.pokerType == "TexasHoldem")
            this.initializeTexasHoldemConfig();
        else if(this.pokerType == "Omaha")
            this.initializeOmahaConfig();
    }

    initializeTexasHoldemConfig() {
        this.minPlayers = 2;
        this.maxPlayers = 10;
        this.cardsInHand = 5;
        this.holeCards = 2;
        this.maxRaisePerRound = 3;
        this.minBet = 50;
    }

    initializeOmahaConfig() {
        this.minPlayers = 2;
        this.maxPlayers = 10;
        this.cardsInHand = 5;
        this.holeCards = 4;
        this.holeCardsToBeUsed = 2;
        this.maxRaisePerRound = 3;
        this.minBet = 50;
        this.betDoubleInRound = `turn`;
    }


}