import { describe, expect, it, vi } from "vitest";
import { confirmAndCheckout } from "../../base44/lib/checkout";
import { isCaregiverRehearsal } from "../../base44/shared/confirmation-service";

describe("confirmAndCheckout", () => {
  it("allows caregivers to confirm only their own labelled demo rehearsal", () => {
    expect(
      isCaregiverRehearsal(
        {
          caregiver_user_id: "caregiver-1",
          connector_mode: "demo",
          meta_message_id: "rehearsal:one",
        },
        "caregiver-1",
        "dashboard_rehearsal",
      ),
    ).toBe(true);
    expect(
      isCaregiverRehearsal(
        {
          caregiver_user_id: "caregiver-1",
          connector_mode: "demo",
          meta_message_id: "wamid.real",
        },
        "caregiver-1",
        "dashboard_rehearsal",
      ),
    ).toBe(false);
  });

  it("calls checkout once when two confirmations race", async () => {
    let claimed = false;
    const repo = {
      claim: vi.fn(async () => {
        if (claimed) return false;
        claimed = true;
        return true;
      }),
      markOrdered: vi.fn(),
      markFailed: vi.fn(),
      appendAudit: vi.fn(),
    };
    const connector = {
      checkout: vi.fn(async () => ({
        connectorMode: "demo",
        externalId: "demo-1",
        status: "demo_ordered",
      })),
    };
    const input = {
      order: { id: "o1", status: "confirmed", connectorMode: "demo" },
      idempotencyKey: "o1:draft",
    };

    const results = await Promise.all([
      confirmAndCheckout(input, repo, connector),
      confirmAndCheckout(input, repo, connector),
    ]);

    expect(connector.checkout).toHaveBeenCalledTimes(1);
    expect(results.map(({ kind }) => kind).sort()).toEqual([
      "duplicate",
      "ordered",
    ]);
  });

  it("records a terminal failure without retrying", async () => {
    const repo = {
      claim: vi.fn(async () => true),
      markOrdered: vi.fn(),
      markFailed: vi.fn(),
      appendAudit: vi.fn(),
    };
    const connector = {
      checkout: vi.fn(async () => {
        throw new Error("down");
      }),
    };

    const result = await confirmAndCheckout(
      {
        order: { id: "o1", status: "confirmed", connectorMode: "demo" },
        idempotencyKey: "o1:draft",
      },
      repo,
      connector,
    );

    expect(result.kind).toBe("failed");
    expect(repo.markFailed).toHaveBeenCalledWith(
      "o1",
      "connector_checkout_failed",
    );
    expect(connector.checkout).toHaveBeenCalledTimes(1);
  });
});
