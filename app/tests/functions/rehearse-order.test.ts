import { describe, expect, it } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";
import { prepareOrder } from "../../base44/lib/orchestrator";

describe("salmon rehearsal fixture", () => {
  it("builds the exact consent-bound demo order used by the film", async () => {
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
        senderPhoneHash: "maria",
        addressId: "demo-casa",
        addressLabel: "Casa da Dona Maria",
      },
      connector: new DemoConnector(),
      confirmationPepper: "film-proof-pepper",
    });

    expect(result.kind).toBe("draft");
    if (result.kind !== "draft") throw new Error("expected draft");

    expect(result.draft).toMatchObject({
      merchant: { name: "Cozinha da Praça" },
      feeCents: 690,
      totalCents: 6670,
      paymentMode: "cash_on_delivery",
      connectorMode: "demo",
    });
    expect(result.draft.items).toEqual([
      expect.objectContaining({
        displayName: "Salmão grelhado com legumes",
        quantity: 1,
        unitPriceCents: 4990,
      }),
      expect.objectContaining({
        displayName: "Suco de laranja",
        quantity: 1,
        unitPriceCents: 990,
      }),
    ]);
    expect(result.confirmation.binding.totalCents).toBe(6670);
    expect(result.confirmation.binding.draftHash).toBe(result.draftHash);
    expect(result.readBack).toMatch(/R\$\s*66,70/);
    expect(result.readBack).toMatch(/Confirmar pedido/);
  });
});
