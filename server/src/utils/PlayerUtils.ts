import { Player } from "../State";
import { MapSchema, ArraySchema } from '@colyseus/schema';

//Utility class for Cards
export class PlayerUtils {
  rankByHand = [
    `RoyalFLush`,
    `StraightFlush`,
    `LowStraightFlush`,
    `FourOfAKind`,
    `FullHouse`,
    `Flush`,
    `Straight`,
    `LowStraight`,
    `ThreeOfAKind`,
    `TwoPair`,
    `Pair`,
    `HighCard`
  ];

  getRandomPlayer(totalPlayers: number) : number {
    let randomPlayer = Math.random() * Math.floor(totalPlayers);
    return Math.floor(randomPlayer);
  }

  determineWinners(players: MapSchema<Player>) : ArraySchema<Player> {
    let winningPlayers: string[] = [];
    let winningHand: number = -1;
    for(let key in players) {
      console.log(`Player id ${players[key].id} and hand ${players[key].hand}`);
      if(winningHand === -1) {
        winningHand = this.rankByHand.indexOf(players[key].hand);
        winningPlayers.push(key);
        console.log(`1 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
        continue;
      }

      let curWinningHand: number = this.rankByHand.indexOf(players[key].hand);
      if(curWinningHand <= winningHand) {
        if(curWinningHand === winningHand) {
          winningPlayers.push(key);
          console.log(`2 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
        }
        else {
          winningPlayers.splice(0, winningPlayers.length);
          winningHand = curWinningHand;
          winningPlayers.push(key);
          console.log(`3 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
        }
      }
    }

    let winners: ArraySchema<Player> = new ArraySchema<Player>();
    for(let i = 0; i < winningPlayers.length; i++) {
      console.log(`Winning Index: ${winningPlayers[i]}`);
      winners.push(players[winningPlayers[i]]);
      console.log(`Winning Player ${JSON.stringify(players[winningPlayers[i]])}`);
    }
    return winners;
  }
}