type Variable =
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
