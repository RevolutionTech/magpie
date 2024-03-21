import { GameState } from "./types";
import { prettyPrint } from "./utils";

export type ViewElement = {
  label: string;
  expression: string;
};

export class View {
  elements: ViewElement[];

  constructor(elements: ViewElement[]) {
    this.elements = elements;
  }

  render(gameState: GameState) {
    console.log("***** VIEW *****");
    this.elements.forEach((element) => {
      const expressionResult = gameState.parseExpression(element.expression);
      console.log(`${element.label}:\n${prettyPrint(expressionResult)}`);
    });
    console.log("***** VIEW *****");
  }
}
