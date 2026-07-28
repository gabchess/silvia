import {
  Check,
  CircleCheckBig,
  Mic2,
  PencilLine,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { formatMoney, rehearsalTranscript } from "../lib/presentation";

function VoiceWaveform() {
  const bars = [12, 22, 16, 30, 20, 36, 14, 27, 18, 32, 15, 24, 12, 19];

  return (
    <div className="voice-waveform" aria-hidden="true">
      {bars.map((height, index) => (
        <span key={index} style={{ height }} />
      ))}
    </div>
  );
}

function OrderReadback({ order, readBack }) {
  const items = order.normalized_items ?? [];
  const pricing = order.pricing ?? {};

  return (
    <>
      <p className="message-copy">
        {readBack ??
          `Encontrei tudo no ${order.merchant?.name ?? "restaurante"}. Confira antes de confirmar:`}
      </p>
      <ul className="chat-order-list" aria-label="Resumo do pedido">
        {items.map((item, index) => (
          <li key={item.id ?? `${item.displayName}-${index}`}>
            <span>{item.quantity}×</span>
            <div>
              <strong>{item.displayName ?? item.spokenName}</strong>
              {item.modifiers?.length ? (
                <small>{item.modifiers.join(", ")}</small>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="chat-total">
        <span>Total com entrega</span>
        <strong>{formatMoney(pricing.total_cents)}</strong>
      </div>
      <div className="chat-boundary">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Nada acontece até você escolher confirmar.</span>
      </div>
    </>
  );
}

export default function ConversationStage({
  order,
  rehearsal,
  busy,
  confirming,
  editing,
  error,
  confirmationMessage,
  canConfirm,
  onRehearse,
  onConfirm,
  onEdit,
}) {
  const isCurrentRehearsal = rehearsal?.orderId === order?.id;
  const isFinished = order?.status === "ordered";
  const isEditing = order?.status === "editing";

  return (
    <section
      className="conversation-stage"
      aria-labelledby="conversation-title"
    >
      <header className="conversation-header">
        <div className="conversation-person">
          <div className="silvia-avatar" aria-hidden="true">
            S
          </div>
          <div>
            <h2 id="conversation-title">Silvia</h2>
            <p>
              <span aria-hidden="true" /> pronta para ajudar Dona Maria
            </p>
          </div>
        </div>
        <span className="browser-demo-label">Simulação no navegador</span>
      </header>

      <div className="conversation-canvas" aria-live="polite">
        <span className="conversation-day">Hoje</span>

        <article className="message-row message-row-user">
          <div className="message-bubble user-message">
            <p className="message-sender">Dona Maria</p>
            <div className="voice-note">
              <span className="voice-play" aria-hidden="true">
                <Mic2 size={18} />
              </span>
              <VoiceWaveform />
              <span className="voice-duration">0:08</span>
            </div>
            <p className="voice-transcript">“{rehearsalTranscript}”</p>
          </div>
        </article>

        {busy ? (
          <article className="message-row">
            <div className="message-bubble silvia-message typing-message">
              <p className="message-sender">Silvia</p>
              <div className="typing-line" aria-label="Silvia está preparando">
                <span />
                <span />
                <span />
              </div>
              <p>Ouvindo, conferindo preços e montando a leitura de volta…</p>
            </div>
          </article>
        ) : null}

        {!busy && order ? (
          <article className="message-row">
            <div className="message-bubble silvia-message">
              <p className="message-sender">Silvia</p>
              <OrderReadback
                order={order}
                readBack={isCurrentRehearsal ? rehearsal.readBack : null}
              />

              {canConfirm ? (
                <div className="conversation-actions">
                  <button
                    className="chat-confirm"
                    type="button"
                    onClick={onConfirm}
                    disabled={confirming || editing}
                  >
                    <Check size={20} aria-hidden="true" />
                    {confirming ? "Confirmando uma vez…" : "Confirmar pedido"}
                  </button>
                  <button
                    className="chat-edit"
                    type="button"
                    onClick={onEdit}
                    disabled={confirming || editing}
                  >
                    <PencilLine size={18} aria-hidden="true" />
                    {editing ? "Abrindo alteração…" : "Alterar"}
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ) : null}

        {!busy && !order ? (
          <div className="conversation-ready">
            <span>
              <Play size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>A conversa está pronta.</strong>
              <p>
                Reproduza o fluxo completo com um cardápio fictício e dados
                reais no Base44.
              </p>
            </div>
          </div>
        ) : null}

        {confirmationMessage ? (
          <article className="message-row">
            <div className="message-bubble completion-message">
              <CircleCheckBig size={22} aria-hidden="true" />
              <div>
                <p className="message-sender">
                  {isFinished ? "Demonstração concluída" : "Pedido pausado"}
                </p>
                <p>{confirmationMessage}</p>
              </div>
            </div>
          </article>
        ) : null}

        {error ? (
          <div className="conversation-error" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <footer className="conversation-footer">
        <button
          className="demo-trigger"
          type="button"
          onClick={onRehearse}
          disabled={busy || confirming || editing}
        >
          {order ? (
            <RotateCcw size={19} aria-hidden="true" />
          ) : (
            <Play size={19} fill="currentColor" aria-hidden="true" />
          )}
          {busy
            ? "Montando o pedido…"
            : order && !isEditing
              ? "Recomeçar demonstração"
              : isEditing
                ? "Gravar nova mensagem"
                : "Reproduzir demonstração"}
        </button>
        <p>
          Cardápio fictício · nenhuma compra ou cobrança real
        </p>
      </footer>
    </section>
  );
}
