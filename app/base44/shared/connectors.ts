import type {
  ConnectorReceipt,
  OrderIntent,
  PricedDraft,
} from "./contracts.ts";

export type OrderProfile = {
  senderPhoneHash: string;
  addressId: string;
  addressLabel: string;
};

export type Candidate = {
  merchant: { id: string; name: string };
  intent: OrderIntent;
};

export interface CommerceConnector {
  readonly mode: "demo" | "live";
  search(intent: OrderIntent, profile: OrderProfile): Promise<Candidate[]>;
  buildDraft(
    candidate: Candidate,
    profile: OrderProfile,
  ): Promise<PricedDraft>;
  checkout(
    draft: PricedDraft,
    idempotencyKey: string,
  ): Promise<ConnectorReceipt>;
}
