import { verifyConfirmation } from "./confirmation.ts";
import { confirmAndCheckout } from "./checkout.ts";
import { DemoConnector } from "./demo-connector.ts";

export class ConfirmationFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

function fail(code: string, status = 409): never {
  throw new ConfirmationFailure(code, status);
}

export async function processOrderAction(input: {
  base44: any;
  action: "confirm" | "edit";
  orderId: string;
  token: string;
  senderPhoneHash: string;
  caregiverUserId?: string;
  confirmationPepper: string;
  enableLiveCheckout: boolean;
}) {
  const entities = input.base44.asServiceRole.entities;
  const order = await entities.OrderDraft.get(input.orderId);
  if (!order) fail("order_not_found", 404);
  if (
    input.caregiverUserId &&
    order.caregiver_user_id !== input.caregiverUserId
  ) {
    fail("order_not_found", 404);
  }
  if (order.status !== "awaiting_confirmation") {
    fail("order_not_awaiting_confirmation");
  }

  const confirmations = await entities.Confirmation.filter(
    { order_draft_id: order.id },
    "-created_date",
    10,
  );
  const confirmation = confirmations.find(
    (candidate: any) =>
      !candidate.used_at && !candidate.invalidated_at,
  );
  if (!confirmation) fail("confirmation_not_found", 404);

  const profile = await entities.SeniorProfile.get(order.profile_id);
  if (!profile) fail("profile_not_found", 404);
  const pricing = order.pricing ?? {};
  const totalCents = Number(pricing.total_cents);
  if (
    !Number.isInteger(totalCents) ||
    confirmation.bound_draft_hash !== order.draft_hash ||
    confirmation.sender_phone_hash !== input.senderPhoneHash ||
    profile.phone_hash !== input.senderPhoneHash ||
    confirmation.total_cents !== totalCents ||
    confirmation.connector_mode !== order.connector_mode ||
    confirmation.expires_at !== order.expires_at
  ) {
    fail("confirmation_binding_mismatch");
  }

  const valid = await verifyConfirmation({
    token: input.token,
    tokenHash: confirmation.token_hash,
    binding: {
      draftHash: order.draft_hash,
      senderPhoneHash: input.senderPhoneHash,
      totalCents,
      connectorMode: order.connector_mode,
      expiresAt: order.expires_at,
    },
    pepper: input.confirmationPepper,
    now: new Date(),
  });
  if (!valid) fail("invalid_or_expired_confirmation");
  if (totalCents > Number(profile.spend_cap_brl) * 100) {
    fail("spend_cap_exceeded");
  }

  const occurredAt = new Date().toISOString();
  if (input.action === "edit") {
    const editClaim = await entities.OrderDraft.updateMany(
      { id: order.id, status: "awaiting_confirmation" },
      { $set: { status: "editing" } },
    );
    if (editClaim.updated !== 1) {
      return { kind: "duplicate" as const };
    }
    await entities.Confirmation.update(confirmation.id, {
      invalidated_at: occurredAt,
    });
    await entities.AuditEvent.create({
      order_draft_id: order.id,
      caregiver_user_id: order.caregiver_user_id,
      event_type: "editing_requested",
      actor_type: input.caregiverUserId ? "caregiver" : "senior",
      connector_mode: order.connector_mode,
      redacted_metadata: {},
      occurred_at: occurredAt,
    });
    return { kind: "editing" as const };
  }

  if (order.connector_mode === "live" && !input.enableLiveCheckout) {
    fail("live_checkout_disabled");
  }
  if (order.connector_mode === "live") {
    fail("live_connector_unavailable", 503);
  }

  const confirmationClaim = await entities.OrderDraft.updateMany(
    {
      id: order.id,
      status: "awaiting_confirmation",
      draft_hash: order.draft_hash,
    },
    {
      $set: {
        status: "confirmed",
        confirmed_at: occurredAt,
      },
    },
  );
  if (confirmationClaim.updated !== 1) {
    return { kind: "duplicate" as const };
  }

  const repo = {
    async claim(orderId: string) {
      const claim = await entities.OrderDraft.updateMany(
        {
          id: orderId,
          status: "confirmed",
        },
        {
          $set: {
            status: "checkout_in_progress",
            checkout_attempted_at: new Date().toISOString(),
          },
        },
      );
      return claim.updated === 1;
    },
    async markOrdered(orderId: string, receipt: unknown) {
      await entities.OrderDraft.update(orderId, {
        status: "ordered",
        receipt,
      });
    },
    async markFailed(orderId: string, code: string) {
      await entities.OrderDraft.update(orderId, {
        status: "checkout_failed",
        failure_code: code,
      });
    },
    async appendAudit(orderId: string, event: string) {
      await entities.AuditEvent.create({
        order_draft_id: orderId,
        caregiver_user_id: order.caregiver_user_id,
        event_type: event,
        actor_type: event === "checkout_claimed" ? "system" : "connector",
        connector_mode: order.connector_mode,
        redacted_metadata: {},
        occurred_at: new Date().toISOString(),
      });
    },
  };

  const result = await confirmAndCheckout(
    {
      order,
      idempotencyKey: `${order.id}:${order.draft_hash}`,
    },
    repo,
    new DemoConnector(),
  );
  if (result.kind !== "duplicate") {
    await entities.Confirmation.update(confirmation.id, {
      used_at: new Date().toISOString(),
    });
  }
  return result;
}
