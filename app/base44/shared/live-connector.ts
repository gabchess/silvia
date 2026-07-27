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

type LiveConnectorOptions = {
  gatewayUrl: string;
  sharedSecret: string;
  checkoutEnabled?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export class LiveConnector implements CommerceConnector {
  readonly mode = "live" as const;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: LiveConnectorOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private endpoint(path: string): string {
    if (!this.options.gatewayUrl || !this.options.sharedSecret) {
      throw new Error("live_connector_not_configured");
    }
    const url = new URL(this.options.gatewayUrl);
    if (url.protocol !== "https:") {
      throw new Error("live_connector_requires_https");
    }
    return new URL(path, `${url.toString().replace(/\/$/, "")}/`).toString();
  }

  private async request(path: string, payload: unknown): Promise<unknown> {
    const response = await this.fetchImpl(this.endpoint(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Silvia-Gateway-Key": this.options.sharedSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
    });
    if (!response.ok) throw new Error(`live_gateway_${response.status}`);
    return response.json();
  }

  async search(
    intent: OrderIntent,
    profile: OrderProfile,
  ): Promise<Candidate[]> {
    const body = object(await this.request("api/search", {
      intent,
      addressId: profile.addressId,
    }));
    if (!Array.isArray(body?.candidates)) {
      throw new Error("live_gateway_invalid_candidates");
    }
    return body.candidates as Candidate[];
  }

  async buildDraft(
    candidate: Candidate,
    profile: OrderProfile,
  ): Promise<PricedDraft> {
    const body = object(
      await this.request("api/draft", { candidate, profile }),
    );
    const draft = object(body?.draft);
    if (
      draft?.connectorMode !== "live" ||
      typeof draft.totalCents !== "number" ||
      !Number.isInteger(draft.totalCents) ||
      draft.totalCents < 0 ||
      !Array.isArray(draft.items) ||
      typeof draft.expiresAt !== "string"
    ) {
      throw new Error("live_gateway_invalid_draft");
    }
    return draft as PricedDraft;
  }

  async checkout(
    draft: PricedDraft,
    idempotencyKey: string,
  ): Promise<ConnectorReceipt> {
    if (!this.options.checkoutEnabled) {
      throw new Error("live_checkout_disabled");
    }
    const body = object(
      await this.request("api/checkout", { draft, idempotencyKey }),
    );
    const receipt = object(body?.receipt);
    if (
      receipt?.connectorMode !== "live" ||
      receipt.status !== "ordered" ||
      typeof receipt.externalId !== "string"
    ) {
      throw new Error("live_gateway_invalid_receipt");
    }
    return receipt as ConnectorReceipt;
  }
}
