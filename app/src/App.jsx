import { useEffect, useState } from "react";
import { base44 } from "./api/base44Client";
import Dashboard from "./components/Dashboard";
import { rehearsalTranscript } from "./lib/presentation";

function Login({ checking }) {
  return (
    <main className="login-shell" lang="pt-BR">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <section className="login-card">
        <div className="brand-mark large" aria-hidden="true">
          S
        </div>
        <p className="eyebrow">Sua assistente no WhatsApp</p>
        <h1>Silvia</h1>
        <p className="login-promise">
          Peça por voz. A Silvia só faz o pedido quando você confirma.
        </p>
        <div className="boundary-card">
          <span aria-hidden="true">✓</span>
          <p>
            <strong>Você mantém o controle.</strong>
            Ela lê itens, taxas e total antes de qualquer ação.
          </p>
        </div>
        <button
          className="primary-action login-action"
          type="button"
          disabled={checking}
          onClick={() =>
            base44.auth.loginWithProvider("google", window.location.href)
          }
        >
          <span className="google-g" aria-hidden="true">
            G
          </span>
          {checking ? "Verificando acesso…" : "Entrar com Google"}
        </button>
        <small className="privacy-note">
          Área reservada para familiares e cuidadores.
        </small>
      </section>
    </main>
  );
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [rehearsal, setRehearsal] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  async function loadDashboard() {
    const [nextOrders, nextEvents] = await Promise.all([
      base44.entities.OrderDraft.list("-created_date", 20),
      base44.entities.AuditEvent.list("-occurred_at", 50),
    ]);
    setOrders(nextOrders);
    setEvents(nextEvents);
  }

  useEffect(() => {
    let disposed = false;
    let unsubscribeOrders = () => {};
    let unsubscribeEvents = () => {};

    async function boot() {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          if (!disposed) setChecking(false);
          return;
        }

        const caregiver = await base44.auth.me();
        await loadDashboard();
        if (disposed) return;
        setUser(caregiver);
        setChecking(false);
        unsubscribeOrders = base44.entities.OrderDraft.subscribe(() => {
          void loadDashboard();
        });
        unsubscribeEvents = base44.entities.AuditEvent.subscribe(() => {
          void loadDashboard();
        });
      } catch {
        if (!disposed) {
          setError("Não foi possível carregar a área da família.");
          setChecking(false);
        }
      }
    }

    void boot();
    return () => {
      disposed = true;
      unsubscribeOrders();
      unsubscribeEvents();
    };
  }, []);

  async function rehearse() {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("rehearse-order", {
        transcript: rehearsalTranscript,
      });
      setRehearsal(response.data);
      setConfirmationMessage("");
      await loadDashboard();
    } catch (caught) {
      const code = caught?.response?.data?.error;
      setError(
        code === "confirmation_not_configured"
          ? "A proteção de confirmação ainda não foi ativada no ambiente."
          : "O ensaio não terminou. Nada foi pedido ou cobrado.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (
      !rehearsal?.orderId ||
      !rehearsal?.confirmationToken ||
      !rehearsal?.senderPhoneHash
    ) {
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const response = await base44.functions.invoke("confirm-order", {
        action: "confirm",
        orderId: rehearsal.orderId,
        token: rehearsal.confirmationToken,
        senderPhoneHash: rehearsal.senderPhoneHash,
        source: "dashboard_rehearsal",
      });
      setConfirmationMessage(
        response.data.kind === "ordered"
          ? "Demonstração concluída. Nenhum pedido real foi enviado."
          : "Esse pedido já tinha sido processado.",
      );
      await loadDashboard();
    } catch {
      setError(
        "A confirmação não foi aceita. Nenhum pedido foi enviado ou repetido.",
      );
    } finally {
      setConfirming(false);
    }
  }

  if (!user) return <Login checking={checking} />;

  return (
    <Dashboard
      user={user}
      orders={orders}
      events={events}
      busy={busy}
      error={error}
      rehearsal={rehearsal}
      confirmationMessage={confirmationMessage}
      confirming={confirming}
      onRehearse={rehearse}
      onConfirm={confirm}
      onLogout={() => base44.auth.logout(window.location.href)}
    />
  );
}
