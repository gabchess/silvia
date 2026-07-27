# Base44 hackathon submission draft

## Project name

Silvia

## One-line pitch

A trusted WhatsApp assistant that helps older adults order food by voice, reads
every charge back, and waits for an exact confirmation.

## Short description

Silvia turns food ordering into a conversation an older adult already knows.
Send a Portuguese voice note, hear the items, fee, total, address, and payment
method, then confirm that exact draft. A caregiver sees the full state and
audit trail in real time. In the real WhatsApp path, only the same sender can
confirm. The caregiver can drive a separate, clearly labelled demo rehearsal.

The model can interpret an order but cannot buy anything. Confirmation is
signed to the sender, draft hash, total, connector mode, and expiry. A
compare-and-set state claim permits one checkout attempt and no automatic
retry.

## What we built

- A responsive React caregiver experience deployed on Base44
- Google authentication for family access
- `SeniorProfile`, `OrderDraft`, `Confirmation`, and `AuditEvent` entities
  with row-level access rules
- `rehearse-order`, `meta-webhook`, and `confirm-order` Base44 functions
- A Base44 AI agent that returns strict Portuguese order JSON and has no tools
- Real-time Base44 subscriptions for order state and audit events
- Meta webhook verification, a 256 KB request cap, bounded media download, and
  WhatsApp buttons
- Atomic per-senior delivery claims and Meta message-ID deduplication
- Bearer-token forwarding restricted to HTTPS URLs on Meta-controlled hosts
- ElevenLabs Scribe v2 integration for Portuguese voice notes
- An immutable order draft, bound confirmation token, spend cap, and
  exactly-once demo checkout

## Why it matters

Delivery apps make many older adults adapt to small type, changing screens, and
payment flows. Silvia adapts the interface to them. Conversation lowers the
learning burden, while read-back and caregiver visibility keep the person in
control.

## Base44 features used

Hosting, CLI project creation, Google auth, entities, row-level security,
secrets, Deno functions, AI agents, real-time subscriptions, and public
deployment.

## Demo disclosure

The contest flow uses a fictional restaurant and a receipt marked
`demo_ordered`. It does not buy food or claim a live iFood integration. The
Meta and ElevenLabs paths are deployed but need the owner's authorized account
credentials before a WhatsApp number can go live.

## Links

- Live app: <https://silvia-dec7df73.base44.app>
- Base44 dashboard:
  <https://app.base44.com/apps/6a67c3c8b80c051fdec7df73/editor/workspace/overview>
- Technical proof: `docs/proof-map.md`
- Demo script: `docs/demo-script.md`
- Public repository: added after publication

## Judge walkthrough

1. Open the live app and sign in with Google.
2. Select **Ensaiar pedido por voz**.
3. Check the items, R$6,90 fee, R$51,70 total, address, payment method, and
   demo label.
4. Select **Confirmar pedido de demonstração**.
5. Watch the ordered state and audit timeline update.

## Suggested categories

AI agents, accessibility, consumer, social impact, commerce, and family care.

## Team note

Built in Brazil for older adults and the family members who help them.
