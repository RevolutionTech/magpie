import every from "lodash/every";
import some from "lodash/some";

const or = (...boolExps: boolean[]) => some(boolExps);
const and = (...boolExps: boolean[]) => every(boolExps);
const count = (list: unknown[]) => list.length;

export const FUNCTIONS = {
  or,
  and,
  count,
};
