import { FUNCTIONS } from "../src/functions";

const {
  isnull,
  not,
  or,
  and,
  union,
  count,
  filter,
  map,
  if: if_,
  ifs,
} = FUNCTIONS;

describe("ISNULL", () => {
  it("returns true for null values", () => {
    expect(isnull(null)).toBe(true);
  });

  it("returns false for non-null falsey values", () => {
    expect(isnull(false)).toBe(false);
    expect(isnull(0)).toBe(false);
  });

  it("returns false for truthy values", () => {
    expect(isnull(true)).toBe(false);
    expect(isnull(2)).toBe(false);
  });
});

describe("NOT", () => {
  it("returns the inverse boolean value", () => {
    expect(not(true)).toBe(false);
    expect(not(false)).toBe(true);
  });

  it("returns true for falsey values", () => {
    expect(not(null)).toBe(true);
    expect(not(0)).toBe(true);
    expect(not("")).toBe(true);
  });

  it("returns false for truthy values", () => {
    expect(not(1)).toBe(false);
    expect(not("foo")).toBe(false);
  });
});

describe("OR", () => {
  it("returns false when all values are false", () => {
    expect(or(false, false, false)).toBe(false);
  });

  it("returns true when any value is true", () => {
    expect(or(true, false, false)).toBe(true);
    expect(or(false, true, false)).toBe(true);
  });
});

describe("AND", () => {
  it("returns true when all values are true", () => {
    expect(and(true, true, true)).toBe(true);
  });

  it("returns false when any value is false", () => {
    expect(and(false, true, true)).toBe(false);
    expect(and(true, false, true)).toBe(false);
  });
});

describe("UNION", () => {
  it("returns a combined array", () => {
    expect(union([["foo", "bar"], ["baz"]])).toEqual(["foo", "bar", "baz"]);
    expect(union([[], [], []])).toEqual([]);
  });

  it("supports an empty array", () => {
    expect(union([])).toEqual([]);
  });
});

describe("COUNT", () => {
  it("returns the number of items in the array", () => {
    expect(count(["foo"])).toBe(1);
    expect(count(["foo", "bar", "baz"])).toBe(3);
  });

  it("supports empty arrays", () => {
    expect(count([])).toBe(0);
  });
});

describe("FILTER", () => {
  it("filters the array to each item in the array that returns true for the given function", () => {
    expect(filter([1, 2, 3], (x: number) => x % 2 == 1)).toEqual([1, 3]);
  });
});

describe("MAP", () => {
  it("transforms each item in the array by applying the given function", () => {
    expect(map([1, 2, 3], (x: number) => x * 2)).toEqual([2, 4, 6]);
  });
});

describe("IF", () => {
  it("returns the first value when condition is true", () => {
    expect(if_(true, "foo", "bar")).toBe("foo");
  });
  it("returns the second value when condition is false", () => {
    expect(if_(false, "foo", "bar")).toBe("bar");
  });
});

describe("IFS", () => {
  it("supports 5+ arguments", () => {
    expect(ifs(true, "foo", true, "bar", "baz")).toBe("foo");
    expect(ifs(false, "foo", true, "bar", "baz")).toBe("bar");
    expect(ifs(false, "foo", false, "bar", "baz")).toBe("baz");
  });
});
