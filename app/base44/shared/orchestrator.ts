import { draftHash } from "./canonical.ts";
import { issueConfirmation } from "./confirmation.ts";
import type { CommerceConnector, OrderProfile } from "./connectors.ts";
import type { OrderIntent, PricedDraft } from "./contracts.ts";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

export async function prepareOrder(input: {
  intent: OrderIntent;
  profile: OrderProfile;
  connector: CommerceConnector;
  confirmationPepper: string;
}) {
  if (input.intent.ambiguities.length > 0) {
    return {
      kind: "clarification" as const,
      questions: input.intent.ambiguities.slice(0, 3),
    };
  }

  const candidates = await input.connector.search(input.intent, input.profile);
  if (candidates.length === 0) throw new Error("no_candidates");

  const mutableDraft = await input.connector.buildDraft(
    candidates[0],
    input.profile,
  );
  const draft = deepFreeze<PricedDraft>(mutableDraft);
  const hash = await draftHash(draft);
  const confirmation = await issueConfirmation({
    draftHash: hash,
    senderPhoneHash: draft.senderPhoneHash,
    totalCents: draft.totalCents,
    connectorMode: draft.connectorMode,
    expiresAt: draft.expiresAt,
    pepper: input.confirmationPepper,
  });
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const itemSummary = draft.items
    .map(
      (item) =>
        `${item.quantity}x ${item.displayName}${
          item.modifiers.length
            ? ` (${item.modifiers.join(", ")})`
            : ""
        }`,
    )
    .join("; ");
  const paymentSummary =
    draft.paymentMode === "cash_on_delivery"
      ? "pagamento na entrega"
      : "pagamento no app parceiro";
  const modeSummary =
    draft.connectorMode === "demo"
      ? "Esta é uma demonstração segura e nenhum pedido real será enviado. "
      : "";

  return {
    kind: "draft" as const,
    draft,
    draftHash: hash,
    confirmation,
    readBack:
      `Seu pedido na ${draft.merchant.name}: ${itemSummary}. ` +
      `Taxa ${money.format(draft.feeCents / 100)}. ` +
      `Total ${money.format(draft.totalCents / 100)}. ` +
      `Entrega em ${draft.addressLabel}, ${paymentSummary}. ` +
      modeSummary +
      "Confira e toque em Confirmar pedido ou Alterar.",
  };
}
