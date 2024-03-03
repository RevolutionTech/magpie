import { assertNever } from "../utils";
import { ConditionBlockClass } from "./condition";
import { BaseEventBlockClass } from "./event";
import { InputBlockClass } from "./input";
import { BasePhaseBlockClass } from "./phase";
import { BlockType, FlowBlock } from "./types";

export const blockClassFactory = (block: FlowBlock) => {
  /*
   * Factory function for constructing the appropriate block based on
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
};
