import assert from "node:assert/strict";
import { parseBearerToken } from "./bearer";

const token = "header.payload.signature";

assert.equal(parseBearerToken(`Bearer ${token}`), token);
assert.equal(parseBearerToken(`bearer ${token}`), token);
assert.equal(parseBearerToken(`BEARER   ${token}  `), token);
assert.equal(parseBearerToken(null), null);
assert.equal(parseBearerToken(undefined), null);
assert.equal(parseBearerToken(""), null);
assert.equal(parseBearerToken("Bearer"), null);
assert.equal(parseBearerToken("Bearer "), null);
assert.equal(parseBearerToken(`Basic ${token}`), null);
assert.equal(parseBearerToken(token), null);
assert.equal(parseBearerToken(`Bearer ${token} extra`), null);
assert.equal(parseBearerToken(`Bearer\n${token}`), null);

console.log("parseBearerToken: all assertions passed");
