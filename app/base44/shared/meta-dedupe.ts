const claimTtlMs = 2 * 60_000;
const retainedMessageIds = 100;

type ProfileRecord = {
  id: string;
  webhook_inflight?: boolean;
  webhook_claim_token?: string;
  webhook_claim_expires_at?: string;
  processed_meta_message_ids?: string[];
};

type Profiles = {
  get(id: string): Promise<ProfileRecord>;
  updateMany(
    query: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<{ updated: number }>;
};

function processedIds(profile: ProfileRecord): string[] {
  return Array.isArray(profile.processed_meta_message_ids)
    ? profile.processed_meta_message_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
}

async function acquire(
  profiles: Profiles,
  profileId: string,
  claimToken: string,
  expiresAt: string,
): Promise<boolean> {
  const result = await profiles.updateMany(
    { id: profileId, webhook_inflight: { $ne: true } },
    {
      $set: {
        webhook_inflight: true,
        webhook_claim_token: claimToken,
        webhook_claim_expires_at: expiresAt,
      },
    },
  );
  return result.updated === 1;
}

async function release(
  profiles: Profiles,
  profileId: string,
  claimToken: string,
  messageIds: string[],
): Promise<void> {
  const result = await profiles.updateMany(
    {
      id: profileId,
      webhook_inflight: true,
      webhook_claim_token: claimToken,
    },
    {
      $set: {
        webhook_inflight: false,
        webhook_claim_token: "",
        webhook_claim_expires_at: new Date(0).toISOString(),
        processed_meta_message_ids: messageIds.slice(-retainedMessageIds),
      },
    },
  );
  if (result.updated !== 1) throw new Error("meta_message_claim_lost");
}

export async function claimMetaMessage(input: {
  profiles: Profiles;
  profileId: string;
  messageId: string;
  now?: Date;
  claimToken?: string;
}) {
  const now = input.now ?? new Date();
  const claimToken = input.claimToken ?? crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + claimTtlMs).toISOString();
  let claimed = await acquire(
    input.profiles,
    input.profileId,
    claimToken,
    expiresAt,
  );

  if (!claimed) {
    const current = await input.profiles.get(input.profileId);
    if (processedIds(current).includes(input.messageId)) {
      return { kind: "duplicate" as const };
    }

    const stale =
      current.webhook_inflight === true &&
      typeof current.webhook_claim_token === "string" &&
      current.webhook_claim_token.length > 0 &&
      typeof current.webhook_claim_expires_at === "string" &&
      new Date(current.webhook_claim_expires_at).getTime() <= now.getTime();
    if (!stale) return { kind: "busy" as const };

    const reclaimed = await input.profiles.updateMany(
      {
        id: input.profileId,
        webhook_inflight: true,
        webhook_claim_token: current.webhook_claim_token,
        webhook_claim_expires_at: current.webhook_claim_expires_at,
      },
      {
        $set: {
          webhook_claim_token: claimToken,
          webhook_claim_expires_at: expiresAt,
        },
      },
    );
    claimed = reclaimed.updated === 1;
    if (!claimed) return { kind: "busy" as const };
  }

  const current = await input.profiles.get(input.profileId);
  const messageIds = processedIds(current);
  if (messageIds.includes(input.messageId)) {
    await release(
      input.profiles,
      input.profileId,
      claimToken,
      messageIds,
    );
    return { kind: "duplicate" as const };
  }

  return {
    kind: "claimed" as const,
    claimToken,
    processedMessageIds: messageIds,
  };
}

export async function finishMetaMessage(input: {
  profiles: Profiles;
  profileId: string;
  messageId: string;
  claimToken: string;
  processedMessageIds: string[];
}): Promise<void> {
  await release(
    input.profiles,
    input.profileId,
    input.claimToken,
    [...new Set([...input.processedMessageIds, input.messageId])],
  );
}
