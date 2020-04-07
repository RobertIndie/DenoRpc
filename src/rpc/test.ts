import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { addOne } from "./testfn.ts";

Deno.test({
  name: "testing example",
  fn(): void {
    assertEquals(addOne(1), 2);
  },
});