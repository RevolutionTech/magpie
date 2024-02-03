import { parse } from "../src/parser";

describe("parse", () => {
  it("supports null literals", () => {
    expect(parse("null")).toBe(null);
    expect(parse("NULL")).toBe(null);
    expect(parse("none")).toBe(null);
    expect(parse("None")).toBe(null);
    expect(parse("nan")).toBe(null);
    expect(parse("NAN")).toBe(null);
    expect(parse("na")).toBe(null);
    expect(parse("NA")).toBe(null);
  });

  it("supports boolean literals", () => {
    expect(parse("false")).toBe(false);
    expect(parse("False")).toBe(false);
    expect(parse("true")).toBe(true);
    expect(parse("True")).toBe(true);
    expect(parse("no")).toBe(false);
    expect(parse("No")).toBe(false);
    expect(parse("yes")).toBe(true);
    expect(parse("Yes")).toBe(true);
  });

  it("supports int literals", () => {
    expect(parse("4")).toBe(4);
  });

  it("supports float literals", () => {
    expect(parse("3.14")).toBe(3.14);
  });

  it("supports string literals", () => {
    expect(parse('"Hello world!"')).toBe("Hello world!");
    expect(parse("'Hello world!'")).toBe("Hello world!");
    expect(parse('"!@#$%^&*()"')).toBe("!@#$%^&*()");
    expect(parse('"\'"')).toBe("'");
  });

  it("supports addition", () => {
    expect(parse("1 + 2")).toBe(3);
  });

  it("supports subtraction", () => {
    expect(parse("2 - 1")).toBe(1);
  });

  it("supports negation", () => {
    expect(parse("-2")).toBe(-2);
  });

  it("supports multiplication", () => {
    expect(parse("2 * 3")).toBe(6);
  });

  it("supports division", () => {
    expect(parse("8 / 2")).toBe(4);
  });

  it("supports modulo division", () => {
    expect(parse("5 % 2")).toBe(1);
  });

  it("supports exponentiation", () => {
    expect(parse("2 ^ 3")).toBe(8);
    expect(parse("2 ** 3")).toBe(8);
  });

  it("supports operators with negation", () => {
    expect(parse("1 + -2 + 3")).toBe(2);
  });

  it("supports multiple operators", () => {
    expect(parse("1 + 2 + 3")).toBe(6);
    expect(parse("2 * 3 * 4")).toBe(24);
  });

  it("performs order of operations", () => {
    expect(parse("1 + 2 * 3 + 4")).toBe(11);
    expect(parse("(1 + 2) * (3 + 4)")).toBe(21);
  });

  it("supports boolean expressions", () => {
    expect(parse("2 == 2")).toBe(true);
    expect(parse("2 = 3")).toBe(false);
    expect(parse("2 != 3")).toBe(true);
    expect(parse("2 <> 3")).toBe(true);
    expect(parse("2 < 3")).toBe(true);
    expect(parse("2 <= 3")).toBe(true);
    expect(parse("2 > 3")).toBe(false);
    expect(parse("3 >= 2")).toBe(true);
  });

  it("supports nested expressions", () => {
    expect(parse("1 + 2 < 9 - 4")).toBe(true);
    expect(parse("7 % 2 == 4 != 5")).toBe(false);
  });

  it("supports lists", () => {
    expect(parse("[1, 2, 3, 4, 5]")).toEqual([1, 2, 3, 4, 5]);
    expect(parse('["Hello"]')).toEqual(["Hello"]);
    expect(parse("[]")).toEqual([]);
    expect(parse("[[1, 2, 3], [4, 5, 6]]")).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("throws on unsupported text", () => {
    expect(() => parse("hello")).toThrow();
  });
});
