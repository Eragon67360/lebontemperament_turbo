import assert from "node:assert/strict";
import { deployEnv, isProductionDeploy } from "./deployEnv";

// Vercel only: VERCEL_ENV decides.
assert.equal(deployEnv({ VERCEL_ENV: "production" }), "production");
assert.equal(deployEnv({ VERCEL_ENV: "preview" }), "preview");
assert.equal(isProductionDeploy({ VERCEL_ENV: "production" }), true);
assert.equal(isProductionDeploy({ VERCEL_ENV: "preview" }), false);

// Self-hosted: APP_ENV decides, and wins over a VERCEL_ENV left behind.
assert.equal(deployEnv({ APP_ENV: "production" }), "production");
assert.equal(isProductionDeploy({ APP_ENV: "production" }), true);
assert.equal(
  isProductionDeploy({ APP_ENV: "preview", VERCEL_ENV: "production" }),
  false,
  "a staging server is not production, whatever VERCEL_ENV says",
);
assert.equal(
  isProductionDeploy({ APP_ENV: "production", VERCEL_ENV: "preview" }),
  true,
);

// An empty APP_ENV counts as unset.
assert.equal(deployEnv({ APP_ENV: "", VERCEL_ENV: "preview" }), "preview");

// Local: neither set.
assert.equal(deployEnv({}), undefined);
assert.equal(deployEnv({ APP_ENV: "", VERCEL_ENV: "" }), undefined);
assert.equal(isProductionDeploy({}), false);

// Exact values only.
for (const value of ["Production", " production", "production ", "prod"]) {
  assert.equal(isProductionDeploy({ APP_ENV: value }), false, value);
  assert.equal(isProductionDeploy({ VERCEL_ENV: value }), false, value);
}

console.log("deployEnv: all assertions passed");
