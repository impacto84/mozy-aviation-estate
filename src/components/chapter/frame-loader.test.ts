// @vitest-environment node
import { describe, expect, it } from "vitest";
import { prioritizeQueue } from "./frame-loader";

describe("prioritizeQueue", () => {
  it("leva para a frente os quadros perto do foco, mais perto primeiro", () => {
    const queue = [0, 8, 16, 1, 2, 3, 15, 17, 30];
    expect(prioritizeQueue(queue, 16, 2)).toEqual([16, 15, 17, 0, 8, 1, 2, 3, 30]);
  });

  it("não perde nem duplica itens", () => {
    const queue = [5, 1, 9, 3];
    const result = prioritizeQueue(queue, 100, 4);
    expect(result).toEqual(queue);
  });
});
