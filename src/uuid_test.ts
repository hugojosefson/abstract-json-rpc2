import { assertStrictEquals } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/x/test_suite@v0.8.0/mod.ts";
import { uuid } from "./uuid.ts";

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
