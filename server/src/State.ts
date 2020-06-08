import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

export class Card extends Schema {
    @type(`number`)
    number: number;

    @type(`string`)
    suit: string;

    @type(`boolean`)
    isHole: boolean = false;
}

export class Player extends Schema {
    @type(`string`)
    id: string;
  
    @type([ Card ])
    cards: ArraySchema<Card> = new ArraySchema<Card>();

    @type([ Card ])
    bestHand: ArraySchema<Card> = new ArraySchema<Card>();

    @type(`string`)
    hand: string = undefined;
  
    @type(`number`)
    totalChips: number;
  
    @type(`number`)
    currentBet: number;

    @type({map: `number`})
    cardFrequency: MapSchema<number> = new MapSchema<number>();

    @type({map: `number`})
    suitFrequency: MapSchema<number> = new MapSchema<number>();

    @type(`boolean`)
    isDealer: boolean = false;
}
  
export class GameState extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();

    @type(`number`)
    activePlayerIndex: number;

    @type(`number`)
    dealerIndex: number;

    @type(`number`)
    smallBlindPlayerIndex: number;

    @type(`number`)
    bigBlindPlayerIndex: number;

    @type(`number`)
    minBet: number;

    @type(`number`)
    currentBet: number;

    @type([ Player ])
    winningPlayers: ArraySchema<Player> = new ArraySchema<Player>()
    
    @type(`number`)
    pot: number = 0;
    
    @type([ Card ])
    communityCards: ArraySchema<Card> = new ArraySchema<Card>();
  
    @type(`string`)
    phase: string;

    @type([ Card ])
    deck: ArraySchema<Card> = new ArraySchema<Card>();

    @type(`string`)
    pokerType: string;
}