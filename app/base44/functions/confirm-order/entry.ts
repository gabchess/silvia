import { createClientFromRequest } from "npm:@base44/sdk";
import {
  ConfirmationFailure,
  processOrderAction,
} from "../../shared/confirmation-service.ts";

function validBody(value: unknown): value is {
  action: "confirm" | "edit";
  orderId: string;
  token: string;
  senderPhoneHash: string;
  source: "dashboard_rehearsal";
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const body = value as Record<string, unknown>;
  const allowed = new Set([
    "action",
    "orderId",
    "token",
    "senderPhoneHash",
    "source",
  ]);
  return (
    Object.keys(body).every((key) => allowed.has(key)) &&
    (body.action === "confirm" || body.action === "edit") &&
    typeof body.orderId === "string" &&
    body.orderId.length > 0 &&
    typeof body.token === "string" &&
    body.token.length > 0 &&
      typeof body.senderPhoneHash === "string" &&
      body.senderPhoneHash.length === 64 &&
      body.source === "dashboard_rehearsal"
  );
}

export async function handleConfirmOrder(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  const base44 = createClientFromRequest(req);
  const caregiver = await base44.auth.me();
  if (!caregiver) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const pepper = Deno.env.get("CONFIRMATION_PEPPER") ?? "";
  if (!pepper) {
    return Response.json(
      { error: "confirmation_not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!validBody(body)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await processOrderAction({
      base44,
      ...body,
      caregiverUserId: caregiver.id,
      confirmationPepper: pepper,
      enableLiveCheckout:
        Deno.env.get("ENABLE_LIVE_CHECKOUT") === "true",
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ConfirmationFailure) {
      return Response.json(
        { error: error.code },
        { status: error.status },
      );
    }
    return Response.json({ error: "confirmation_failed" }, { status: 500 });
  }
}

Deno.serve(handleConfirmOrder);
