import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function resource(path: string) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), path), "utf8"),
  );
}

describe("Base44 resources", () => {
  it("defines the four product entities", () => {
    for (const name of [
      "SeniorProfile",
      "OrderDraft",
      "Confirmation",
      "AuditEvent",
    ]) {
      expect(resource(`base44/entities/${name}.jsonc`).name).toBe(name);
    }
  });

  it("keeps the order interpreter away from functions and entities", () => {
    const agent = resource("base44/agents/order_interpreter.jsonc");
    expect(agent.name).toBe("order_interpreter");
    expect(agent.tool_configs).toEqual([]);
    expect(agent.instructions).toMatch(/JSON/);
  });

  it("allows backend service-role writes without exposing them to caregivers", () => {
    for (const name of [
      "SeniorProfile",
      "OrderDraft",
      "Confirmation",
      "AuditEvent",
    ]) {
      const entity = resource(`base44/entities/${name}.jsonc`);
      expect(entity.rls.create).toEqual({
        user_condition: { role: "admin" },
      });
    }

    expect(resource("base44/entities/SeniorProfile.jsonc").rls.update).toEqual({
      user_condition: { role: "admin" },
    });
    expect(resource("base44/entities/OrderDraft.jsonc").rls.update).toEqual({
      user_condition: { role: "admin" },
    });
    expect(resource("base44/entities/Confirmation.jsonc").rls.update).toEqual({
      user_condition: { role: "admin" },
    });
  });
});
