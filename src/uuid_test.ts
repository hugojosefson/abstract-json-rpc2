import { assertStrictEquals } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import { uuid } from "./uuid.ts";
import { describe, it } from "./_test.ts";

describe("uuid", () => {
  it("is a string", () => {
    const actual: string = uuid();
    assertStrictEquals(
      typeof actual,
      "string",
      "uuid() should return a string",
    );
  });
  it("is 36 chars long", () => {
    const actual: string = uuid();
    assertStrictEquals(
      actual.length,
      36,
      "uuid() should return a 36 character long string",
    );
  });
});
