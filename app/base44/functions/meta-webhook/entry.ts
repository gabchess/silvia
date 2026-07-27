import { createClientFromRequest } from "npm:@base44/sdk";
import { sha256Hex } from "../../shared/canonical.ts";
import {
  ConfirmationFailure,
  processOrderAction,
} from "../../shared/confirmation-service.ts";
import type { OrderIntent } from "../../shared/contracts.ts";
import { DemoConnector } from "../../shared/demo-connector.ts";
import { orderIntentSchema } from "../../shared/intent-schema.ts";
import {
  claimMetaMessage,
  finishMetaMessage,
} from "../../shared/meta-dedupe.ts";
import { prepareOrder } from "../../shared/orchestrator.ts";
import { transcribePtBr } from "../../shared/transcription.ts";
import {
  downloadMetaMedia,
  extractInteractiveReply,
  extractVoiceMessage,
  readBoundedRequestBody,
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
}): Promise<void> {
  const now = new Date();
  const order = await input.entities.OrderDraft.create({
    meta_message_id: input.messageId,
    profile_id: input.profile.id,
    caregiver_user_id: input.profile.caregiver_user_id,
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

async function handleVoice(
  req: Request,
  env: Environment,
  voice: {
    messageId: string;
    sender: string;
    mediaId: string;
    mimeType: string;
  },
): Promise<Response> {
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

  const claim = await claimMetaMessage({
    profiles: entities.SeniorProfile,
    profileId: profile.id,
    messageId: voice.messageId,
  });
  if (claim.kind === "duplicate") {
    return Response.json({ ok: true, duplicate: true });
  }
  if (claim.kind === "busy") {
    return Response.json({ error: "profile_webhook_busy" }, { status: 503 });
  }

  const complete = async (response: Response) => {
    await finishMetaMessage({
      profiles: entities.SeniorProfile,
      profileId: profile.id,
      messageId: voice.messageId,
      claimToken: claim.claimToken,
      processedMessageIds: claim.processedMessageIds,
    });
    return response;
  };

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
      return complete(Response.json({ ok: true, clarification: true }));
    }

    const order = await entities.OrderDraft.create({
      meta_message_id: voice.messageId,
      profile_id: profile.id,
      caregiver_user_id: profile.caregiver_user_id,
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
    return complete(Response.json({ ok: true, order_id: order.id }));
  } catch {
    await persistNeedsHelp({
      entities,
      profile,
      messageId: voice.messageId,
    }).catch(() => {});
    await sendTextMessage({
      to: voice.sender,
      text: "Não consegui entender esse áudio. Pode mandar de novo, mais devagar?",
      accessToken: env.accessToken,
      phoneNumberId: env.phoneNumberId,
      graphVersion: env.graphVersion,
    }).catch(() => {});
    return complete(Response.json({ ok: true, needs_help: true }));
  }
}

async function handleInteractive(
  req: Request,
  env: Environment,
  reply: {
    action: "confirm" | "edit";
    messageId: string;
    orderId: string;
    sender: string;
    token: string;
  },
): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const senderPhoneHash = await sha256Hex(
    `${env.confirmationPepper}:phone:${reply.sender}`,
  );

  try {
    const result = await processOrderAction({
      base44,
      action: reply.action,
      orderId: reply.orderId,
      token: reply.token,
      senderPhoneHash,
      confirmationPepper: env.confirmationPepper,
      enableLiveCheckout:
        Deno.env.get("ENABLE_LIVE_CHECKOUT") === "true",
    });
    const text =
      result.kind === "editing"
        ? "Tudo bem. Me diga o que você quer mudar."
        : result.kind === "ordered"
          ? "Pedido de demonstração confirmado. Nenhum pedido real foi enviado."
          : result.kind === "duplicate"
            ? "Esse pedido já foi processado."
            : "Não consegui concluir. Não vou tentar de novo sem uma nova confirmação.";
    await sendTextMessage({
      to: reply.sender,
      text,
      accessToken: env.accessToken,
      phoneNumberId: env.phoneNumberId,
      graphVersion: env.graphVersion,
    });
    return Response.json({
      ok: true,
      result: result.kind,
      message_id: reply.messageId,
    });
  } catch (error) {
    const code =
      error instanceof ConfirmationFailure
        ? error.code
        : "confirmation_failed";
    await sendTextMessage({
      to: reply.sender,
      text: "Essa confirmação não vale mais. Vou esperar um novo pedido.",
      accessToken: env.accessToken,
      phoneNumberId: env.phoneNumberId,
      graphVersion: env.graphVersion,
    }).catch(() => {});
    return Response.json({ ok: true, rejected: code });
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

  let rawBody: Uint8Array;
  try {
    rawBody = await readBoundedRequestBody(req);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "webhook_body_too_large"
    ) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
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
  if (voice) return handleVoice(req, env, voice);
  const interactive = extractInteractiveReply(payload);
  if (interactive) return handleInteractive(req, env, interactive);
  return Response.json({ ok: true, ignored: true });
}

Deno.serve(handleMetaWebhook);
