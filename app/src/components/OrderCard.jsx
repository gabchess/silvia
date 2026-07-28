import { Home, ReceiptText, ShieldCheck } from "lucide-react";
import { formatMoney, statusLabel } from "../lib/presentation";

export default function OrderCard({ order }) {
  if (!order) {
    return (
      <section className="order-card empty-card" aria-labelledby="order-title">
        <ReceiptText size={25} aria-hidden="true" />
        <h3 id="order-title">Aguardando a demonstração</h3>
        <p>
          O pedido, o total e a confirmação vão aparecer aqui.
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
          <p>Pedido atual</p>
          <h3 id="order-title">{merchant.name ?? "Restaurante"}</h3>
        </div>
        <span className="mode-pill">
          <span aria-hidden="true" />
          {order.connector_mode === "demo"
            ? "Demo"
            : "Conector ao vivo"}
        </span>
      </div>

      <div className="status-line">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <strong>{statusLabel(order.status)}</strong>
          <p>Proteção aplicada pelo backend.</p>
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
        <Home size={18} aria-hidden="true" />
        <div>
          <strong>{order.address_label}</strong>
          <small>
            {order.payment_mode === "cash_on_delivery"
              ? "Pagamento na entrega"
              : "Pagamento feito no app parceiro"}
          </small>
        </div>
      </div>
    </section>
  );
}
