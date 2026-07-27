import { describe, expect, it } from "vitest";
import { transition } from "../../base44/lib/state-machine";

describe("order state machine", () => {
  it("allows the confirmed checkout path", () => {
    expect(transition("awaiting_confirmation", "confirmed")).toBe("confirmed");
    expect(transition("confirmed", "checkout_in_progress")).toBe(
      "checkout_in_progress",
    );
  });

  it("rejects checkout before confirmation and retries after failure", () => {
    expect(() => transition("preparing", "checkout_in_progress")).toThrow(
      "invalid transition",
    );
    expect(() => transition("checkout_failed", "checkout_in_progress")).toThrow(
      "invalid transition",
    );
  });
});
