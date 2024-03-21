import concat from "lodash/concat";
import forOwn from "lodash/forOwn";
import isPlainObject from "lodash/isPlainObject";

class IllegalStateException extends Error {}

// Source: https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
export const assertNever = (x: never): never => {
  throw new IllegalStateException(
    `Unexpectedly encountered illegal state: ${JSON.stringify(x)}`
  );
};

export function shiftArray<T>(arr: T[], num: number): T[] {
  const numToShift = num % arr.length;
  return concat(arr.slice(numToShift, arr.length), arr.slice(0, numToShift));
}

export const mapKeysDeep = (
  obj: any,
  fn: (value: any, key: string) => string
): { [key: string]: any } => {
  if (isPlainObject(obj)) {
    var newObject = {};
    forOwn(obj, (value, key) => {
      value = mapKeysDeep(value, fn);
      newObject[fn(value, key)] = value;
    });
    return newObject;
  } else if (Array.isArray(obj)) {
    return obj.map((x) => mapKeysDeep(x, fn));
  } else {
    return obj;
  }
};
export const prettyPrint = (obj: any) => JSON.stringify(obj, null, 2);
