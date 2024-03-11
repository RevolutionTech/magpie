import pullAt from "lodash/pullAt";
import range from "lodash/range";

import { BaseBlockClass } from "../flow/base";
import { GameState } from "../types";
import { shiftArray } from "../utils";
import { VariableContainer } from "../variables";
import { blockClassFactory } from "./factory";
import {
  EachPlayerPhaseDefinition,
  EndPhaseFlowSignal,
  PhaseDefinition,
} from "./types";

export abstract class BasePhase {
  /*
   * The base phase class.
   */
  name: string;
  isImplicit: boolean;
  definition: PhaseDefinition;
  blocks: BaseBlockClass[];

  constructor(
    phases: Record<string, PhaseDefinition>,
    name: string,
    overrideDefinition?: PhaseDefinition,
    isImplicit?: boolean
  ) {
    this.name = name;
    this.isImplicit = isImplicit ?? false;
    this.definition = overrideDefinition ?? phases[name];
    this.blocks = this.definition.blocks.map((block) =>
      blockClassFactory(phases, block)
    );
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
     * Handles flow control for all phases.
     * Loops through the phase's blocks as long as shouldExecute() resolves to true.
     */
    console.log(`Beginning new phase: ${this.name}.`);

    let currentIndex = 1;
    const beforeLoopState = this.beforeLoop(currentState);

    let newState = new GameState({
      ...beforeLoopState.variables,
      currentindex: currentIndex,
    });
    try {
      while (this.shouldExecute()) {
        newState = this.onLoopStart(newState);
        for (const block of this.blocks) {
          newState = await block.execute(newState);
        }
        currentIndex += 1;
        newState = new GameState({
          ...newState.variables,
          // https://trello.com/c/ASBUCh50: Properly type currentindex in game state
          currentindex: currentIndex,
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

export class OncePhase extends BasePhase {
  /*
   * A phase that runs through all of the blocks exactly once.
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

export class ForeverPhase extends BasePhase {
  /*
   * A phase that continuously runs through all of the blocks
   * until the phase is terminated.
   */
  shouldExecute() {
    return true;
  }
}

export class EachPlayerPhase extends BasePhase {
  /*
   * A phase that runs through all of the blocks once for each player.
   * Optionally, the starting player can be configured.
   */
  definition: EachPlayerPhaseDefinition;
  startingPlayer?: string;
  playerIdsRemaining: number[];

  constructor(
    phases: Record<string, PhaseDefinition>,
    name: string,
    overrideDefinition?: EachPlayerPhaseDefinition,
    isImplicit?: boolean
  ) {
    super(phases, name, overrideDefinition, isImplicit);
    this.startingPlayer = this.definition.startingPlayer;
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
