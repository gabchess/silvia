import { describe, expect, it } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";
import { prepareOrder } from "../../base44/lib/orchestrator";

describe("prepareOrder", () => {
  it("returns an immutable draft and a bound confirmation", async () => {
    const result = await prepareOrder({
      intent: {
        items: [
          {
            spokenName: "salmão grelhado com legumes",
            quantity: 1,
            modifiers: [],
          },
          {
            spokenName: "suco de laranja",
            quantity: 1,
            modifiers: [],
          },
        ],
        category: "food",
        deliveryOrPickup: "delivery",
        ambiguities: [],
        language: "pt-BR",
      },
      profile: {
        senderPhoneHash: "p",
        addressId: "a",
        addressLabel: "Casa",
      },
      connector: new DemoConnector(),
      confirmationPepper: "test-pepper",
    });

    expect(result.kind).toBe("draft");
    if (result.kind !== "draft") throw new Error("expected draft");
    expect(result.draftHash).toHaveLength(64);
    expect(result.confirmation.binding.draftHash).toBe(result.draftHash);
    expect(result.readBack).toMatch(/Confirmar pedido/);
    expect(result.readBack).toMatch(/demonstração segura/i);
    expect(Object.isFrozen(result.draft)).toBe(true);
  });

  it("asks for clarification before calling commerce", async () => {
    const result = await prepareOrder({
      intent: {
        items: [],
        category: "food",
        deliveryOrPickup: "delivery",
        ambiguities: ["Qual lanche você quer?"],
        language: "pt-BR",
      },
      profile: {
        senderPhoneHash: "p",
        addressId: "a",
        addressLabel: "Casa",
      },
      connector: new DemoConnector(),
      confirmationPepper: "test-pepper",
    });

    expect(result).toEqual({
      kind: "clarification",
      questions: ["Qual lanche você quer?"],
    });
  });
});
