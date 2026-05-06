import test from "node:test";
import assert from "node:assert/strict";

import { getTierWeightsByLevel, pickTierByWeight } from "../src/words.js";

test("getTierWeightsByLevel returns expected early weights", () => {
  assert.deepEqual(getTierWeightsByLevel(1), { easy: 0.82, medium: 0.17, hard: 0.01 });
  assert.deepEqual(getTierWeightsByLevel(4), { easy: 0.6, medium: 0.33, hard: 0.07 });
});

test("getTierWeightsByLevel returns expected late weights", () => {
  assert.deepEqual(getTierWeightsByLevel(8), { easy: 0.28, medium: 0.47, hard: 0.25 });
  assert.deepEqual(getTierWeightsByLevel(20), { easy: 0.16, medium: 0.46, hard: 0.38 });
});

test("pickTierByWeight only returns valid tier names", () => {
  const weight = { easy: 0.4, medium: 0.4, hard: 0.2 };
  for (let i = 0; i < 200; i += 1) {
    const picked = pickTierByWeight(weight);
    assert.ok(picked === "easy" || picked === "medium" || picked === "hard");
  }
});
