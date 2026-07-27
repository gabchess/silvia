export const rehearsalTranscript =
  "Silvia, quero dois hambúrgueres sem cebola e uma coca sem açúcar";

const statusLabels = {
  received: "Mensagem recebida",
  transcribing: "Ouvindo o áudio",
  interpreting: "Entendendo o pedido",
  clarifying: "Precisa de um detalhe",
  preparing: "Montando o pedido",
  awaiting_confirmation: "Aguardando confirmação",
  editing: "Alterando o pedido",
  expired: "Confirmação vencida",
  confirmed: "Confirmado",
  checkout_in_progress: "Enviando pedido",
  ordered: "Pedido concluído",
  checkout_failed: "Envio não concluído",
  needs_help: "Precisa de ajuda",
  cancelled: "Cancelado",
};

const eventLabels = {
  rehearsal_received: "Pedido de demonstração recebido",
  awaiting_confirmation: "Pedido pronto para conferir",
  confirmation_received: "Confirmação recebida",
  checkout_claimed: "Envio iniciado uma única vez",
  demo_ordered: "Demonstração concluída",
  ordered: "Demonstração concluída",
};

export function formatMoney(cents = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function statusLabel(status) {
  return statusLabels[status] ?? "Atualização do pedido";
}

export function eventLabel(eventType) {
  return eventLabels[eventType] ?? "Pedido atualizado";
}

export function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
