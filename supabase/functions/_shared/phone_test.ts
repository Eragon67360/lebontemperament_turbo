// Run: npx -y deno test --node-modules-dir=none supabase/functions/_shared/phone_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizePhone, smsPhone } from "./phone.ts";

Deno.test("French numbers in every usual form", () => {
  for (const typed of [
    "0677565184",
    "06 77 56 51 84",
    "06.77.56.51.84",
    "06-77-56-51-84",
    "+33 6 77 56 51 84",
    "+33677565184",
    "0033 6 77 56 51 84",
    " 06 77 56 51 84 ",
  ]) {
    assertEquals(smsPhone(typed), "+33677565184", typed);
  }
});

Deno.test("other countries and bad input", () => {
  assertEquals(smsPhone("0041 79 123 45 67"), "+41791234567");
  assertEquals(smsPhone("+41 79 123 45 67"), "+41791234567");
  assertEquals(smsPhone(""), null);
  assertEquals(smsPhone(null), null);
  assertEquals(smsPhone("06 77 56"), null);
  assertEquals(smsPhone("pas de numéro"), null);
  assertEquals(normalizePhone("   "), null);
});
