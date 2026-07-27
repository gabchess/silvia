export async function confirmAndCheckout(
  input: { order: any; idempotencyKey: string },
  repo: {
    claim(orderId: string): Promise<boolean>;
    markOrdered(orderId: string, receipt: unknown): Promise<void>;
    markFailed(orderId: string, code: string): Promise<void>;
    appendAudit(orderId: string, event: string): Promise<void>;
  },
  connector: {
    checkout(draft: any, idempotencyKey: string): Promise<any>;
  },
) {
  if (!(await repo.claim(input.order.id))) {
    return { kind: "duplicate" as const };
  }

  await repo.appendAudit(input.order.id, "checkout_claimed");
  try {
    const receipt = await connector.checkout(
      input.order,
      input.idempotencyKey,
    );
    await repo.markOrdered(input.order.id, receipt);
    await repo.appendAudit(input.order.id, "ordered");
    return { kind: "ordered" as const, receipt };
  } catch {
    await repo.markFailed(
      input.order.id,
      "connector_checkout_failed",
    );
    await repo.appendAudit(input.order.id, "checkout_failed");
    return { kind: "failed" as const };
  }
}
