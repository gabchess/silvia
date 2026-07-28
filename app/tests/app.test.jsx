import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  me: vi.fn(),
  loginWithProvider: vi.fn(),
  logout: vi.fn(),
  ordersList: vi.fn(),
  ordersSubscribe: vi.fn(() => vi.fn()),
  auditsList: vi.fn(),
  auditsSubscribe: vi.fn(() => vi.fn()),
  invoke: vi.fn(),
}));

vi.mock("../src/api/base44Client.js", () => ({
  base44: {
    auth: {
      isAuthenticated: sdk.isAuthenticated,
      me: sdk.me,
      loginWithProvider: sdk.loginWithProvider,
      logout: sdk.logout,
    },
    entities: {
      OrderDraft: {
        list: sdk.ordersList,
        subscribe: sdk.ordersSubscribe,
      },
      AuditEvent: {
        list: sdk.auditsList,
        subscribe: sdk.auditsSubscribe,
      },
    },
    functions: {
      invoke: sdk.invoke,
    },
  },
}));

import App from "../src/App";

describe("Silvia caregiver app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.ordersSubscribe.mockReturnValue(vi.fn());
    sdk.auditsSubscribe.mockReturnValue(vi.fn());
    sdk.ordersList.mockResolvedValue([]);
    sdk.auditsList.mockResolvedValue([]);
  });

  it("states the promise and confirmation boundary before login", async () => {
    sdk.isAuthenticated.mockResolvedValue(false);

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /silvia/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/só faz o pedido quando você confirma/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /entrar com google/i }),
    ).toBeInTheDocument();
  });

  it("shows the current demo order and rehearses the Portuguese flow", async () => {
    sdk.isAuthenticated.mockResolvedValue(true);
    sdk.me.mockResolvedValue({
      id: "caregiver-1",
      full_name: "Ana",
      email: "ana@example.com",
    });
    const order = {
      id: "order-1",
      merchant: { name: "Cozinha da Praça" },
      normalized_items: [
        {
          displayName: "Salmão grelhado com legumes",
          quantity: 1,
          modifiers: [],
        },
        {
          displayName: "Suco de laranja",
          quantity: 1,
          modifiers: [],
        },
      ],
      pricing: { fee_cents: 690, total_cents: 6670 },
      address_label: "Casa da Dona Maria",
      connector_mode: "demo",
      payment_mode: "cash_on_delivery",
      status: "awaiting_confirmation",
      expires_at: "2026-07-27T22:00:00.000Z",
    };
    const rehearsedOrder = { ...order, id: "order-2" };
    sdk.ordersList
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([rehearsedOrder])
      .mockResolvedValue([{ ...rehearsedOrder, status: "editing" }]);
    sdk.auditsList.mockResolvedValue([
      {
        id: "audit-1",
        order_draft_id: "order-1",
        event_type: "awaiting_confirmation",
        actor_type: "system",
        occurred_at: "2026-07-27T20:00:00.000Z",
      },
    ]);
    sdk.invoke
      .mockResolvedValueOnce({
        data: {
          orderId: "order-2",
          readBack: "Seu pedido está pronto para conferir.",
          confirmationToken: "token",
          senderPhoneHash: "a".repeat(64),
          connectorMode: "demo",
        },
      })
      .mockResolvedValueOnce({
        data: {
          kind: "editing",
        },
      });

    render(<App />);

    expect(await screen.findByText("Cozinha da Praça")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*66,70/)).toBeInTheDocument();
    expect(screen.getByText(/simulação no navegador/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /recomeçar demonstração/i }),
    );
    await waitFor(() =>
      expect(sdk.invoke).toHaveBeenCalledWith("rehearse-order", {
        transcript:
          "Silvia, quero um salmão grelhado com legumes e um suco de laranja.",
      }),
    );
    expect(
      await screen.findByText(/preparei seu pedido na cozinha da praça/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() =>
      expect(sdk.invoke).toHaveBeenLastCalledWith("confirm-order", {
        action: "edit",
        orderId: "order-2",
        token: "token",
        senderPhoneHash: "a".repeat(64),
        source: "dashboard_rehearsal",
      }),
    );
    expect(
      await screen.findByText(/pedido pausado\. grave uma nova mensagem/i),
    ).toBeInTheDocument();
  });
});
