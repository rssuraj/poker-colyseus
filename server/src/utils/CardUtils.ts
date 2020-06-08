import { MapSchema, ArraySchema } from '@colyseus/schema';
import { Player, Card } from "../State";
import { GameConfig } from "../GameConfig";

//Utility class for Cards
export class CardUtils {
	totalCards = 52;
	suits = [
		'Heart', //0
		'Spade', //1
		'Club', //2
		'Diamond' //3
	];

	//These varaibles are just for refrence of how the card numbers are used by the back-end server
	//These are never used
	cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	VALUE_MAP = {
		2:1,
		3:2,
		4:3,
		5:4,
		6:5,
		7:6,
		8:7,
		9:8,
		10:9,
		J:10,
		Q:11,
		K:12,
		A:13
	};

	randomizePosition = (min: number, max: number) => {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	getShuffledNums = () => {
		let shuffledNums = new Array<number>(this.totalCards);
		for (let i = 0; i < this.totalCards; i++) {
			if (i === 51) {
				// Fill last undefined slot when only 1 card left to shuffle
				const lastSlot = shuffledNums.findIndex((val) => val == undefined);
				shuffledNums[lastSlot] = i + 1;
			}
			else {
				let shuffleToPosition = this.randomizePosition(0, this.totalCards - 1);
				while (shuffledNums[shuffleToPosition]) {
					shuffleToPosition = this.randomizePosition(0, this.totalCards - 1);
				}
				shuffledNums[shuffleToPosition] = i + 1;
			}
		}
		return shuffledNums;
	}

	popCards = (deck: ArraySchema<Card>, numToPop: number) => {
		let chosenCards: ArraySchema<Card> = new ArraySchema<Card>();
		for(let i = 0; i < numToPop; i++) {
			chosenCards.push(deck.pop());
		}
		return { deck, chosenCards };
	}

	getSuit(card: number) : string {
		let res = Math.floor(card / 13);
		let mod = card % 13;
		if( mod == 0 )
			res--;

		return this.suits[res];
	}

	getDeck() : ArraySchema<Card> {
		let nums = this.getShuffledNums();
		let deck: ArraySchema<Card> = new ArraySchema<Card>();
		nums.forEach((num) => {
			let card: Card = new Card();
			card.suit = this.getSuit(num);
			let number = num % 13;
			if(number == 0)
				number = 13;
			card.number = number;
			deck.push(card);
		});
		return deck;
	}

	revealPhaseComunityCards(phase: string, deck: ArraySchema<Card>) {
		let comCards: ArraySchema<Card> = new ArraySchema<Card>();
		let res;
		if(phase === `flop`) {
			res = this.popCards(deck, 3);
			res.chosenCards.forEach((chosenCard) => {
				comCards.push(chosenCard);
			});
		}
		else if(phase === `turn` || phase === `river`) {
			res = this.popCards(deck, 1);
			res.chosenCards.forEach((chosenCard) => {
				comCards.push(chosenCard);
			});
		}
		return {deck: res.deck, communityCards: comCards };
	}

	computeHands(players: MapSchema<Player>, communityCards: ArraySchema<Card>, holeCardsToBeUsed: number, cardsInHand: number, rankByHand: string[]) : MapSchema<Player> {
		for(let key in players) {
			let player: Player = players[key];

			console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
			console.log(`Player hand Compute for ${player.id}`);

			if(holeCardsToBeUsed) {
				player = this.computeHandAsPerGameConfig(player, communityCards, holeCardsToBeUsed, cardsInHand, rankByHand);
			}
			else {
				for(let i = 0; i < player.cards.length; i++) {
					player = this.computeHandAsPerGameConfig(player, communityCards, i + 1, cardsInHand, rankByHand);
				}
			}
		}
		
		return players;
	}

	computeHandAsPerGameConfig(player: Player, communityCards: ArraySchema<Card>, holeCardsToBeUsed: number, cardsInHand: number, rankByHand: string[]) : Player {
		let startPlayerCardIndex: number = 0;
		let nextPlayerCardIndex: number = 0;
		let playerCardUsed: number = 0;
		let startComCardIndex: number = 0;
		let nextComCardIndex: number = 0;
		let comCardUsed: number = 0;
		let counter: number = 0;

		do {
			console.log(`In Player Cards Do holeCardsToBeUsed: ${holeCardsToBeUsed}`);
			let playerCardsToBeUsed: ArraySchema<Card> = new ArraySchema<Card>();

			while(counter < holeCardsToBeUsed && playerCardUsed < player.cards.length) {
				playerCardsToBeUsed.push(player.cards[playerCardUsed]);
				playerCardUsed = (playerCardUsed + 1) % player.cards.length;
				counter++;
			}
			nextPlayerCardIndex = (nextPlayerCardIndex + 1) % player.cards.length;
			playerCardUsed = nextPlayerCardIndex;
			counter = 0;
			console.log(`Next Player Card Start Index: ${nextPlayerCardIndex}`);

			do {
				let comCardsToBeUsed: ArraySchema<Card> = new ArraySchema<Card>();

				console.log(`In Comm Cards Do Cards in Hand: ${cardsInHand}`);

				while(counter < (cardsInHand - holeCardsToBeUsed) && comCardUsed < communityCards.length) {
					comCardsToBeUsed.push(communityCards[comCardUsed]);
					comCardUsed = (comCardUsed + 1) % communityCards.length;
					counter++;
				}
				nextComCardIndex = (nextComCardIndex + 1) % communityCards.length;
				comCardUsed = nextComCardIndex;
				counter = 0;
				console.log(`Next Comm Card Start Index: ${nextComCardIndex}`);

				let cardsToBeUsed: ArraySchema<Card> = new ArraySchema<Card>();
				playerCardsToBeUsed.forEach((card) => {
					cardsToBeUsed.push(card);
				});
				comCardsToBeUsed.forEach((card) => {
					cardsToBeUsed.push(card);
				});

				cardsToBeUsed.sort((a,b) => b.number - a.number);

				let cardFrequency: MapSchema<number> = new MapSchema<number>();
				let suitFrequency: MapSchema<number> = new MapSchema<number>();
				cardsToBeUsed.forEach((card) => {
					if(!cardFrequency[card.number])
						cardFrequency[card.number] = 0;
					cardFrequency[card.number] = cardFrequency[card.number] + 1;
		
					if(!suitFrequency[card.suit])
						suitFrequency[card.suit] = 0;
					suitFrequency[card.suit] = suitFrequency[card.suit] + 1;
				});

				console.log(`==================================================`);
				console.log(`Card Frequency ${JSON.stringify(cardFrequency)}`);
				console.log(`Suit Frequency ${JSON.stringify(suitFrequency)}`);
				console.log(`Cards Used ${JSON.stringify(cardsToBeUsed)}`);
						
				let handRes = this.computePlayerHand(suitFrequency, cardFrequency, cardsToBeUsed);

				let changeRes: boolean = false;
				if(player.hand === undefined) {
					changeRes = true;
				}
				else {
					if(rankByHand.indexOf(player.hand) > rankByHand.indexOf(handRes.hand))
						changeRes = true;
					}

				if(changeRes) {
					player.hand = handRes.hand;
					player.bestHand.splice(0, player.bestHand.length);
					handRes.bestHand.forEach((card) => {
						player.bestHand.push(card);
					});
				}
			}
			while(nextComCardIndex != startComCardIndex);
		}
		while(nextPlayerCardIndex != startPlayerCardIndex);

		console.log(`Player Best Hand Name ${player.hand}`);
		console.log(`Player Best Hand -- ${JSON.stringify(player.bestHand)}`);
		console.log(`==================================================`);

		return player;
	}

	computePlayerHand(suitFrequency: MapSchema<number>, cardFrequency: MapSchema<number>, cardsToBeUsed: ArraySchema<Card> ) {
		const flushRes = this.isFlush(suitFrequency);
		const flushCards = (flushRes.isFlush) && this.getSuitCards(cardsToBeUsed, flushRes.flushSuit);
		const royalFlushRes = (flushRes.isFlush) && this.isRoyalFlush(flushCards);
		const straightFlushRes = this.isStraightFlush(flushCards);
		const straightRes = this.isStraight(cardsToBeUsed);
		const straightLowRes = this.isLowStraight(cardsToBeUsed);
		const frequencyRes = this.computeFrequency(cardsToBeUsed, cardFrequency);

		// console.log(`==================================================`);
		// console.log(`Player hand Compute for ${player.id}`);
		// console.log(`Player Cards == ${JSON.stringify(player.cards)}`)
		console.log(`isRoyalFLush: ${royalFlushRes}`);
		console.log(`isStraightFLush: ${straightFlushRes.isStraightFlush} --- isStraightLowFlush: ${straightFlushRes.isLowStraightFlush}`);
		console.log(`isFourOfAKind: ${frequencyRes.isFourOfAKind}`);
		console.log(`isFullHouse: ${frequencyRes.isFullHouse}`);
		console.log(`isFlush: ${flushRes.isFlush}`);
		console.log(`isStraight: ${straightRes.isStraight} --- isStraightLow: ${straightLowRes.isLowStraight}`);
		console.log(`isThreeOfAKind: ${frequencyRes.isThreeOfAKind}`);
		console.log(`isTwoPairs: ${frequencyRes.isTwoPair}`);
		console.log(`isOnePair: ${frequencyRes.isPair}`);
		// console.log(`==================================================`);

		let bestHand: ArraySchema<Card> = new ArraySchema<Card>();
		let hand: string = undefined;
		if(royalFlushRes) {
			flushCards.slice(0, 5).forEach((card) => {
				bestHand.push(card);
			});
			hand = `RoyalFLush`;
		}
		else if(straightFlushRes.isStraightFlush || straightFlushRes.isLowStraightFlush) {
			if(straightFlushRes.isStraightFlush) {
				for(let i = 0; i < 5; i++) {
					bestHand.push(straightFlushRes.concurrentCards[i]);
				}
				hand = `StraightFlush`;
			}
			else {
				straightFlushRes.concurrentCardsLow[0].number = 13;
				for(let i = 0; i < 5; i++) {
					bestHand.push(straightFlushRes.concurrentCardsLow[i]);
				}
				hand = `LowStraightFlush`;
			}
		}
		else if(frequencyRes.isFourOfAKind) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cardsToBeUsed);
			for(let i = 0; i < 4; i++) {
				let indexOfQuad = cardsCopy.findIndex(card => card.number === frequencyRes.quads[0]);
				bestHand.push(cardsCopy[indexOfQuad]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfQuad);
			}
			bestHand.push(cardsCopy[0]);
			hand = `FourOfAKind`;
		}
		else if(frequencyRes.isFullHouse) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cardsToBeUsed);
			for (let i = 0; i < 3; i++) {
				const indexOfTripple = cardsCopy.findIndex(card => card.number === frequencyRes.tripples[0]);
				bestHand.push(cardsCopy[indexOfTripple]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfTripple);
			}

			if (frequencyRes.tripples.length > 1) {
				for (let i = 0; i < 2; i++) {
					const indexOfPair = cardsCopy.findIndex(card => card.number === frequencyRes.tripples[1]);
					bestHand.push(cardsCopy[indexOfPair]);
					cardsCopy = this.filterIndexCard(cardsCopy, indexOfPair);
				}
			}
			else {
				for (let i = 0; i < 2; i++) {
					const indexOfPair = cardsCopy.findIndex(card => card.number === frequencyRes.pairs[0]);
					bestHand.push(cardsCopy[indexOfPair]);
					cardsCopy = this.filterIndexCard(cardsCopy, indexOfPair);
				}
			}
			hand = `FullHouse`;
		}
		else if(flushRes.isFlush) {
			flushCards.slice(0, 5).forEach((card) => {
				bestHand.push(card);
			});
			hand = `Flush`;
		}
		else if(straightRes.isStraight || straightLowRes.isLowStraight) {
			if(straightRes.isStraight) {
				for(let i = 0; i < 5; i++) {
					bestHand.push(straightRes.concurrentCards[i]);
				}
				hand = `Straight`;
			}
			else {
				straightLowRes.concurrentCardsLow[0].number = 13;
				for(let i = 0; i < 5; i++) {
					bestHand.push(straightLowRes.concurrentCardsLow[i]);
				}
				hand = `LowStraight`;
			}
		}
		else if(frequencyRes.isThreeOfAKind) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cardsToBeUsed);
			for (let i = 0; i < 3; i++) {
				const indexOfTripple = cardsCopy.findIndex(card => card.number === frequencyRes.tripples[0]);
				bestHand.push(cardsCopy[indexOfTripple]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfTripple);
			}
			bestHand.push(cardsCopy[0]);
			bestHand.push(cardsCopy[1]);
			hand = `ThreeOfAKind`;
		}
		else if(frequencyRes.isTwoPair) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cardsToBeUsed);
			for (let i = 0; i < 2; i++) {
				const indexOfPair = cardsCopy.findIndex(card => card.number === frequencyRes.pairs[0]);
				bestHand.push(cardsCopy[indexOfPair]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfPair);
			}

			for (let i = 0; i < 2; i++) {
				const indexOfPair = cardsCopy.findIndex(card => card.number === frequencyRes.pairs[1]);
				bestHand.push(cardsCopy[indexOfPair]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfPair);
			}
			bestHand.push(cardsCopy[0]);
			hand = `TwoPair`;
		}
		else if(frequencyRes.isPair) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cardsToBeUsed);
			for (let i = 0; i < 2; i++) {
				const indexOfPair = cardsCopy.findIndex(card => card.number === frequencyRes.pairs[0]);
				bestHand.push(cardsCopy[indexOfPair]);
				cardsCopy = this.filterIndexCard(cardsCopy, indexOfPair);
			}

			bestHand.push(cardsCopy[0]);
			bestHand.push(cardsCopy[1]);
			bestHand.push(cardsCopy[2]);
			hand = `Pair`;
		}
		else {
			cardsToBeUsed.slice(0, 5).forEach((card) => {
				bestHand.push(card);
			});
			hand = `HighCard`;
		}

		return { bestHand: bestHand, hand: hand };
	}

	isFlush(suitFrequency: MapSchema<number>) {
		for(let suit in suitFrequency) {
			if(suitFrequency[suit] >= 5) {
				return {isFlush: true, flushSuit: suit};
			}
		}
		return {isFlush: false, flushSuit: null};
	}

	isRoyalFlush(cards: ArraySchema<Card>) {
		if ((cards[0].number === 13) && (cards[1].number === 12) && 
			(cards[2].number === 11) && (cards[3].number === 10) &&
			(cards[4].number === 10)) { 
				return true;
		}
		else {
			return false;
		} 
	}

	isStraightFlush(cards: ArraySchema<Card>) {
		if(!cards) {
			return { isStraightFlush: false, isLowStraightFlush: false };
		}
		const straightRes = this.isStraight(cards);
		const lowStraightRes = this.isLowStraight(cards);
		return { isStraightFlush: straightRes.isStraight, isLowStraightFlush: lowStraightRes.isLowStraight, 
				concurrentCards: straightRes.concurrentCards, concurrentCardsLow: lowStraightRes.concurrentCardsLow};
	}

	isStraight(cards: ArraySchema<Card>) {
		return this.checkStraight(cards, false);
	}

	isLowStraight(cards: ArraySchema<Card>) {
		if(cards[0].number === 13) {
			let cardsCopy: ArraySchema<Card> = this.copyCards(cards);
			cardsCopy[0].number = 0;
			cardsCopy.sort((a,b) => b.number - a.number);
			return this.checkStraight(cardsCopy, true);
		}
		return {isLowStraight: false };
	}

	checkStraight(cards: ArraySchema<Card>, forLow: boolean) {
		if (cards.length < 5) {
			if(forLow)
				return {isLowStraight: false };
			else
				return {isStraight: false };
		}
	
		let checkValue = forLow ? 1 : -1
		let numConcurrentCards = 0;
		let concurrentCards: ArraySchema<Card> = new ArraySchema<Card>();
		for (let i = 1; i < cards.length; i++) {
			if (numConcurrentCards === 5) {
				if(forLow)
					return { isLowStraight: true, concurrentCardsLow: concurrentCards };
				else
					return { isStraight: true, concurrentCards: concurrentCards };
			}
		
			if ((cards[i].number - cards[i - 1].number) === checkValue) {
				if(numConcurrentCards === 0) {
					numConcurrentCards = 2;
					concurrentCards.push(cards[i - 1]);
					concurrentCards.push(cards[i]);
				}
				else {
					numConcurrentCards++;
					concurrentCards.push(cards[i]);
				}
			}
			else {
				numConcurrentCards = 0;
					concurrentCards = new ArraySchema<Card>(); 
			}
		}
		
		if (numConcurrentCards >= 5) {
			if(forLow)
				return { isLowStraight: true, concurrentCardsLow: concurrentCards };
			else
				return { isStraight: true, concurrentCards: concurrentCards };
		}
		else {
			if(forLow)
				return { isLowStraight: false, concurrentCardsLow: concurrentCards };
			else
				return { isStraight: false, concurrentCards: concurrentCards };
		}
	}

	computeFrequency(cards: ArraySchema<Card>, cardFrequency: MapSchema<number>) {
		let isFourOfAKind = false;
		let isFullHouse = false
		let isThreeOfAKind = false;
		let isTwoPair = false;
		let isPair = false;
		let pairs: Array<number> = new Array<number>();
		let tripples: Array<number> = new Array<number>();
		let quads: Array<number> = new Array<number>();

		for (let key in cardFrequency) {
			if (cardFrequency[key] === 4) {
				isFourOfAKind = true;
				quads.push(Number(key));
			}

			if (cardFrequency[key] === 3) {
				isThreeOfAKind = true;
				tripples.push(Number(key));
			}

			if (cardFrequency[key] === 2) {
				isPair = true;
				pairs.push(Number(key));
			}
		}

		// Ensure histogram arrays are sorted in descending order to build best hand top down
		pairs = pairs.sort((a,b) => b - a);
		tripples = tripples.sort((a,b) => b - a);
		quads = quads.sort((a,b) => b - a);
		
		// check fullHouse & twoPairs
		if((tripples.length >= 2) || (pairs.length >= 1 && tripples.length >=1)) {
			isFullHouse = true
		}

		if(pairs.length >= 2) {
			isTwoPair = true
		}

		return { isFourOfAKind, isFullHouse, isThreeOfAKind, isTwoPair, isPair, pairs, tripples, quads };
	}

	copyCards(cards: ArraySchema<Card>) : ArraySchema<Card> {
		let copyCards: ArraySchema<Card> = new ArraySchema<Card>();
		cards.forEach((card) => {
			let newCard: Card = new Card();
			newCard.number = card.number;
			newCard.suit = card.suit;
			newCard.isHole = card.isHole;
			copyCards.push(newCard);
		});
		return copyCards;
	}

	filterIndexCard(cards: ArraySchema<Card>, skipIndex: number) : ArraySchema<Card> {
		let copyCards: ArraySchema<Card> = new ArraySchema<Card>();
		for(let i = 0; i < cards.length; i++) {
			if(i !== skipIndex) {
				let newCard: Card = new Card();
				newCard.number = cards[i].number;
				newCard.suit = cards[i].suit;
				newCard.isHole = cards[i].isHole;
				copyCards.push(newCard);
			}
		}
		return copyCards;
	}

	getSuitCards(cards: ArraySchema<Card>, suit: string) : ArraySchema<Card> {
		let copyCards: ArraySchema<Card> = new ArraySchema<Card>();
		cards.forEach((card) => {
			if(card.suit === suit) {
				let newCard: Card = new Card();
				newCard.number = card.number;
				newCard.suit = card.suit;
				newCard.isHole = card.isHole;
				copyCards.push(newCard);
			}
		});
		return copyCards;
	}
}