import type {
  Candidate,
  CommerceConnector,
  OrderProfile,
} from "./connectors.ts";
import type {
  ConnectorReceipt,
  OrderIntent,
  PricedDraft,
} from "./contracts.ts";

const catalog = [
  {
    match: "salmao",
    displayName: "Salmão grelhado com legumes",
    unitPriceCents: 4990,
  },
  {
    match: "suco de laranja",
    displayName: "Suco de laranja",
    unitPriceCents: 990,
  },
  { match: "sopa", displayName: "Sopa de legumes", unitPriceCents: 1590 },
];

function comparable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function catalogItem(spokenName: string) {
  const normalized = comparable(spokenName);
  return catalog.find(({ match }) => normalized.includes(match));
}

export class DemoConnector implements CommerceConnector {
  readonly mode = "demo" as const;

  async search(
    intent: OrderIntent,
    _profile: OrderProfile,
  ): Promise<Candidate[]> {
    if (
      intent.items.length === 0 ||
      intent.items.some((item) => !catalogItem(item.spokenName))
    ) {
      return [];
    }

    return [
      {
        merchant: { id: "demo-cozinha-praca", name: "Cozinha da Praça" },
        intent,
      },
    ];
  }

  async buildDraft(
    candidate: Candidate,
    profile: OrderProfile,
  ): Promise<PricedDraft> {
    const items = candidate.intent.items.map((item, index) => {
      const product = catalogItem(item.spokenName);
      if (!product) throw new Error("unknown_demo_item");

      return {
        id: `demo-item-${index + 1}`,
        spokenName: item.spokenName,
        displayName: product.displayName,
        quantity: item.quantity,
        modifiers: [...item.modifiers],
        unitPriceCents: product.unitPriceCents,
      };
    });
    const subtotalCents = items.reduce(
      (total, item) => total + item.quantity * item.unitPriceCents,
      0,
    );

    return {
      senderPhoneHash: profile.senderPhoneHash,
      merchant: candidate.merchant,
      items,
      subtotalCents,
      feeCents: 690,
      discountCents: 0,
      totalCents: subtotalCents + 690,
      addressId: profile.addressId,
      addressLabel: profile.addressLabel,
      paymentMode: "cash_on_delivery",
      connectorMode: "demo",
      expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    };
  }

  async checkout(
    _draft: PricedDraft,
    idempotencyKey: string,
  ): Promise<ConnectorReceipt> {
    if (!idempotencyKey) throw new Error("missing_idempotency_key");
    return {
      connectorMode: "demo",
      externalId: `demo-${idempotencyKey}`,
      status: "demo_ordered",
    };
  }
}
