import { describe, expect, it } from "vitest";
import { canonicalize, draftHash } from "../../base44/lib/canonical";

describe("canonical draft", () => {
  it("hashes equal values identically regardless of key insertion order", async () => {
    const a = {
      total: 4590,
      merchant: { id: "m1", name: "Lanche da Praça" },
    };
    const b = {
      merchant: { name: "Lanche da Praça", id: "m1" },
      total: 4590,
    };

    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(await draftHash(a)).toBe(await draftHash(b));
  });
});
