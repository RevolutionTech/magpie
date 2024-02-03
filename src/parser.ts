import * as fs from "fs";
import * as ohm from "ohm-js";
import * as path from "path";

const MXL_FILENAME = path.resolve(__dirname, "mxl.ohm");
const MXL_CONTENTS = fs.readFileSync(MXL_FILENAME, "utf-8");
const MXL = ohm.grammar(MXL_CONTENTS);
const MXL_SEMANTICS = MXL.createSemantics();
MXL_SEMANTICS.addOperation("eval", {
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

export const parse = (s: string) => {
  const matchResult = MXL.match(s);
  if (!matchResult.succeeded()) {
    throw new Error("Invalid expression.");
  }

  const semanticAdapter = MXL_SEMANTICS(matchResult);
  return semanticAdapter.eval();
};
