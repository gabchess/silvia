import { describe, expect, it } from "vitest";
import {
  claimFilter,
  issueConfirmation,
  verifyConfirmation,
} from "../../base44/lib/confirmation";

const binding = {
  draftHash: "draft-a",
  senderPhoneHash: "phone-a",
  totalCents: 4590,
  connectorMode: "demo" as const,
  expiresAt: "2030-01-01T00:00:00.000Z",
};

describe("confirmation boundary", () => {
  it("accepts one exact unexpired binding", async () => {
    const issued = await issueConfirmation({
      ...binding,
      pepper: "test-pepper",
    });

    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: issued.binding,
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("rejects a token after the draft changes", async () => {
    const issued = await issueConfirmation({
      ...binding,
      pepper: "test-pepper",
    });

    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: { ...issued.binding, draftHash: "draft-b" },
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("rejects forged and expired tokens", async () => {
    const issued = await issueConfirmation({
      ...binding,
      pepper: "test-pepper",
    });

    expect(
      await verifyConfirmation({
        token: "forged",
        tokenHash: issued.tokenHash,
        binding: issued.binding,
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: issued.binding,
        pepper: "test-pepper",
        now: new Date("2030-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it.each([
    { senderPhoneHash: "phone-b" },
    { totalCents: 4591 },
    { connectorMode: "live" as const },
  ])("rejects a mismatched binding: %o", async (changed) => {
    const issued = await issueConfirmation({
      ...binding,
      pepper: "test-pepper",
    });

    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: { ...issued.binding, ...changed },
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("claims only a confirmed order with no prior attempt", () => {
    expect(claimFilter("order-1")).toEqual({
      id: "order-1",
      status: "confirmed",
      checkout_attempted_at: { $exists: false },
    });
  });
});
