import * as fs from "fs";
import * as ohm from "ohm-js";
import * as path from "path";
import has from "lodash/has";
import startsWith from "lodash/startsWith";

import { FUNCTIONS } from "../functions";
import { ParserOptions } from "./types";
import { Variable, VariableContainer, getVariable } from "../variables";

type Context = {
  variables: VariableContainer;
};

const MXL_FILENAME = path.resolve(__dirname, "mxl.ohm");
const MXL_CONTENTS = fs.readFileSync(MXL_FILENAME, "utf-8");
const MXL = ohm.grammar(MXL_CONTENTS);

const parseOptionalList = (optionalListNode: ohm.Node) => {
  if (optionalListNode.children.length) {
    return optionalListNode.children[0].eval();
  } else {
    return [];
  }
};

export const parse = (
  s: string,
  context: Context = { variables: {} },
  options: ParserOptions = {}
) => {
  /*
   * The parser and transformer for MXL (Magpie Expression Language).
   * This function is responsible for matching and resolving MXL.
   * The parser takes context (usually part of the game state) for resolving variables.
   */
  const matchResult = MXL.match(s);
  if (!matchResult.succeeded()) {
    throw new Error("Invalid expression.");
  }

  const mxl_semantics = MXL.createSemantics();
  mxl_semantics.addOperation("eval", {
    SingleVarLambdaExp:
      (lambdaVarIdentifierNode, _, functionExpNode) => (lambdaVar: Variable) =>
        parse(functionExpNode.sourceString.toLowerCase(), {
          ...context,
          variables: {
            ...context.variables,
            [lambdaVarIdentifierNode.sourceString.toLowerCase()]: lambdaVar,
          },
        }),
    FuncExp: (funcIdentifierNode, _1, optionalArgumentsNode, _2) => {
      const userProvidedFuncName = funcIdentifierNode.sourceString;
      const funcName = userProvidedFuncName.toLowerCase();
      const args = parseOptionalList(optionalArgumentsNode);
      if (funcName === "eval") {
        // HACK: provide context and options to support eval() function
        return evaluate(
          args[0],
          { ...context, variables: { ...context.variables, this: args[1] } },
          options
        );
      } else if (has(FUNCTIONS, funcName)) {
        const func = FUNCTIONS[funcName];
        // https://trello.com/c/saU4aox8: Perform argument validation (correct number of arguments, correct types, etc.)
        return func(...args);
      } else {
        throw new Error(`${userProvidedFuncName} is not a supported function.`);
      }
    },
    BoolExp_lt: (a, _, b) => a.eval() < b.eval(),
    BoolExp_lte: (a, _, b) => a.eval() <= b.eval(),
    BoolExp_eq: (a, _, b) => a.eval() === b.eval(),
    BoolExp_ne: (a, _, b) => a.eval() !== b.eval(),
    BoolExp_gte: (a, _, b) => a.eval() >= b.eval(),
    BoolExp_gt: (a, _, b) => a.eval() > b.eval(),
    AddExp_add: (a, _, b) => a.eval() + b.eval(),
    AddExp_subtract: (a, _, b) => a.eval() - b.eval(),
    MulExp_negate: (_, a) => -1 * a.eval(),
    MulExp_multiply: (a, _, b) => a.eval() * b.eval(),
    MulExp_divide: (a, _, b) => a.eval() / b.eval(),
    MulExp_modulo: (a, _, b) => a.eval() % b.eval(),
    ExpExp_power: (a, _, b) => a.eval() ** b.eval(),
    MemberExp_at: (listNode, _1, indexNode, _2) => {
      const list = listNode.eval();
      const index = indexNode.eval();
      const indexType = typeof index;
      if (!Array.isArray(list)) {
        throw new Error(`${typeof list} type cannot be indexed.`);
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
    MemberExp_property: (containerNode, _, propertyNode) =>
      getVariable(containerNode.eval(), propertyNode.sourceString, options),
    MemberExp_variable: (varIdentifierNode) =>
      getVariable(context.variables, varIdentifierNode.sourceString, options),
    PrimaryExp_paren: (_1, a, _2) => a.eval(),
    ListLiteral: (_1, optionalListNode, _2) =>
      parseOptionalList(optionalListNode),
    NonemptyListOf: (firstNode, _, remainingNode) => {
      const first = firstNode.eval();
      if (remainingNode.children.length) {
        return [
          first,
          ...remainingNode.children.map((itemNode) => itemNode.eval()),
        ];
      }
      return [first];
    },
    EmptyListOf: () => [],
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

export const evaluate = (
  expression: string,
  context: Context = { variables: {} },
  options: ParserOptions = {}
) => {
  if (startsWith(expression, "=")) {
    return parse(expression.slice(1), context, options);
  }
  return expression;
};
