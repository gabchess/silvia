import { createClientFromRequest } from "npm:@base44/sdk";
import { sha256Hex } from "../../shared/canonical.ts";
import type { OrderIntent } from "../../shared/contracts.ts";
import { DemoConnector } from "../../shared/demo-connector.ts";
import { orderIntentSchema } from "../../shared/intent-schema.ts";
import { prepareOrder } from "../../shared/orchestrator.ts";
import { transcribePtBr } from "../../shared/transcription.ts";
import {
  downloadMetaMedia,
  extractVoiceMessage,
  sendInteractiveReadBack,
  sendTextMessage,
  verifyMetaSignature,
} from "../../shared/whatsapp.ts";

type Environment = {
  verifyToken: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  elevenLabsApiKey: string;
  confirmationPepper: string;
};

function environment(): Environment | null {
  const values: Environment = {
    verifyToken: Deno.env.get("META_VERIFY_TOKEN") ?? "",
    appSecret: Deno.env.get("META_APP_SECRET") ?? "",
    accessToken: Deno.env.get("META_ACCESS_TOKEN") ?? "",
    phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID") ?? "",
    graphVersion: Deno.env.get("META_GRAPH_VERSION") ?? "",
    elevenLabsApiKey: Deno.env.get("ELEVENLABS_API_KEY") ?? "",
    confirmationPepper: Deno.env.get("CONFIRMATION_PEPPER") ?? "",
  };
  return Object.values(values).every(Boolean) ? values : null;
}

function redactedTranscript(value: string): string {
  return value
    .replace(/\b\d{4,}\b/g, "[número removido]")
    .slice(0, 3000);
}

function parseAgentContent(content: unknown): unknown {
  if (typeof content !== "string") return content;
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function interpretOrder(base44: any, text: string, messageId: string) {
  const agents = base44.asServiceRole.agents;
  const conversation = await agents.createConversation({
    agent_name: "order_interpreter",
    metadata: { meta_message_id: messageId },
  });
  const submitted = await agents.addMessage(conversation, {
    role: "user",
    content: text,
  });
  let assistant =
    submitted?.role === "assistant" ? submitted : undefined;

  for (let attempt = 0; !assistant && attempt < 16; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const current = await agents.getConversation(conversation.id);
    assistant = [...(current?.messages ?? [])]
      .reverse()
      .find((message) => message.role === "assistant" && message.content);
  }
  if (!assistant) throw new Error("agent_reply_timeout");

  const parsed = orderIntentSchema.parse(
    parseAgentContent(assistant.content),
  );
  return {
    items: parsed.items.map((item) => ({
      spokenName: item.spoken_name,
      quantity: item.quantity,
      modifiers: item.modifiers,
    })),
    merchantPreference: parsed.merchant_preference,
    category: parsed.category,
    deliveryOrPickup: parsed.delivery_or_pickup,
    notes: parsed.notes,
    ambiguities: parsed.ambiguities,
    language: parsed.language,
  } satisfies OrderIntent;
}

async function persistNeedsHelp(input: {
  entities: any;
  profile: any;
  messageId: string;
  transcript: string;
}): Promise<void> {
  const now = new Date();
  const order = await input.entities.OrderDraft.create({
    meta_message_id: input.messageId,
    profile_id: input.profile.id,
    caregiver_user_id: input.profile.caregiver_user_id,
    transcript_redacted: redactedTranscript(input.transcript),
    normalized_items: [],
    merchant: { name: "Não definido" },
    pricing: {
      subtotal_cents: 0,
      fee_cents: 0,
      discount_cents: 0,
      total_cents: 0,
    },
    address_label: input.profile.saved_address_label,
    payment_mode: "cash_on_delivery",
    connector_mode: "demo",
    draft_hash: await sha256Hex(`needs-help:${input.messageId}`),
    status: "needs_help",
    expires_at: new Date(now.getTime() + 20 * 60_000).toISOString(),
    failure_code: "voice_understanding_failed",
  });
  await input.entities.AuditEvent.create({
    order_draft_id: order.id,
    caregiver_user_id: input.profile.caregiver_user_id,
    event_type: "voice_needs_help",
    actor_type: "system",
    connector_mode: "demo",
    redacted_metadata: {},
    occurred_at: now.toISOString(),
  });
}

async function handleVoice(req: Request, env: Environment): Promise<Response> {
  const rawBody = new Uint8Array(await req.arrayBuffer());
  const validSignature = await verifyMetaSignature(
    rawBody,
    req.headers.get("x-hub-signature-256"),
    env.appSecret,
  );
  if (!validSignature) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const voice = extractVoiceMessage(payload);
  if (!voice) return Response.json({ ok: true, ignored: true });

  const base44 = createClientFromRequest(req);
  const entities = base44.asServiceRole.entities;
  const phoneHash = await sha256Hex(
    `${env.confirmationPepper}:phone:${voice.sender}`,
  );
  const profiles = await entities.SeniorProfile.filter(
    { phone_hash: phoneHash, sender_allowlisted: true },
    "-created_date",
    1,
  );
  const profile = profiles[0];
  if (!profile) return Response.json({ ok: true, ignored: true });

  const existing = await entities.OrderDraft.filter(
    { meta_message_id: voice.messageId },
    "-created_date",
    1,
  );
  if (existing.length) {
    return Response.json({ ok: true, duplicate: true });
  }

  let transcript = "";
  try {
    const audio = await downloadMetaMedia({
      mediaId: voice.mediaId,
      accessToken: env.accessToken,
      graphVersion: env.graphVersion,
    });
    const transcription = await transcribePtBr({
      audio,
      mimeType: voice.mimeType,
      apiKey: env.elevenLabsApiKey,
    });
    transcript = transcription.text;
    const intent = await interpretOrder(
      base44,
      transcription.text,
      voice.messageId,
    );
    const prepared = await prepareOrder({
      intent,
      profile: {
        senderPhoneHash: profile.phone_hash,
        addressId: profile.saved_address_id,
        addressLabel: profile.saved_address_label,
      },
      connector: new DemoConnector(),
      confirmationPepper: env.confirmationPepper,
    });

    if (prepared.kind === "clarification") {
      const question =
        prepared.questions[0] ??
        "Pode me contar mais um detalhe do pedido?";
      await sendTextMessage({
        to: voice.sender,
        text: question,
        accessToken: env.accessToken,
        phoneNumberId: env.phoneNumberId,
        graphVersion: env.graphVersion,
      });
      return Response.json({ ok: true, clarification: true });
    }

    const order = await entities.OrderDraft.create({
      meta_message_id: voice.messageId,
      profile_id: profile.id,
      caregiver_user_id: profile.caregiver_user_id,
      transcript_redacted: redactedTranscript(transcription.text),
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
      caregiver_user_id: profile.caregiver_user_id,
      token_hash: prepared.confirmation.tokenHash,
      bound_draft_hash: prepared.confirmation.binding.draftHash,
      sender_phone_hash: prepared.confirmation.binding.senderPhoneHash,
      total_cents: prepared.confirmation.binding.totalCents,
      connector_mode: prepared.confirmation.binding.connectorMode,
      expires_at: prepared.confirmation.binding.expiresAt,
    });
    await entities.AuditEvent.bulkCreate([
      {
        order_draft_id: order.id,
        caregiver_user_id: profile.caregiver_user_id,
        event_type: "voice_transcribed",
        actor_type: "system",
        connector_mode: "demo",
        redacted_metadata: {
          provider: transcription.provider,
          elapsed_ms: transcription.elapsedMs,
        },
        occurred_at: new Date().toISOString(),
      },
      {
        order_draft_id: order.id,
        caregiver_user_id: profile.caregiver_user_id,
        event_type: "awaiting_confirmation",
        actor_type: "system",
        connector_mode: "demo",
        redacted_metadata: {},
        occurred_at: new Date().toISOString(),
      },
    ]);
    await sendInteractiveReadBack({
      to: voice.sender,
      text: prepared.readBack,
      orderId: order.id,
      token: prepared.confirmation.token,
      accessToken: env.accessToken,
      phoneNumberId: env.phoneNumberId,
      graphVersion: env.graphVersion,
    });
    return Response.json({ ok: true, order_id: order.id });
  } catch {
    await persistNeedsHelp({
      entities,
      profile,
      messageId: voice.messageId,
      transcript,
    }).catch(() => {});
    await sendTextMessage({
      to: voice.sender,
      text: "Não consegui entender esse áudio. Pode mandar de novo, mais devagar?",
      accessToken: env.accessToken,
      phoneNumberId: env.phoneNumberId,
      graphVersion: env.graphVersion,
    }).catch(() => {});
    return Response.json({ ok: true, needs_help: true });
  }
}

export async function handleMetaWebhook(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const verifyToken = Deno.env.get("META_VERIFY_TOKEN") ?? "";
    if (
      url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === verifyToken &&
      verifyToken
    ) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", {
        status: 200,
      });
    }
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const env = environment();
  if (!env) {
    return Response.json(
      { error: "whatsapp_not_configured" },
      { status: 503 },
    );
  }
  return handleVoice(req, env);
}

Deno.serve(handleMetaWebhook);
