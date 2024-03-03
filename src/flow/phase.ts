import { uniqueId, range, pullAt } from "lodash";

import { GameState } from "../types";
import { assertNever, shiftArray } from "../utils";
import { VariableContainer } from "../variables";
import { BaseBlockClass } from "./base";
import { blockClassFactory } from "./factory";
import {
  BlockType,
  PhaseRepetition,
  PhaseBlock,
  EndPhaseFlowSignal,
  EachPlayerPhaseBlock,
} from "./types";

export abstract class BasePhaseBlockClass extends BaseBlockClass {
  /*
   * The base phase block class.
   */
  type: BlockType.PHASE;
  repetition: PhaseRepetition;
  isImplicit: boolean;
  name: string;
  blocks: BaseBlockClass[];

  static factory(block: PhaseBlock) {
    /*
     * Factory method for constructing the appropriate block based on the
     * repetition from the provided definition.
     */
    switch (block.repetition) {
      case PhaseRepetition.ONCE:
        return new OncePhaseBlockClass(block);
      case PhaseRepetition.FOREVER:
        return new ForeverPhaseBlockClass(block);
      case PhaseRepetition.FOR_EACH_PLAYER:
        return new EachPlayerPhaseBlockClass(block);
      default:
        assertNever(block);
    }
  }

  constructor(block: PhaseBlock, isImplicit?: boolean) {
    super();
    this.isImplicit = isImplicit ?? false;
    this.name = block.name || `Untitled ${uniqueId()}`;
    this.blocks = block.blocks.map((block) => blockClassFactory(block));
  }

  abstract shouldExecute(): boolean;

  beforeLoop(currentState: GameState) {
    /*
     * Lifecycle method that occurs before the loop begins.
     */
    return currentState;
  }
  onLoopStart(currentState: GameState) {
    /*
     * Lifecycle method that occurs at the start of each iteration of the loop.
     */
    return currentState;
  }

  async execute(currentState: GameState) {
    /*
     * Handles flow control for all phase blocks.
     * Loops through the blocks as long as shouldExecute() resolves to true.
     */
    console.log(`Beginning new phase: ${this.name}.`);

    const beforeLoopState = this.beforeLoop(currentState);

    let newState = new GameState({
      ...beforeLoopState.variables,
      currentindex: 1,
    });
    try {
      while (this.shouldExecute()) {
        newState = this.onLoopStart(newState);
        for (const block of this.blocks) {
          newState = await block.execute(newState);
        }
        newState = new GameState({
          ...newState.variables,
          // https://trello.com/c/ASBUCh50: Properly type currentindex in game state and make read-only
          currentindex: (newState.variables.currentindex as number) + 1,
        });
      }
    } catch (e) {
      if (e instanceof EndPhaseFlowSignal && !this.isImplicit) {
        newState = e.gameState;
      } else {
        console.log(`End of phase: ${this.name}.`);
        throw e;
      }
    }

    console.log(`End of phase: ${this.name}.`);
    return newState;
  }
}

export class OncePhaseBlockClass extends BasePhaseBlockClass {
  /*
   * A phase block that runs through all of the blocks exactly once.
   */
  hasLoopedThroughOnce: boolean = false;

  beforeLoop(currentState: GameState) {
    this.hasLoopedThroughOnce = false;
    return currentState;
  }
  shouldExecute() {
    return !this.hasLoopedThroughOnce;
  }
  onLoopStart(currentState: GameState) {
    this.hasLoopedThroughOnce = true;
    return currentState;
  }
}

class ForeverPhaseBlockClass extends BasePhaseBlockClass {
  /*
   * A phase block that continuously runs through all of the blocks
   * until the phase is terminated.
   */
  shouldExecute() {
    return true;
  }
}

class EachPlayerPhaseBlockClass extends BasePhaseBlockClass {
  /*
   * A phase block that runs through all of the blocks once for each player.
   * Optionally, the starting player can be configured.
   */
  startingPlayer?: string;
  playerIdsRemaining: number[];

  constructor(block: EachPlayerPhaseBlock, isImplicit?: boolean) {
    super(block, isImplicit);
    this.startingPlayer = block.startingPlayer;
  }

  getPlayerOrderShiftNum(gameState: GameState) {
    if (this.startingPlayer == null) {
      return 0;
    } else {
      const parsedExpression = gameState.parseExpression(this.startingPlayer);
      // https://trello.com/c/qotJQ9W1: Throw error if not number or player
      const playerId =
        typeof parsedExpression === "number"
          ? parsedExpression
          : parsedExpression.id;
      return playerId - 1;
    }
  }

  getPlayerOrder(gameState: GameState) {
    // https://trello.com/c/ffPR3cvR: Properly type players in game state (do not allow users to overwrite read-only aspects of players)
    const players = gameState.variables.players as VariableContainer[];
    const playerIds = range(1, players.length + 1);
    return shiftArray(playerIds, this.getPlayerOrderShiftNum(gameState));
  }

  beforeLoop(currentState: GameState) {
    this.playerIdsRemaining = this.getPlayerOrder(currentState);
    return currentState;
  }
  shouldExecute() {
    return this.playerIdsRemaining.length > 0;
  }
  onLoopStart(currentState: GameState): GameState {
    const [currentPlayerId] = pullAt(this.playerIdsRemaining, 0);
    const currentPlayer = currentState.variables.players[currentPlayerId - 1];
    console.log(`Current player is now ${currentPlayer.name}.`);
    return new GameState({ ...currentState.variables, current: currentPlayer });
  }
}
