import { LogOut, ShieldCheck } from "lucide-react";
import ConversationStage from "./ConversationStage";
import OrderCard from "./OrderCard";
import Timeline from "./Timeline";

export default function Dashboard({
  user,
  orders,
  events,
  busy,
  error,
  rehearsal,
  confirmationMessage,
  confirming,
  editing,
  onRehearse,
  onConfirm,
  onEdit,
  onLogout,
}) {
  const currentOrder = orders[0] ?? null;
  const currentEvents = currentOrder
    ? events.filter((event) => event.order_draft_id === currentOrder.id)
    : events;
  const canConfirm =
    currentOrder?.status === "awaiting_confirmation" &&
    rehearsal?.orderId === currentOrder.id &&
    Boolean(rehearsal?.confirmationToken);

  return (
    <main className="app-shell" lang="pt-BR">
      <header className="topbar">
        <a className="brand" href="#demonstracao" aria-label="Silvia, início">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Silvia</strong>
            <small>cuidado que conversa</small>
          </span>
        </a>
        <div className="user-actions">
          <span className="environment-label">
            <span aria-hidden="true" />
            Demo segura
          </span>
          <span>{user.full_name?.split(" ")[0] || "Familiar"}</span>
          <button className="text-button" type="button" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <section className="judge-intro" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">Assistência por conversa</p>
          <h1 id="hero-title">
            Ela pede por voz.
            <em>Silvia espera pelo sim.</em>
          </h1>
        </div>
        <div className="intro-proof">
          <ShieldCheck size={24} aria-hidden="true" />
          <p>
            <strong>O modelo não compra sozinho.</strong>
            Itens, taxa, total e endereço aparecem antes de uma confirmação
            vinculada ao pedido.
          </p>
        </div>
      </section>

      <div className="judge-workspace" id="demonstracao">
        <ConversationStage
          order={currentOrder}
          rehearsal={rehearsal}
          busy={busy}
          confirming={confirming}
          editing={editing}
          error={error}
          confirmationMessage={confirmationMessage}
          canConfirm={canConfirm}
          onRehearse={onRehearse}
          onConfirm={onConfirm}
          onEdit={onEdit}
        />

        <aside className="safety-rail" aria-label="Proteções e registro ao vivo">
          <div className="rail-heading">
            <p className="rail-kicker">
              <span aria-hidden="true" />
              Base44 em tempo real
            </p>
            <h2>O pedido sob controle</h2>
            <p>
              O que a conversa promete, o backend precisa provar.
            </p>
          </div>
          <OrderCard
            order={currentOrder}
          />
          <Timeline events={currentEvents} />
          <div className="rail-disclosure">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              <strong>Limite desta versão</strong>
              A demonstração usa um conector determinístico. Não acessa iFood
              nem movimenta dinheiro.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
