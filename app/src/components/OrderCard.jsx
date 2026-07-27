import { formatMoney, statusLabel } from "../lib/presentation";

export default function OrderCard({
  order,
  canConfirm,
  confirming,
  onConfirm,
}) {
  if (!order) {
    return (
      <section className="order-card empty-card" aria-labelledby="order-title">
        <div className="empty-mark" aria-hidden="true">
          S
        </div>
        <p className="eyebrow">Tudo tranquilo</p>
        <h2 id="order-title">Nenhum pedido em aberto</h2>
        <p>
          Faça o ensaio para ver a Silvia montar, conferir e proteger um
          pedido do começo ao fim.
        </p>
      </section>
    );
  }

  const merchant = order.merchant ?? {};
  const pricing = order.pricing ?? {};
  const items = order.normalized_items ?? [];

  return (
    <section className="order-card" aria-labelledby="order-title">
      <div className="order-card-heading">
        <div>
          <p className="eyebrow">Pedido atual</p>
          <h2 id="order-title">{merchant.name ?? "Restaurante"}</h2>
        </div>
        <span className="mode-pill">
          <span aria-hidden="true" />
          {order.connector_mode === "demo"
            ? "Demonstração segura"
            : "Conector ao vivo"}
        </span>
      </div>

      <div className="status-line">
        <span className="status-icon" aria-hidden="true">
          ✓
        </span>
        <div>
          <strong>{statusLabel(order.status)}</strong>
          <p>Nada será enviado sem uma confirmação válida.</p>
        </div>
      </div>

      <ul className="item-list" aria-label="Itens do pedido">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.displayName}-${index}`}>
            <span className="quantity">{item.quantity}×</span>
            <div>
              <strong>{item.displayName ?? item.spokenName}</strong>
              {item.modifiers?.length ? (
                <small>{item.modifiers.join(", ")}</small>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <dl className="price-list">
        <div>
          <dt>Taxa de entrega</dt>
          <dd>{formatMoney(pricing.fee_cents)}</dd>
        </div>
        <div className="total-row">
          <dt>Total</dt>
          <dd>{formatMoney(pricing.total_cents)}</dd>
        </div>
      </dl>

      <div className="delivery-note">
        <span aria-hidden="true">⌂</span>
        <div>
          <strong>{order.address_label}</strong>
          <small>
            {order.payment_mode === "cash_on_delivery"
              ? "Pagamento na entrega"
              : "Pagamento feito no app parceiro"}
          </small>
        </div>
      </div>

      {canConfirm ? (
        <button
          className="confirm-order-action"
          type="button"
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming
            ? "Confirmando uma única vez…"
            : "Confirmar pedido de demonstração"}
        </button>
      ) : null}
      <p className="confirmation-boundary">
        A Silvia nunca confirma por você. Qualquer mudança no pedido exige uma
        nova confirmação.
      </p>
    </section>
  );
}
