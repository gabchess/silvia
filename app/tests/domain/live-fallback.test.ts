import { describe, expect, it, vi } from "vitest";
import { LiveConnector } from "../../base44/lib/live-connector";

const profile = {
  senderPhoneHash: "hash",
  addressId: "address",
  addressLabel: "Casa",
};

const intent = {
  items: [{ spokenName: "hambúrguer", quantity: 1, modifiers: [] }],
  category: "food" as const,
  deliveryOrPickup: "delivery" as const,
  ambiguities: [],
  language: "pt-BR" as const,
};

describe("live connector fallback", () => {
  it("fails closed when the gateway is not configured", async () => {
    const connector = new LiveConnector({
      gatewayUrl: "",
      sharedSecret: "",
    });

    await expect(connector.search(intent, profile)).rejects.toThrow(
      "live_connector_not_configured",
    );
  });

  it("keeps checkout disabled even when search is configured", async () => {
    const connector = new LiveConnector({
      gatewayUrl: "https://gateway.example",
      sharedSecret: "secret",
      fetchImpl: vi.fn(),
      checkoutEnabled: false,
    });

    await expect(
      connector.checkout({} as never, "order:draft"),
    ).rejects.toThrow("live_checkout_disabled");
  });
});
