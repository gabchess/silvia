import OrderCard from "./OrderCard";
import Timeline from "./Timeline";

export default function Dashboard({
  user,
  orders,
  events,
  busy,
  error,
  rehearsal,
  onRehearse,
  onLogout,
}) {
  const currentOrder = orders[0] ?? null;
  const currentEvents = currentOrder
    ? events.filter((event) => event.order_draft_id === currentOrder.id)
    : events;

  return (
    <main className="app-shell" lang="pt-BR">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Silvia, início">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Silvia</strong>
            <small>cuidado que conversa</small>
          </span>
        </a>
        <div className="user-actions">
          <span>Olá, {user.full_name?.split(" ")[0] || "familiar"}</span>
          <button className="text-button" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className="dashboard" id="inicio">
        <section className="hero-copy" aria-labelledby="hero-title">
          <div className="trust-tag">
            <span aria-hidden="true">✓</span>
            Feita para a família acompanhar
          </div>
          <p className="eyebrow">Assistência pelo WhatsApp</p>
          <h1 id="hero-title">
            Peça falando.
            <br />
            <em>Confirme com calma.</em>
          </h1>
          <p className="hero-lede">
            A Silvia entende o pedido, lê tudo de volta e só continua depois
            de uma confirmação clara. O modelo nunca compra sozinho.
          </p>

          <div className="voice-preview" aria-label="Exemplo de mensagem de voz">
            <button
              type="button"
              className="play-button"
              aria-label="Exemplo de áudio"
              disabled
            >
              ▶
            </button>
            <div className="waveform" aria-hidden="true">
              {[16, 28, 20, 36, 24, 42, 18, 34, 22, 30, 15, 25].map(
                (height, index) => (
                  <span key={index} style={{ height }} />
                ),
              )}
            </div>
            <span>0:08</span>
          </div>
          <p className="spoken-quote">
            “Silvia, quero dois hambúrgueres sem cebola e uma coca sem
            açúcar.”
          </p>

          <button
            className="primary-action"
            type="button"
            onClick={onRehearse}
            disabled={busy}
          >
            <span aria-hidden="true">{busy ? "…" : "◉"}</span>
            {busy ? "Montando pedido…" : "Ensaiar pedido por voz"}
          </button>
          <p className="demo-disclosure">
            O ensaio usa um cardápio fictício. Nenhum pedido real é enviado.
          </p>

          {rehearsal ? (
            <div className="readback" role="status">
              <strong>Silvia leu de volta:</strong>
              <p>{rehearsal.readBack}</p>
            </div>
          ) : null}
          {error ? (
            <p className="error-message" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <div className="dashboard-side">
          <OrderCard order={currentOrder} />
          <Timeline events={currentEvents} />
        </div>
      </div>

      <section className="safety-strip" aria-label="Proteções da Silvia">
        <article>
          <span aria-hidden="true">01</span>
          <div>
            <strong>Ela lê tudo de volta</strong>
            <p>Itens, taxa, total, endereço e forma de pagamento.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">02</span>
          <div>
            <strong>Uma confirmação, uma tentativa</strong>
            <p>Alterou o pedido? A confirmação antiga deixa de valer.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">03</span>
          <div>
            <strong>A família enxerga o caminho</strong>
            <p>Cada passo fica visível, sem guardar dados sensíveis.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
