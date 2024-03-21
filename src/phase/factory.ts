import { assertNever } from "../utils";
import { ConditionBlockClass } from "../flow/condition";
import { BaseEventBlockClass } from "../flow/event";
import { InputBlockClass } from "../flow/input";
import { PhaseBlockClass } from "../flow/phase";
import { BlockType, FlowBlock } from "../flow/types";
import { View } from "../views";
import { PhaseDefinition } from "./types";

export const blockClassFactory = (
  phases: Record<string, PhaseDefinition>,
  views: Record<string, View>,
  block: FlowBlock,
  viewName?: string
) => {
  /*
   * Factory function for constructing the appropriate block based on
   * the type from the provided definition.
   */
  switch (block.type) {
    case BlockType.EVENT:
      return BaseEventBlockClass.factory(block);
    case BlockType.CONDITION:
      return new ConditionBlockClass(phases, views, block, viewName);
    case BlockType.INPUT:
      return new InputBlockClass(block, viewName && views[viewName]);
    case BlockType.PHASE:
      return new PhaseBlockClass(phases, views, block);
    default:
      assertNever(block);
  }
};
