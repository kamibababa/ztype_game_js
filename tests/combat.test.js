import test from "node:test";
import assert from "node:assert/strict";

import { chooseLockByFirstChar, computeMultiplier } from "../src/systems/combat.js";

test("chooseLockByFirstChar picks the most dangerous matching enemy", () => {
  const state = {
    enemies: [
      { id: 1, word: "alpha", y: 90 },
      { id: 2, word: "arrow", y: 140 },
      { id: 3, word: "beta", y: 200 }
    ]
  };

  const target = chooseLockByFirstChar(state, "a");
  assert.equal(target.id, 2);
});

test("chooseLockByFirstChar returns null when no match", () => {
  const state = {
    enemies: [{ id: 1, word: "alpha", y: 90 }]
  };
  assert.equal(chooseLockByFirstChar(state, "z"), null);
});

test("computeMultiplier grows by combo and caps at x4", () => {
  assert.equal(computeMultiplier(0), 1);
  assert.equal(computeMultiplier(2), 1);
  assert.equal(computeMultiplier(3), 1.25);
  assert.equal(computeMultiplier(6), 1.5);
  assert.equal(computeMultiplier(12), 2);
  assert.equal(computeMultiplier(60), 4);
});
