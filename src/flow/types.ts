import { GameState } from "../types";

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

export enum BlockType {
  EVENT = "event",
  CONDITION = "condition",
  INPUT = "input",
  PHASE = "phase",
}
export enum EventBlockType {
  SET_VARIABLE = "setVariable",
  MOVE_COMPONENT = "moveComponent",
  SHUFFLE = "shuffle",
  END_PHASE = "endPhase",
  END_GAME = "endGame",
}
export enum CollectionPickMethod {
  DRAW = "draw",
  FIND = "find",
}
type BaseEventBlock = {
  type: BlockType.EVENT;
  eventType: EventBlockType;
};
export type SetVariableBlock = BaseEventBlock & {
  eventType: EventBlockType.SET_VARIABLE;
  variable: string;
  expression: string;
};
export type MoveComponentBlock = BaseEventBlock & {
  eventType: EventBlockType.MOVE_COMPONENT;
  source: string;
  pickMethod?: CollectionPickMethod;
  pickFindExpression?: string;
  destination: string;
};
export type ShuffleBlock = BaseEventBlock & {
  eventType: EventBlockType.SHUFFLE;
  stack: string;
};
type EndPhaseBlock = BaseEventBlock & { eventType: EventBlockType.END_PHASE };
export type EndGameBlock = BaseEventBlock & {
  eventType: EventBlockType.END_GAME;
  winners: string;
};
export type EventBlock =
  | SetVariableBlock
  | MoveComponentBlock
  | ShuffleBlock
  | EndPhaseBlock
  | EndGameBlock;

export type ConditionBlock = {
  type: BlockType.CONDITION;
  expression: string;
  whenTrue: FlowBlock[];
};

export enum InputFieldType {
  BOOLEAN = "boolean",
  CARD = "card",
}
type BaseInputField = { name: string; label: string };
type BooleanInputField = BaseInputField & { type: InputFieldType.BOOLEAN };
type PlayingCardInputField = BaseInputField & {
  type: InputFieldType.CARD;
  options: string;
  isOptionValid: string;
};
export type InputField = BooleanInputField | PlayingCardInputField;
export type InputBlock = {
  type: BlockType.INPUT;
  form: InputField[];
};

export enum PhaseRepetition {
  ONCE = "once",
  FOREVER = "forever",
  FOR_EACH_PLAYER = "forEachPlayer",
}
type BasePhaseBlock = {
  type: BlockType.PHASE;
  repetition: PhaseRepetition;
  name?: string;
  blocks: FlowBlock[];
};
export type EachPlayerPhaseBlock = BasePhaseBlock & {
  repetition: PhaseRepetition.FOR_EACH_PLAYER;
  startingPlayer?: string;
};
type OtherPhaseBlock = BasePhaseBlock & {
  repetition: PhaseRepetition.ONCE | PhaseRepetition.FOREVER;
};
export type PhaseBlock = EachPlayerPhaseBlock | OtherPhaseBlock;

export type FlowBlock = EventBlock | ConditionBlock | InputBlock | PhaseBlock;
