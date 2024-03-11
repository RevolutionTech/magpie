import * as fs from "fs";
import cloneDeep from "lodash/cloneDeep";
import range from "lodash/range";

import { FlowBlock } from "./flow/types";
import { EndGameFlowSignal } from "./phase/types";
import { OncePhase } from "./phase/phase";
import { PhaseDefinition } from "./phase/types";
import { PlayerCountRange, requestNumPlayers } from "./players";
import { GameState } from "./types";
import { mapKeysDeep } from "./utils";
import { VariableContainer } from "./variables";

type GameDefinition = {
  numPlayers: PlayerCountRange;
  globalVariables: VariableContainer;
  playerVariables: VariableContainer;
  phases: Record<string, PhaseDefinition>;
  flow: FlowBlock[];
};

export class GameController {
  state: GameState;
  phases: Record<string, PhaseDefinition>;
  flow: FlowBlock[];

  async initialize(filename: string) {
    console.log(`Reading game definition from ${filename}.`);
    const fileContents = fs.readFileSync(filename, "utf-8");
    // https://trello.com/c/uY2A0RmG: Perform validation of game definition
    const definition: GameDefinition = JSON.parse(fileContents);

    console.log("Initializing game.");
    const numPlayers = await requestNumPlayers(definition.numPlayers);
    const variableContainer = mapKeysDeep(
      {
        ...cloneDeep(definition.globalVariables),
        Players: range(numPlayers).map((i) => ({
          ...cloneDeep(definition.playerVariables),
          id: i + 1,
          name: `Player ${i + 1}`,
        })),
      },
      (_, key) => key.toLowerCase()
    );
    this.state = new GameState(variableContainer);
    this.phases = definition.phases;
    this.flow = definition.flow;
  }

  async execute() {
    try {
      return await new OncePhase(this.phases, "Game", {
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
