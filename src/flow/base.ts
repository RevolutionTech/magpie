import { GameState } from "../types";
import { BlockType } from "./types";

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
}
