import * as fs from "fs";
import * as ohm from "ohm-js";
import * as path from "path";

import { Context, getVariable } from "./context";

const MXL_FILENAME = path.resolve(__dirname, "mxl.ohm");
const MXL_CONTENTS = fs.readFileSync(MXL_FILENAME, "utf-8");
const MXL = ohm.grammar(MXL_CONTENTS);

export const parse = (s: string, context: Context = { variables: {} }) => {
  const matchResult = MXL.match(s);
  if (!matchResult.succeeded()) {
    throw new Error("Invalid expression.");
  }

  const mxl_semantics = MXL.createSemantics();
  mxl_semantics.addOperation("eval", {
    IndexExp: (listNode, _1, indexNode, _2) => {
      const list = listNode.eval();
      const index = indexNode.eval();
      const listType = typeof list;
      const indexType = typeof index;
      if (Array.isArray(listType)) {
        throw new Error(`${listType} type cannot be indexed.`);
      } else if (!["boolean", "number", "bigint"].includes(indexType)) {
        throw new Error(`${indexType} type cannot be used as index.`);
      } else if (index < 1 || index > list.length) {
        throw new Error(
          `index ${index} is out of bounds for list of size ${list.length}.`
        );
      } else {
        return list[index - 1];
      }
    },
    List: (_1, possibleFirstNode, _2, possibleRemainingNode, _3) => {
      if (possibleFirstNode.children.length) {
        const first = possibleFirstNode.children[0].eval();
        const remainingNode = possibleRemainingNode.children[0];
        if (remainingNode.children.length) {
          return [
            first,
            ...remainingNode.children.map((itemNode) => itemNode.eval()),
          ];
        }
        return [first];
      }
      return [];
    },
    AddExp_add: (a, _, b) => a.eval() + b.eval(),
    AddExp_subtract: (a, _, b) => a.eval() - b.eval(),
    MulExp_negate: (_, a) => -1 * a.eval(),
    MulExp_multiply: (a, _, b) => a.eval() * b.eval(),
    MulExp_divide: (a, _, b) => a.eval() / b.eval(),
    MulExp_modulo: (a, _, b) => a.eval() % b.eval(),
    ExpExp_power: (a, _, b) => a.eval() ** b.eval(),
    PriExp_paren: (_1, a, _2) => a.eval(),
    BoolExp_lt: (a, _, b) => a.eval() < b.eval(),
    BoolExp_lte: (a, _, b) => a.eval() <= b.eval(),
    BoolExp_eq: (a, _, b) => a.eval() === b.eval(),
    BoolExp_ne: (a, _, b) => a.eval() !== b.eval(),
    BoolExp_gte: (a, _, b) => a.eval() >= b.eval(),
    BoolExp_gt: (a, _, b) => a.eval() > b.eval(),
    variable_property: (containerNode, _, propertyNode) =>
      getVariable(containerNode.eval(), propertyNode.sourceString),
    variable_variable: (varIdentifierNode) =>
      getVariable(context.variables, varIdentifierNode.sourceString),
    string: (_1, stringNode, _2) => stringNode.sourceString,
    number_float: (wholeNode, _, decimalNode) =>
      parseFloat(`${wholeNode.sourceString}.${decimalNode.sourceString}`),
    number_int: (digitsNode) => parseInt(digitsNode.sourceString),
    false: (_) => false,
    true: (_) => true,
    null: (_) => null,
  });

  const semanticAdapter = mxl_semantics(matchResult);
  return semanticAdapter.eval();
};
