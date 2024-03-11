import { OncePhase } from "../phase/phase";
import { PhaseDefinition } from "../phase/types";
import { GameState } from "../types";
import { BaseBlockClass } from "./base";
import { BlockType, FlowBlock, ConditionBlock } from "./types";

export class ConditionBlockClass extends BaseBlockClass {
  /*
   * A block for constructing branching logic in the flow.
   * This block contains subblocks that will execute if a particular condition
   * evaluates to true.
   */
  phases: Record<string, PhaseDefinition>;
  type: BlockType.CONDITION;
  expression: string;
  whenTrue: FlowBlock[];

  constructor(phases: Record<string, PhaseDefinition>, block: ConditionBlock) {
    super();
    this.phases = phases;
    this.expression = block.expression;
    this.whenTrue = block.whenTrue;
  }

  async execute(currentState: GameState) {
    console.log(`Evaluating condition ${this.expression}.`);
    if (currentState.parseExpression(this.expression)) {
      console.log("Condition is true. Following conditional blocks.");
      return await new OncePhase(
        this.phases,
        `When ${this.expression}`,
        { blocks: this.whenTrue },
        true
      ).execute(currentState);
    }
    console.log("Condition is false. Skipping conditional blocks.");
    return currentState;
  }
}
