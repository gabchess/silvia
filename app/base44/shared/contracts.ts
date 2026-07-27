export type ConnectorMode = "demo" | "live";

export type OrderStatus =
  | "received"
  | "transcribing"
  | "interpreting"
  | "clarifying"
  | "preparing"
  | "awaiting_confirmation"
  | "editing"
  | "expired"
  | "confirmed"
  | "checkout_in_progress"
  | "ordered"
  | "checkout_failed"
  | "needs_help"
  | "cancelled";

export type OrderItem = {
  id: string;
  spokenName: string;
  displayName: string;
  quantity: number;
  modifiers: string[];
  unitPriceCents: number;
};

export type OrderIntent = {
  items: Array<Pick<OrderItem, "spokenName" | "quantity" | "modifiers">>;
  merchantPreference?: string;
  category: "food" | "grocery";
  deliveryOrPickup: "delivery" | "pickup";
  notes?: string;
  ambiguities: string[];
  language: "pt-BR";
};

export type PricedDraft = {
  senderPhoneHash: string;
  merchant: { id: string; name: string };
  items: OrderItem[];
  subtotalCents: number;
  feeCents: number;
  discountCents: number;
  totalCents: number;
  addressId: string;
  addressLabel: string;
  paymentMode: "cash_on_delivery" | "handoff";
  connectorMode: ConnectorMode;
  expiresAt: string;
};

export type ConnectorReceipt = {
  connectorMode: ConnectorMode;
  externalId: string;
  status: "demo_ordered" | "ordered";
};
