import every from "lodash/every";
import max from "lodash/max";
import maxBy from "lodash/maxBy";
import min from "lodash/min";
import minBy from "lodash/minBy";
import some from "lodash/some";
import lodashUnion from "lodash/union";

const isnull = (x: any) => x == null;
const or = (...boolExps: boolean[]) => some(boolExps);
const and = (...boolExps: boolean[]) => every(boolExps);
const union = (lists: unknown[][]) => lodashUnion(...lists);
const count = (list: unknown[]) => list.length;
const filter = (list: unknown[], lambda: (x: unknown) => any) =>
  list.filter(lambda);
const map = (list: unknown[], lambda: (x: unknown) => unknown) =>
  list.map(lambda);

export const FUNCTIONS = {
  isnull,
  or,
  any: some,
  and,
  all: every,
  union,
  count,
  min,
  minby: minBy,
  max,
  maxby: maxBy,
  filter,
  map,
};
