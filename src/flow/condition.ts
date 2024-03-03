import { GameState } from "../types";
import { BaseBlockClass } from "./base";
import { OncePhaseBlockClass } from "./phase";
import { BlockType, FlowBlock, ConditionBlock, PhaseRepetition } from "./types";

export class ConditionBlockClass extends BaseBlockClass {
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
