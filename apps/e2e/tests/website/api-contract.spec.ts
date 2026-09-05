import { expect, test } from "@playwright/test";

// Contract checks on public read APIs — catches schema drift between the
// Supabase views/tables and what the frontend expects. Read-only.
test("GET /api/prochains-concerts returns the expected shape", async ({
  request,
}) => {
  const response = await request.get("/api/prochains-concerts");
  expect(response.ok()).toBe(true);
  const concerts = await response.json();
  expect(Array.isArray(concerts)).toBe(true);
  for (const concert of concerts) {
    expect(concert).toMatchObject({
      id: expect.any(String),
      date: expect.any(String),
      time: expect.any(String),
      place: expect.any(String),
      context: expect.any(String),
    });
  }
});
