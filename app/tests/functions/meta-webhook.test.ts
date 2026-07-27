import { describe, expect, it, vi } from "vitest";
import {
  confirmationButtons,
  downloadMetaMedia,
  extractInteractiveReply,
  extractVoiceMessage,
  readBoundedRequestBody,
  verifyMetaSignature,
} from "../../base44/lib/whatsapp";

describe("Meta webhook boundary", () => {
  it("rejects oversized webhook bodies without relying on content-length", async () => {
    const request = new Request("https://example.test/webhook", {
      method: "POST",
      body: new Uint8Array(9),
    });

    await expect(readBoundedRequestBody(request, 8)).rejects.toThrow(
      "webhook_body_too_large",
    );
  });

  it("never forwards the Meta token to an untrusted media host", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ url: "https://attacker.example/audio.ogg" }),
    );

    await expect(
      downloadMetaMedia({
        mediaId: "media.1",
        accessToken: "secret",
        graphVersion: "v23.0",
        fetchImpl,
      }),
    ).rejects.toThrow("untrusted_meta_media_url");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects a forged signature", async () => {
    expect(
      await verifyMetaSignature(
        new TextEncoder().encode('{"entry":[]}'),
        "sha256=00",
        "app-secret",
      ),
    ).toBe(false);
  });

  it("accepts the matching HMAC signature", async () => {
    const body = new TextEncoder().encode('{"entry":[]}');
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("app-secret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const digest = await crypto.subtle.sign("HMAC", key, body);
    const signature = `sha256=${[...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;

    expect(
      await verifyMetaSignature(body, signature, "app-secret"),
    ).toBe(true);
  });

  it("deduplicates around Meta's message id", () => {
    const message = extractVoiceMessage({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.1",
                    from: "5511999990000",
                    type: "audio",
                    audio: { id: "media.1", mime_type: "audio/ogg" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(message).toEqual({
      messageId: "wamid.1",
      sender: "5511999990000",
      mediaId: "media.1",
      mimeType: "audio/ogg",
    });
  });

  it("ignores malformed and non-audio messages", () => {
    expect(extractVoiceMessage({ entry: [] })).toBeNull();
    expect(
      extractVoiceMessage({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "wamid.2",
                      from: "5511999990000",
                      type: "text",
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toBeNull();
  });

  it("binds both buttons to the order token", () => {
    const buttons = confirmationButtons("order-1", "token-1");
    expect(buttons[0].reply.id).toBe("confirm:order-1:token-1");
    expect(buttons[1].reply.id).toBe("edit:order-1:token-1");
  });

  it("extracts only a bound interactive reply", () => {
    expect(
      extractInteractiveReply({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "wamid.reply",
                      from: "5511999990000",
                      type: "interactive",
                      interactive: {
                        type: "button_reply",
                        button_reply: {
                          id: "confirm:order-1:token-1",
                          title: "Confirmar pedido",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toEqual({
      action: "confirm",
      messageId: "wamid.reply",
      orderId: "order-1",
      sender: "5511999990000",
      token: "token-1",
    });
  });
});
