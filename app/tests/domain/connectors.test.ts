import { describe, expect, it } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";

describe("demo connector", () => {
  it("prices a known Portuguese order and labels the receipt demo", async () => {
    const connector = new DemoConnector();
    const profile = {
      senderPhoneHash: "p",
      addressId: "a",
      addressLabel: "Casa",
    };
    const candidates = await connector.search(
      {
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
      profile,
    );
    const draft = await connector.buildDraft(candidates[0], profile);

    expect(draft.connectorMode).toBe("demo");
    expect(draft.merchant.name).toBe("Cozinha da Praça");
    expect(draft.items.map(({ displayName }) => displayName)).toEqual([
      "Salmão grelhado com legumes",
      "Suco de laranja",
    ]);
    expect(draft.feeCents).toBe(690);
    expect(draft.totalCents).toBe(6670);
    expect(draft.paymentMode).toBe("cash_on_delivery");
    expect((await connector.checkout(draft, "once")).status).toBe(
      "demo_ordered",
    );
  });
});
