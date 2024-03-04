import every from "lodash/every";
import find from "lodash/find";
import max from "lodash/max";
import maxBy from "lodash/maxBy";
import min from "lodash/min";
import minBy from "lodash/minBy";
import some from "lodash/some";
import sum from "lodash/sum";
import lodashUnion from "lodash/union";

const isnull = (x: any) => x == null;
const not = (boolExp: any) => !boolExp;
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
  not,
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
  sum,
  find,
  filter,
  map,
};
