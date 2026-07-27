import type { OrderStatus } from "./contracts.ts";

const allowed: Record<OrderStatus, OrderStatus[]> = {
  received: ["transcribing", "needs_help", "cancelled"],
  transcribing: ["interpreting", "needs_help", "cancelled"],
  interpreting: ["clarifying", "preparing", "needs_help", "cancelled"],
  clarifying: ["interpreting", "needs_help", "cancelled"],
  preparing: ["awaiting_confirmation", "needs_help", "cancelled"],
  awaiting_confirmation: ["editing", "expired", "confirmed", "cancelled"],
  editing: ["preparing", "cancelled"],
  expired: [],
  confirmed: ["checkout_in_progress"],
  checkout_in_progress: ["ordered", "checkout_failed"],
  ordered: [],
  checkout_failed: [],
  needs_help: ["cancelled"],
  cancelled: [],
};

export function transition(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!allowed[from].includes(to)) {
    throw new Error(`invalid transition: ${from} -> ${to}`);
  }
  return to;
}
