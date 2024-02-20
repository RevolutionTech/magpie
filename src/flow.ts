import cloneDeep from "lodash/cloneDeep";
import pull from "lodash/pull";
import pullAt from "lodash/pullAt";
import range from "lodash/range";
import shuffle from "lodash/shuffle";
import startsWith from "lodash/startsWith";
import uniqueId from "lodash/uniqueId";
import inquirer from "inquirer";

import { parse } from "./parser";
import { ParserOptions } from "./types";
import { assertNever, shiftArray } from "./utils";
import {
  Location,
  VariableContainer,
  isComponentLocation,
  isCollectionLocation,
} from "./variables";

export class GameState {
  variables: VariableContainer;

  constructor(variables: VariableContainer) {
    this.variables = variables;
  }

  parseExpression(expression: string, options: ParserOptions = {}) {
    if (startsWith(expression, "=")) {
      return parse(expression.slice(1), { variables: this.variables }, options);
    }
    return expression;
  }
}

class FlowSignal extends Error {
  gameState: GameState;

  constructor(gameState: GameState) {
    super();
    this.gameState = gameState;
  }
}
class EndPhaseFlowSignal extends FlowSignal {}
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
enum EventBlockType {
  SET_VARIABLE = "setVariable",
  MOVE_COMPONENT = "moveComponent",
  SHUFFLE = "shuffle",
  END_PHASE = "endPhase",
  END_GAME = "endGame",
}
enum CollectionPickMethod {
  DRAW = "draw",
  FIND = "find",
}
type BaseEventBlock = {
  type: BlockType.EVENT;
  eventType: EventBlockType;
};
type SetVariableBlock = BaseEventBlock & {
  eventType: EventBlockType.SET_VARIABLE;
  variable: string;
  expression: string;
};
type MoveComponentBlock = BaseEventBlock & {
  eventType: EventBlockType.MOVE_COMPONENT;
  source: string;
  pickMethod?: CollectionPickMethod;
  pickFindExpression?: string;
  destination: string;
};
type ShuffleBlock = BaseEventBlock & {
  eventType: EventBlockType.SHUFFLE;
  stack: string;
};
type EndPhaseBlock = BaseEventBlock & { eventType: EventBlockType.END_PHASE };
type EndGameBlock = BaseEventBlock & {
  eventType: EventBlockType.END_GAME;
  winners: string;
};
type EventBlock =
  | SetVariableBlock
  | MoveComponentBlock
  | ShuffleBlock
  | EndPhaseBlock
  | EndGameBlock;

type ConditionBlock = {
  type: BlockType.CONDITION;
  expression: string;
  whenTrue: FlowBlock[];
};

enum InputFieldType {
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
type InputField = BooleanInputField | PlayingCardInputField;
type InputBlock = {
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
type EachPlayerPhaseBlock = BasePhaseBlock & {
  repetition: PhaseRepetition.FOR_EACH_PLAYER;
  startingPlayer?: string;
};
type OtherPhaseBlock = BasePhaseBlock & {
  repetition: PhaseRepetition.ONCE | PhaseRepetition.FOREVER;
};
type PhaseBlock = EachPlayerPhaseBlock | OtherPhaseBlock;

export type FlowBlock = EventBlock | ConditionBlock | InputBlock | PhaseBlock;

const prettyPrint = (obj: any) => JSON.stringify(obj, null, 2);

export abstract class BaseBlockClass {
  /*
   * The base block class. These classes define the behaviour of the block
   * in their corresponding execute() method.
   *
   * Users will provide specs for these blocks in JSON format.
   * Often they will contain expressions.
   */
  type: BlockType;

  abstract execute(currentState: GameState): GameState | Promise<GameState>;

  static factory(block: FlowBlock) {
    /*
     * Factory method for constructing the appropriate block based on
     * the type from the provided definition.
     */
    switch (block.type) {
      case BlockType.EVENT:
        return BaseEventBlockClass.factory(block);
      case BlockType.CONDITION:
        return new ConditionBlockClass(block);
      case BlockType.INPUT:
        return new InputBlockClass(block);
      case BlockType.PHASE:
        return BasePhaseBlockClass.factory(block);
      default:
        assertNever(block);
    }
  }
}

abstract class BaseEventBlockClass extends BaseBlockClass {
  /*
   * The base event block class.
   */
  type: BlockType.EVENT;
  eventType: EventBlockType;

  static factory(block: EventBlock) {
    /*
     * Factory method for constructing the appropriate event block
     * based on the event type from the provided definition.
     */
    switch (block.eventType) {
      case EventBlockType.SET_VARIABLE:
        return new SetVariableBlockClass(block);
      case EventBlockType.MOVE_COMPONENT:
        return new MoveComponentBlockClass(block);
      case EventBlockType.SHUFFLE:
        return new ShuffleBlockClass(block);
      case EventBlockType.END_PHASE:
        return new EndPhaseBlockClass();
      case EventBlockType.END_GAME:
        return new EndGameBlockClass(block);
      default:
        assertNever(block);
    }
  }

  execute(currentState: GameState) {
    return new GameState(cloneDeep(currentState.variables));
  }
}
class SetVariableBlockClass extends BaseEventBlockClass {
  /*
   * A block for setting a variable in the game state
   * (typically based on an expression).
   */
  eventType: EventBlockType.SET_VARIABLE;
  variable: string;
  expression: string;

  constructor(block: SetVariableBlock) {
    super();
    this.variable = block.variable.toLowerCase();
    this.expression = block.expression;
  }

  execute(currentState: GameState) {
    const newState = new GameState(cloneDeep(currentState.variables));
    let expressionResult = newState.parseExpression(this.expression);
    if (isComponentLocation(newState.variables[this.variable])) {
      // Wrap components for ComponentLocation destinations
      // TODO: Simplify logic for wrapping ComponentLocation destinations
      expressionResult = { component: expressionResult };
    }
    console.log(
      `Updating ${this.variable} to ${prettyPrint(expressionResult)}.`
    );
    newState.variables[this.variable] = expressionResult;
    return newState;
  }
}
class MoveComponentBlockClass extends BaseEventBlockClass {
  /*
   * A block for moving a component from one location to another.
   *
   * The source location may contain a single component or a collection of components.
   * If the source is a reference to a single component, that component is removed
   * from that location (to be moved to the proper destination).
   * If the source is a reference to a collection, a method must be specified for how
   * to take a single component from that collection.
   * The method could be "draw", to draw the first item in the collection.
   * The method could instead be "find", to find for a specific item in the collection.
   *
   * The destination location may be an empty location or contain a collection of components.
   * If the destination is a reference to an empty location, the component is moved there.
   * If the destination is a reference to a collection, the component is added to that collection.
   */
  eventType: EventBlockType.MOVE_COMPONENT;
  source: string;
  pickMethod?: CollectionPickMethod;
  pickFindExpression?: string;
  destination: string;

  constructor(block: MoveComponentBlock) {
    super();
    this.source = block.source;
    this.pickMethod = block.pickMethod;
    this.pickFindExpression = block.pickFindExpression;
    this.destination = block.destination;
  }

  extractComponent(gameState: GameState, location: Location) {
    console.log(`Extracting component from ${prettyPrint(location)}.`);
    if (isCollectionLocation(location)) {
      switch (this.pickMethod) {
        case CollectionPickMethod.DRAW:
          return pullAt(location.collection, 0)[0];
        case CollectionPickMethod.FIND:
          const componentToFind = gameState.parseExpression(
            this.pickFindExpression
          );
          pull(location.collection, componentToFind);
          return componentToFind;
        case undefined:
          throw new Error(
            "A pick method must be provided when move components from a collection."
          );
        default:
          assertNever(this.pickMethod);
      }
    } else if (isComponentLocation(location)) {
      const component = location.component;
      location.component = null;
      return component;
    } else {
      assertNever(location);
    }
  }

  placeComponent(component: VariableContainer, location: Location) {
    if (isCollectionLocation(location)) {
      console.log(
        `Adding ${prettyPrint(component)} to collection of size ${location.collection.length}.`
      );
      location.collection.push(component);
    } else if (isComponentLocation(location)) {
      console.log(
        `Replacing ${prettyPrint(location.component)} with ${prettyPrint(component)}.`
      );
      location.component = component;
    } else {
      assertNever(location);
    }
  }

  execute(currentState: GameState) {
    const newState = new GameState(cloneDeep(currentState.variables));
    const sourceLocation = newState.parseExpression(this.source, {
      resolveLocations: false,
    });
    const destinationLocation = newState.parseExpression(this.destination, {
      resolveLocations: false,
    });

    const sourceComponent = this.extractComponent(newState, sourceLocation);
    this.placeComponent(sourceComponent, destinationLocation);

    return newState;
  }
}
class ShuffleBlockClass extends BaseEventBlockClass {
  /*
   * A block for shuffling the components in a stack.
   */
  eventType: EventBlockType.SHUFFLE;
  stack: string;

  constructor(block: ShuffleBlock) {
    super();
    this.stack = block.stack.toLowerCase();
  }

  execute(currentState: GameState) {
    const newState = new GameState(cloneDeep(currentState.variables));
    const stackLocation = newState.variables[this.stack];
    if (isCollectionLocation(stackLocation)) {
      console.log(`Shuffling ${this.stack}.`);
      shuffle(stackLocation.collection);
      return newState;
    } else {
      throw new Error(
        `Location of type ${typeof stackLocation} is not a collection and cannot be shuffled.`
      );
    }
  }
}
class EndPhaseBlockClass extends BaseEventBlockClass {
  /*
   * A block that throws a flow signal to end the current phase.
   */
  eventType: EventBlockType.END_PHASE;

  execute(currentState: GameState): never {
    throw new EndPhaseFlowSignal(currentState);
  }
}
class EndGameBlockClass extends BaseEventBlockClass {
  /*
   * A block that throws a flow signal to end the game.
   * This block is also responsible for calculating the winner(s) of the game.
   */
  eventType: EventBlockType.END_GAME;
  winners: string;

  constructor(block: EndGameBlock) {
    super();
    this.winners = block.winners;
  }

  execute(currentState: GameState): never {
    const winningPlayers = currentState.parseExpression(this.winners);
    const winners = winningPlayers.map((player) => player.name);
    throw new EndGameFlowSignal(currentState, winners);
  }
}
type EventBlockClass =
  | SetVariableBlockClass
  | MoveComponentBlockClass
  | ShuffleBlockClass
  | EndPhaseBlockClass
  | EndGameBlockClass;

class ConditionBlockClass extends BaseBlockClass {
  /*
   * A block for constructing branching logic in the flow.
   * This block contains subblocks that will execute if a particular condition
   * evaluates to true.
   */
  type: BlockType.CONDITION;
  expression: string;
  whenTrue: FlowBlock[];

  constructor(block: ConditionBlock) {
    super();
    this.expression = block.expression;
    this.whenTrue = block.whenTrue;
  }

  async execute(currentState: GameState) {
    console.log(`Evaluating condition ${this.expression}.`);
    if (currentState.parseExpression(this.expression)) {
      console.log("Condition is true. Following conditional blocks.");
      return await new OncePhaseBlockClass(
        {
          type: BlockType.PHASE,
          repetition: PhaseRepetition.ONCE,
          name: `When ${this.expression}`,
          blocks: this.whenTrue,
        },
        true
      ).execute(currentState);
    }
    console.log("Condition is false. Skipping conditional blocks.");
    return currentState;
  }
}

class InputBlockClass extends BaseBlockClass {
  /*
   * A block for requesting input from the end user.
   * This block represents a form containing a series of fields that the user
   * must submit together. The value of each field is saved to its own variable.
   */
  type: BlockType.INPUT;
  form: InputField[];

  constructor(block: InputBlock) {
    super();
    this.form = block.form;
  }

  constructInquirerQuestions(gameState: GameState) {
    return this.form.map((field) => {
      const baseQuestion = {
        name: field.name.toLowerCase(),
        message: field.label,
      };

      switch (field.type) {
        case InputFieldType.BOOLEAN:
          return {
            ...baseQuestion,
            type: "confirm",
          };
        case InputFieldType.CARD:
          // PROBLEM: We aren't actually removing the card from the hand when a user selects a card this way
          const allCards = gameState.parseExpression(field.options);
          const isOptionValid = gameState.parseExpression(field.isOptionValid);
          const choices = allCards.filter(isOptionValid).map((card) => ({
            name: JSON.stringify(card),
            value: { component: card },
          }));
          return {
            ...baseQuestion,
            type: "list",
            choices,
            loop: false,
          };
        default:
          assertNever(field);
      }
    });
  }

  async execute(currentState: GameState) {
    const questions = this.constructInquirerQuestions(currentState);
    const answers = await inquirer.prompt(questions);
    return new GameState({ ...currentState.variables, ...answers });
  }
}

abstract class BasePhaseBlockClass extends BaseBlockClass {
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
    this.blocks = block.blocks.map((block) => BaseBlockClass.factory(block));
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
          // TODO: Properly type currentindex in game state and make read-only
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
      // TODO: Throw error if not number or player
      const playerId =
        typeof parsedExpression === "number"
          ? parsedExpression
          : parsedExpression.id;
      return playerId - 1;
    }
  }

  getPlayerOrder(gameState: GameState) {
    // TODO: Properly type players in game state (do not allow users to overwrite read-only aspects of players)
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
