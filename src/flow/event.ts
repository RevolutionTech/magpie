import { cloneDeep, pullAt, pull, shuffle } from "lodash";

import { GameState } from "../types";
import { assertNever } from "../utils";
import {
  isComponentLocation,
  Location,
  isCollectionLocation,
  VariableContainer,
} from "../variables";
import { BaseBlockClass } from "./base";
import {
  BlockType,
  EventBlockType,
  EventBlock,
  SetVariableBlock,
  CollectionPickMethod,
  MoveComponentBlock,
  ShuffleBlock,
  EndPhaseFlowSignal,
  EndGameBlock,
  EndGameFlowSignal,
} from "./types";

const prettyPrint = (obj: any) => JSON.stringify(obj, null, 2);

export abstract class BaseEventBlockClass extends BaseBlockClass {
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
      newState.variables[this.stack] = {
        collection: shuffle(stackLocation.collection),
      };
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
