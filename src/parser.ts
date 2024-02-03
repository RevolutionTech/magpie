import * as fs from "fs";
import * as ohm from "ohm-js";
import * as path from "path";
import has from "lodash/has";

import { Context } from "./context";

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
    Variable: (varIdentifier) => {
      const userVarName = varIdentifier.sourceString;
      const varName = userVarName.toLowerCase();
      if (has(context.variables, varName)) {
        return context.variables[varName];
      } else {
        throw new Error(`Variable ${userVarName} is not defined.`);
      }
    },
    List: (_1, possibleFirst, _2, possibleRemaining, _3) => {
      if (possibleFirst.children.length) {
        const first = possibleFirst.children[0].eval();
        const remaining = possibleRemaining.children[0];
        if (remaining.children.length) {
          return [first, ...remaining.children.map((item) => item.eval())];
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
    string: (_1, s, _2) => s.sourceString,
    number_float: (whole, _, decimal) =>
      parseFloat(`${whole.sourceString}.${decimal.sourceString}`),
    number_int: (digits) => parseInt(digits.sourceString),
    false: (_) => false,
    true: (_) => true,
    null: (_) => null,
  });

  const semanticAdapter = mxl_semantics(matchResult);
  return semanticAdapter.eval();
};
