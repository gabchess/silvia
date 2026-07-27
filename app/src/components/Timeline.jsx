import { eventLabel, timeLabel } from "../lib/presentation";

export default function Timeline({ events }) {
  return (
    <section className="timeline-panel" aria-labelledby="timeline-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Registro claro</p>
          <h2 id="timeline-title">O que a Silvia fez</h2>
        </div>
        <span className="live-label">
          <span aria-hidden="true" /> Ao vivo
        </span>
      </div>

      {events.length ? (
        <ol className="timeline">
          {events.slice(0, 5).map((event) => (
            <li key={event.id ?? `${event.event_type}-${event.occurred_at}`}>
              <span className="timeline-dot" aria-hidden="true" />
              <div>
                <strong>{eventLabel(event.event_type)}</strong>
                <small>
                  {timeLabel(event.occurred_at)} ·{" "}
                  {event.actor_type === "caregiver"
                    ? "Familiar"
                    : "Silvia"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-timeline">
          As ações aparecem aqui sem telefone, endereço completo ou dados de
          pagamento.
        </p>
      )}
    </section>
  );
}
