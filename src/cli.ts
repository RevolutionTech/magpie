import * as path from "path";

import { GameController } from "./game";

const DEFINITION_FILENAME = path.resolve(
  __dirname,
  "definitions",
  "the-crew.json"
);
const GAME = new GameController(DEFINITION_FILENAME);
GAME.execute();
