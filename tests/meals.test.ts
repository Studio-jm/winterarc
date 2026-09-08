import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateMeal } from "../lib/meals/estimate.ts";

describe("meal estimator", () => {
  it("returns high-end kcal and estimate=high", () => {
    const pizza = estimateMeal("pizza");
    assert.equal(pizza.estimate, "high");
    assert.ok(pizza.kcal >= 1200);
    assert.ok(pizza.matched.includes("pizza"));
  });

  it("fuzzy matches accented pasta + additive bolo", () => {
    const meal = estimateMeal("pates bolo");
    assert.equal(meal.estimate, "high");
    assert.ok(meal.kcal >= 950);
    assert.ok(meal.matched.includes("pates") || meal.matched.includes("bolo"));
  });

  it("portion grande scales up, petite down", () => {
    const base = estimateMeal("pizza");
    const big = estimateMeal("pizza", "grande");
    const small = estimateMeal("pizza", "petite");
    assert.ok(big.kcal > base.kcal);
    assert.ok(small.kcal < base.kcal);
    assert.equal(big.estimate, "high");
  });

  it("unknown food uses a high default", () => {
    const u = estimateMeal("plat mystère du chef");
    assert.equal(u.estimate, "high");
    assert.equal(u.kcal, 750);
  });
});
