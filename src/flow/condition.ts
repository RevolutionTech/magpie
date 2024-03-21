import { OncePhase } from "../phase/phase";
import { PhaseDefinition } from "../phase/types";
import { GameState } from "../types";
import { View } from "../views";
import { BaseBlockClass } from "./base";
import { BlockType, FlowBlock, ConditionBlock } from "./types";

export class ConditionBlockClass extends BaseBlockClass {
  /*
   * A block for constructing branching logic in the flow.
   * This block contains subblocks that will execute if a particular condition
   * evaluates to true.
   */
  phases: Record<string, PhaseDefinition>;
  views: Record<string, View>;
  type: BlockType.CONDITION;
  expression: string;
  whenTrue: FlowBlock[];
  viewName?: string;

  constructor(
    phases: Record<string, PhaseDefinition>,
    views: Record<string, View>,
    block: ConditionBlock,
    viewName?: string
  ) {
    super();
    this.phases = phases;
    this.views = views;
    this.expression = block.expression;
    this.whenTrue = block.whenTrue;
    this.viewName = viewName;
  }

  async execute(currentState: GameState) {
    console.log(`Evaluating condition ${this.expression}.`);
    if (currentState.parseExpression(this.expression)) {
      console.log("Condition is true. Following conditional blocks.");
      return await new OncePhase(
        this.phases,
        this.views,
        `When ${this.expression}`,
        { blocks: this.whenTrue, view: this.viewName },
        true
      ).execute(currentState);
    }
    console.log("Condition is false. Skipping conditional blocks.");
    return currentState;
  }
}
