import { FlowBlock } from "../flow/types";
import { GameState, PhaseRepetition } from "../types";

type BasePhaseDefinition = {
  blocks: FlowBlock[];
  view?: string;
};
export type EachPlayerPhaseDefinition = BasePhaseDefinition & {
  repetition: PhaseRepetition.FOR_EACH_PLAYER;
  startingPlayer?: string;
};
type OtherPhaseDefinition = BasePhaseDefinition & {
  repetition?: PhaseRepetition.ONCE | PhaseRepetition.FOREVER;
};
export type PhaseDefinition = EachPlayerPhaseDefinition | OtherPhaseDefinition;

class FlowSignal extends Error {
  gameState: GameState;

  constructor(gameState: GameState) {
    super();
    this.gameState = gameState;
  }
}
export class EndPhaseFlowSignal extends FlowSignal {}
export class EndGameFlowSignal extends FlowSignal {
  winners: string[];

  constructor(gameState: GameState, winners: string[]) {
    super(gameState);
    this.winners = winners;
  }
}
