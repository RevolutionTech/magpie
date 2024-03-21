import { OncePhase, ForeverPhase, EachPlayerPhase } from "../phase/phase";
import { PhaseDefinition } from "../phase/types";
import { GameState, PhaseRepetition } from "../types";
import { assertNever } from "../utils";
import { View } from "../views";
import { BaseBlockClass } from "./base";
import { BlockType, PhaseBlock } from "./types";

export class PhaseBlockClass extends BaseBlockClass {
  /*
   * The phase block class.
   */
  phases: Record<string, PhaseDefinition>;
  views: Record<string, View>;
  type: BlockType.PHASE;
  repetition: PhaseRepetition;
  phaseName: string;

  constructor(
    phases: Record<string, PhaseDefinition>,
    views: Record<string, View>,
    block: PhaseBlock
  ) {
    super();
    this.phases = phases;
    this.views = views;
    this.phaseName = block.phase;
    this.repetition =
      block.repetition ??
      phases[this.phaseName].repetition ??
      PhaseRepetition.ONCE;
  }

  phaseFactory(repetition: PhaseRepetition) {
    switch (repetition) {
      case PhaseRepetition.ONCE:
        return OncePhase;
      case PhaseRepetition.FOREVER:
        return ForeverPhase;
      case PhaseRepetition.FOR_EACH_PLAYER:
        return EachPlayerPhase;
      default:
        assertNever(repetition);
    }
  }

  execute(gameState: GameState) {
    /*
     * Delegates execution to the appropriate phase class based
     * on the repetition from the provided definition.
     */
    const phaseCls = this.phaseFactory(this.repetition);
    return new phaseCls(this.phases, this.views, this.phaseName).execute(
      gameState
    );
  }
}
