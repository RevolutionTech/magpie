import { VariableContainer } from "./variables";
import { evaluate } from "./parser/parser";
import { ParserOptions } from "./parser/types";

export class GameState {
  variables: VariableContainer;

  constructor(variables: VariableContainer) {
    this.variables = variables;
  }

  parseExpression(expression: string, options: ParserOptions = {}) {
    return evaluate(expression, { variables: this.variables }, options);
  }
}
