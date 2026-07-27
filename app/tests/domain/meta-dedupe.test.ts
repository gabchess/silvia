import { describe, expect, it } from "vitest";
import {
  claimMetaMessage,
  finishMetaMessage,
} from "../../base44/shared/meta-dedupe";

function profiles() {
  const profile = {
    id: "profile-1",
    webhook_inflight: false,
    webhook_claim_token: "",
    webhook_claim_expires_at: new Date(0).toISOString(),
    processed_meta_message_ids: [] as string[],
  };
  return {
    profile,
    api: {
      async get() {
        return { ...profile };
      },
      async updateMany(
        query: Record<string, any>,
        update: Record<string, any>,
      ) {
        const available =
          query.id === profile.id &&
          (query.webhook_inflight?.$ne === true
            ? profile.webhook_inflight !== true
            : query.webhook_inflight === profile.webhook_inflight) &&
          (query.webhook_claim_token === undefined ||
            query.webhook_claim_token === profile.webhook_claim_token) &&
          (query.webhook_claim_expires_at === undefined ||
            query.webhook_claim_expires_at ===
              profile.webhook_claim_expires_at);
        if (!available) return { updated: 0 };
        Object.assign(profile, update.$set);
        return { updated: 1 };
      },
    },
  };
}

describe("Meta message claims", () => {
  it("serializes concurrent deliveries and remembers the completed message", async () => {
    const store = profiles();
    const first = await claimMetaMessage({
      profiles: store.api,
      profileId: store.profile.id,
      messageId: "wamid.1",
      claimToken: "claim-1",
    });
    const racing = await claimMetaMessage({
      profiles: store.api,
      profileId: store.profile.id,
      messageId: "wamid.1",
      claimToken: "claim-2",
    });

    expect(first.kind).toBe("claimed");
    expect(racing.kind).toBe("busy");
    if (first.kind !== "claimed") throw new Error("expected claim");
    await finishMetaMessage({
      profiles: store.api,
      profileId: store.profile.id,
      messageId: "wamid.1",
      claimToken: first.claimToken,
      processedMessageIds: first.processedMessageIds,
    });

    await expect(
      claimMetaMessage({
        profiles: store.api,
        profileId: store.profile.id,
        messageId: "wamid.1",
        claimToken: "claim-3",
      }),
    ).resolves.toEqual({ kind: "duplicate" });
  });
});
