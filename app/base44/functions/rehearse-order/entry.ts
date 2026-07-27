import { createClientFromRequest } from "npm:@base44/sdk";
import { sha256Hex } from "../../shared/canonical.ts";
import { DemoConnector } from "../../shared/demo-connector.ts";
import { prepareOrder } from "../../shared/orchestrator.ts";
import type { OrderIntent } from "../../shared/contracts.ts";

const rehearsalPhrase =
  "silvia, quero dois hambúrgueres sem cebola e uma coca sem açúcar";

const rehearsalIntent: OrderIntent = {
  items: [
    {
      spokenName: "hambúrguer",
      quantity: 2,
      modifiers: ["sem cebola"],
    },
    {
      spokenName: "Coca sem açúcar",
      quantity: 1,
      modifiers: [],
    },
  ],
  category: "food",
  deliveryOrPickup: "delivery",
  ambiguities: [],
  language: "pt-BR",
};

function normalizePhrase(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export async function handleRehearsal(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const caregiver = await base44.auth.me();
  if (!caregiver) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const pepper = Deno.env.get("CONFIRMATION_PEPPER");
  if (!pepper) {
    return Response.json(
      { error: "confirmation_not_configured" },
      { status: 503 },
    );
  }

  let transcript = "";
  try {
    const body = await req.json();
    transcript = typeof body.transcript === "string" ? body.transcript : "";
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (normalizePhrase(transcript) !== rehearsalPhrase) {
    return Response.json(
      { error: "unsupported_rehearsal_phrase" },
      { status: 422 },
    );
  }

  const entities = base44.asServiceRole.entities;
  const profiles = await entities.SeniorProfile.filter(
    { caregiver_user_id: caregiver.id },
    "-created_date",
    1,
  );
  const profile =
    profiles[0] ??
    (await entities.SeniorProfile.create({
      display_name: "Dona Maria",
      phone_hash: await sha256Hex(`silvia-demo:${caregiver.id}`),
      locale: "pt-BR",
      saved_address_id: "demo-casa",
      saved_address_label: "Casa da Dona Maria",
      caregiver_user_id: caregiver.id,
      spend_cap_brl: 80,
      sender_allowlisted: true,
    }));

  const prepared = await prepareOrder({
    intent: rehearsalIntent,
    profile: {
      senderPhoneHash: profile.phone_hash,
      addressId: profile.saved_address_id,
      addressLabel: profile.saved_address_label,
    },
    connector: new DemoConnector(),
    confirmationPepper: pepper,
  });
  if (prepared.kind !== "draft") {
    return Response.json({ error: "rehearsal_needs_clarification" }, {
      status: 422,
    });
  }

  const order = await entities.OrderDraft.create({
    meta_message_id: `rehearsal:${crypto.randomUUID()}`,
    profile_id: profile.id,
    caregiver_user_id: caregiver.id,
    transcript_redacted: transcript,
    normalized_items: prepared.draft.items,
    merchant: prepared.draft.merchant,
    pricing: {
      subtotal_cents: prepared.draft.subtotalCents,
      fee_cents: prepared.draft.feeCents,
      discount_cents: prepared.draft.discountCents,
      total_cents: prepared.draft.totalCents,
    },
    address_label: prepared.draft.addressLabel,
    payment_mode: prepared.draft.paymentMode,
    connector_mode: prepared.draft.connectorMode,
    draft_hash: prepared.draftHash,
    status: "awaiting_confirmation",
    expires_at: prepared.draft.expiresAt,
  });

  await entities.Confirmation.create({
    order_draft_id: order.id,
    caregiver_user_id: caregiver.id,
    token_hash: prepared.confirmation.tokenHash,
    bound_draft_hash: prepared.confirmation.binding.draftHash,
    sender_phone_hash: prepared.confirmation.binding.senderPhoneHash,
    total_cents: prepared.confirmation.binding.totalCents,
    connector_mode: prepared.confirmation.binding.connectorMode,
    expires_at: prepared.confirmation.binding.expiresAt,
  });

  const occurredAt = new Date().toISOString();
  await entities.AuditEvent.bulkCreate([
    {
      order_draft_id: order.id,
      caregiver_user_id: caregiver.id,
      event_type: "rehearsal_received",
      actor_type: "caregiver",
      connector_mode: "demo",
      redacted_metadata: { source: "authenticated_dashboard" },
      occurred_at: occurredAt,
    },
    {
      order_draft_id: order.id,
      caregiver_user_id: caregiver.id,
      event_type: "awaiting_confirmation",
      actor_type: "system",
      connector_mode: "demo",
      redacted_metadata: { draft_hash_prefix: prepared.draftHash.slice(0, 10) },
      occurred_at: occurredAt,
    },
  ]);

  return Response.json({
    orderId: order.id,
    draftHash: prepared.draftHash,
    readBack: prepared.readBack,
    confirmationToken: prepared.confirmation.token,
    senderPhoneHash: prepared.draft.senderPhoneHash,
    connectorMode: prepared.draft.connectorMode,
  });
}

Deno.serve(handleRehearsal);
