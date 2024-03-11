import { PhaseRepetition } from "../types";

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
  TOP = "top",
  SPECIFIC = "specific",
  CRITERIA = "criteria",
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
  searchExpression?: string;
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
  NUMBER = "number",
  CARD = "card",
}
type BaseInputField = { name: string; label: string };
type PrimitiveInputField = BaseInputField & {
  type: InputFieldType.BOOLEAN | InputFieldType.NUMBER;
};
type PlayingCardInputField = BaseInputField & {
  type: InputFieldType.CARD;
  options: string;
  isOptionValid: string;
};
export type InputField = PrimitiveInputField | PlayingCardInputField;
export type InputBlock = {
  type: BlockType.INPUT;
  form: InputField[];
};

type BasePhaseBlock = {
  type: BlockType.PHASE;
  phase: string;
};
export type EachPlayerPhaseBlock = BasePhaseBlock & {
  repetition: PhaseRepetition.FOR_EACH_PLAYER;
  startingPlayer?: string;
};
type OtherPhaseBlock = BasePhaseBlock & {
  repetition?: PhaseRepetition.ONCE | PhaseRepetition.FOREVER;
};
export type PhaseBlock = EachPlayerPhaseBlock | OtherPhaseBlock;

export type FlowBlock = EventBlock | ConditionBlock | InputBlock | PhaseBlock;
