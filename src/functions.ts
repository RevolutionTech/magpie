import every from "lodash/every";
import some from "lodash/some";

const or = (...boolExps: boolean[]) => some(boolExps);
const and = (...boolExps: boolean[]) => every(boolExps);
const count = (list: unknown[]) => list.length;
const filter = (list: unknown[], lambda: (x: unknown) => any) =>
  list.filter(lambda);
const map = (list: unknown[], lambda: (x: unknown) => unknown) =>
  list.map(lambda);

export const FUNCTIONS = {
  or,
  and,
  count,
  filter,
  map,
};
