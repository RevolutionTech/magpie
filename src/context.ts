import has from "lodash/has";

export type Variable =
  | null
  | boolean
  | number
  | string
  | VariableContainer
  | Variable[];
type VariableContainer = { [key: string]: Variable };
export type Context = {
  variables: VariableContainer;
};

export const getVariable = (container: VariableContainer, name: string) => {
  const storedName = name.toLowerCase();
  if (has(container, storedName)) {
    return container[storedName];
  } else {
    throw new Error(`Variable ${name} is not defined.`);
  }
};
