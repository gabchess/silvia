import { canonicalize, sha256Hex } from "./canonical.ts";
import type { ConnectorMode } from "./contracts.ts";

export type ConfirmationBinding = {
  draftHash: string;
  senderPhoneHash: string;
  totalCents: number;
  connectorMode: ConnectorMode;
  expiresAt: string;
};

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function boundHash(
  token: string,
  binding: ConfirmationBinding,
  pepper: string,
): Promise<string> {
  return sha256Hex(`${pepper}.${token}.${canonicalize(binding)}`);
}

function fixedLengthEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function issueConfirmation(
  input: ConfirmationBinding & { pepper: string },
): Promise<{
  token: string;
  tokenHash: string;
  binding: ConfirmationBinding;
}> {
  const { pepper, ...confirmationBinding } = input;
  const token = randomToken();
  return {
    token,
    tokenHash: await boundHash(token, confirmationBinding, pepper),
    binding: confirmationBinding,
  };
}

export async function verifyConfirmation(input: {
  token: string;
  tokenHash: string;
  binding: ConfirmationBinding;
  pepper: string;
  now: Date;
}): Promise<boolean> {
  if (input.now.getTime() >= new Date(input.binding.expiresAt).getTime()) {
    return false;
  }

  const candidate = await boundHash(
    input.token,
    input.binding,
    input.pepper,
  );
  return fixedLengthEqual(candidate, input.tokenHash);
}

export function claimFilter(orderId: string): Record<string, unknown> {
  return {
    id: orderId,
    status: "confirmed",
    checkout_attempted_at: { $exists: false },
  };
}
