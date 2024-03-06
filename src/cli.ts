import * as path from "path";

import { GameController } from "./game";

const DEFINITION_FILENAME = path.resolve(
  __dirname,
  "definitions",
  "the-crew.json"
);

const run = async () => {
  const game = new GameController();
  await game.initialize(DEFINITION_FILENAME);
  await game.execute();
};
run();
