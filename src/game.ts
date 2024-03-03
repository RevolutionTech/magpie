import * as fs from "fs";
import cloneDeep from "lodash/cloneDeep";
import range from "lodash/range";

import {
  EndGameFlowSignal,
  BlockType,
  PhaseRepetition,
  FlowBlock,
} from "./flow/types";
import { OncePhaseBlockClass } from "./flow/phase";
import { GameState } from "./types";
import { mapKeysDeep } from "./utils";
import { VariableContainer } from "./variables";

type PlayingCard = {
  variables: VariableContainer;
};
type GameDefinition = {
  numPlayers: number;
  playingCardDeck: PlayingCard[];
  globalVariables: VariableContainer;
  playerVariables: VariableContainer;
  flow: FlowBlock[];
};

export class GameController {
  state: GameState;
  flow: FlowBlock[];

  constructor(filename: string) {
    console.log(`Reading game definition from ${filename}.`);
    const fileContents = fs.readFileSync(filename, "utf-8");
    // TODO: Perform validation of game definition
    const definition: GameDefinition = JSON.parse(fileContents);

    console.log("Initializing game.");
    const variableContainer = mapKeysDeep(
      {
        ...cloneDeep(definition.globalVariables),
        PlayingCardDeck: cloneDeep(definition.playingCardDeck),
        Players: range(definition.numPlayers).map((i) => ({
          ...cloneDeep(definition.playerVariables),
          id: i + 1,
          name: `Player ${i + 1}`,
        })),
      },
      (_, key) => key.toLowerCase()
    );
    this.state = new GameState(variableContainer);
    this.flow = definition.flow;
  }

  async execute() {
    try {
      return await new OncePhaseBlockClass({
        type: BlockType.PHASE,
        repetition: PhaseRepetition.ONCE,
        blocks: this.flow,
      }).execute(this.state);
    } catch (e) {
      if (e instanceof EndGameFlowSignal) {
        const winnersPretty =
          e.winners.length === 0 ? "The Game" : e.winners.join(", ");
        console.log(`End of game. Winners are: ${winnersPretty}`);
      } else {
        throw e;
      }
    }
  }
}
