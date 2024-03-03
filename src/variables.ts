import has from "lodash/has";
import isPlainObject from "lodash/isPlainObject";

import { ParserOptions } from "./parser/types";

type ComponentLocation = { component: VariableContainer };
type CollectionLocation = { collection: VariableContainer[] };
export type Location = ComponentLocation | CollectionLocation;
export type Variable =
  | null
  | boolean
  | number
  | string
  | VariableContainer
  | Location
  | Variable[];
export type VariableContainer = { [key: string]: Variable };

export const isComponentLocation = (x: any): x is ComponentLocation =>
  isPlainObject(x) && "component" in x;
export const isCollectionLocation = (x: any): x is CollectionLocation =>
  isPlainObject(x) && "collection" in x;

export const getVariable = (
  container: VariableContainer,
  name: string,
  options: ParserOptions = {}
) => {
  const storedName = name.toLowerCase();
  if (has(container, storedName)) {
    const variable = container[storedName];
    const resolveLocations = options.resolveLocations ?? true;
    if (resolveLocations && isComponentLocation(variable)) {
      return variable.component;
    } else if (resolveLocations && isCollectionLocation(variable)) {
      return variable.collection;
    } else {
      return variable;
    }
  } else {
    throw new Error(`Variable ${name} is not defined.`);
  }
};
