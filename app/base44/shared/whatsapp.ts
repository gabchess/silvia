const maxAudioBytes = 10 * 1024 * 1024;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  return Array.isArray(value) ? record(value[0]) : null;
}

function fixedLengthEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function ownedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function verifyMetaSignature(
  rawBody: Uint8Array,
  signature: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signature?.startsWith("sha256=") || !appSecret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    ownedBuffer(rawBody),
  );
  const expected = `sha256=${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
  return fixedLengthEqual(expected, signature);
}

export function extractVoiceMessage(payload: unknown): {
  messageId: string;
  sender: string;
  mediaId: string;
  mimeType: string;
} | null {
  const entry = firstRecord(record(payload)?.entry);
  const change = firstRecord(entry?.changes);
  const value = record(change?.value);
  const message = firstRecord(value?.messages);
  const audio = record(message?.audio);
  if (
    message?.type !== "audio" ||
    typeof message.id !== "string" ||
    typeof message.from !== "string" ||
    typeof audio?.id !== "string" ||
    typeof audio.mime_type !== "string" ||
    !message.id ||
    !message.from ||
    !audio.id ||
    !audio.mime_type
  ) {
    return null;
  }

  return {
    messageId: message.id,
    sender: message.from,
    mediaId: audio.id,
    mimeType: audio.mime_type,
  };
}

export function confirmationButtons(orderId: string, token: string) {
  return [
    {
      type: "reply",
      reply: {
        id: `confirm:${orderId}:${token}`,
        title: "Confirmar pedido",
      },
    },
    {
      type: "reply",
      reply: {
        id: `edit:${orderId}:${token}`,
        title: "Alterar",
      },
    },
  ];
}

function graphUrl(graphVersion: string, path: string): string {
  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error("invalid_meta_graph_version");
  }
  return `https://graph.facebook.com/${graphVersion}/${path}`;
}

export async function downloadMetaMedia(input: {
  mediaId: string;
  accessToken: string;
  graphVersion: string;
  timeoutMs?: number;
}): Promise<Uint8Array> {
  const headers = { Authorization: `Bearer ${input.accessToken}` };
  const metadataResponse = await fetch(
    graphUrl(input.graphVersion, encodeURIComponent(input.mediaId)),
    {
      headers,
      signal: AbortSignal.timeout(input.timeoutMs ?? 10_000),
    },
  );
  if (!metadataResponse.ok) {
    throw new Error(`meta_media_metadata_${metadataResponse.status}`);
  }
  const metadata = await metadataResponse.json();
  if (typeof metadata.url !== "string") {
    throw new Error("meta_media_url_missing");
  }

  const mediaResponse = await fetch(metadata.url, {
    headers,
    signal: AbortSignal.timeout(input.timeoutMs ?? 10_000),
  });
  if (!mediaResponse.ok) {
    throw new Error(`meta_media_download_${mediaResponse.status}`);
  }
  const declaredBytes = Number(mediaResponse.headers.get("content-length"));
  if (Number.isFinite(declaredBytes) && declaredBytes > maxAudioBytes) {
    throw new Error("meta_media_too_large");
  }
  const audio = new Uint8Array(await mediaResponse.arrayBuffer());
  if (audio.byteLength > maxAudioBytes) {
    throw new Error("meta_media_too_large");
  }
  return audio;
}

async function sendWhatsAppPayload(input: {
  to: string;
  payload: Record<string, unknown>;
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  timeoutMs?: number;
}): Promise<void> {
  const response = await fetch(
    graphUrl(
      input.graphVersion,
      `${encodeURIComponent(input.phoneNumberId)}/messages`,
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to,
        ...input.payload,
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`meta_send_${response.status}`);
  }
}

export async function sendInteractiveReadBack(input: {
  to: string;
  text: string;
  orderId: string;
  token: string;
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  timeoutMs?: number;
}): Promise<void> {
  await sendWhatsAppPayload({
    ...input,
    payload: {
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: input.text },
        action: {
          buttons: confirmationButtons(input.orderId, input.token),
        },
      },
    },
  });
}

export async function sendTextMessage(input: {
  to: string;
  text: string;
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  timeoutMs?: number;
}): Promise<void> {
  await sendWhatsAppPayload({
    ...input,
    payload: {
      type: "text",
      text: { body: input.text, preview_url: false },
    },
  });
}
