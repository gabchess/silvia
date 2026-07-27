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
            spokenName: "hambúrguer",
            quantity: 2,
            modifiers: ["sem cebola"],
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
    expect(draft.totalCents).toBe(4470);
    expect((await connector.checkout(draft, "once")).status).toBe(
      "demo_ordered",
    );
  });
});
