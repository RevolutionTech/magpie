import { shiftArray, mapKeysDeep } from "../src/utils";

const MAP_FUNC = (_: any, k: string) => k.toLowerCase();

describe("shiftArray", () => {
  it("shifts array to the left on positive values", () => {
    expect(shiftArray(["alpha", "bravo", "charlie"], 1)).toEqual([
      "bravo",
      "charlie",
      "alpha",
    ]);
  });

  it("shifts array to the right on negative values", () => {
    expect(shiftArray(["alpha", "bravo", "charlie"], -1)).toEqual([
      "charlie",
      "alpha",
      "bravo",
    ]);
  });

  it("does not shift on zero", () => {
    expect(shiftArray(["alpha", "bravo", "charlie"], 0)).toEqual([
      "alpha",
      "bravo",
      "charlie",
    ]);
  });

  it("supports magnitudes larger than array size", () => {
    expect(shiftArray(["alpha", "bravo", "charlie"], 4)).toEqual([
      "bravo",
      "charlie",
      "alpha",
    ]);
  });
});

describe("mapKeysDeep", () => {
  it("applies func to each key", () => {
    expect(mapKeysDeep({}, MAP_FUNC)).toEqual({});
    expect(mapKeysDeep({ foo: 1, Bar: 2, BAZ: 3 }, MAP_FUNC)).toEqual({
      foo: 1,
      bar: 2,
      baz: 3,
    });
  });

  it("works as a no-op for primitives", () => {
    expect(mapKeysDeep(undefined, MAP_FUNC)).toBe(undefined);
    expect(mapKeysDeep(null, MAP_FUNC)).toBe(null);
    expect(mapKeysDeep(1, MAP_FUNC)).toBe(1);
    expect(mapKeysDeep("FOO", MAP_FUNC)).toBe("FOO");
  });

  it("applies func to each object nested in object", () => {
    expect(mapKeysDeep({ FOO: { BAR: { BAZ: 1 } } }, MAP_FUNC)).toEqual({
      foo: { bar: { baz: 1 } },
    });
  });

  it("applies func to each object nested in array", () => {
    expect(mapKeysDeep([{ FOO: 1 }, { BAR: 2 }, { BAZ: 3 }], MAP_FUNC)).toEqual(
      [{ foo: 1 }, { bar: 2 }, { baz: 3 }]
    );
    expect(mapKeysDeep({ FOO: [{ BAR: 1 }, { BAZ: 2 }] }, MAP_FUNC)).toEqual({
      foo: [{ bar: 1 }, { baz: 2 }],
    });
  });
});
