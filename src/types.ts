import { startsWith } from "lodash";
import { parse } from "./parser";
import { VariableContainer } from "./variables";

export type ParserOptions = {
  resolveLocations?: boolean;
};

export class GameState {
  variables: VariableContainer;

  constructor(variables: VariableContainer) {
    this.variables = variables;
  }

  parseExpression(expression: string, options: ParserOptions = {}) {
    if (startsWith(expression, "=")) {
      return parse(expression.slice(1), { variables: this.variables }, options);
    }
    return expression;
  }
}
