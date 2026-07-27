# Silvia Assisted Ordering — Design Specification

Date: 2026-07-27
Status: Approved design, pending written-spec review
Primary event: Base44 Dev Build-Off 2026
Submission deadline: 2026-07-28 23:59 PDT / 2026-07-29 03:59 BRT

## 1. Product thesis

Silvia is a trusted WhatsApp assistant for older adults. A person sends a
Portuguese voice note describing what they want. Silvia interprets it, prepares
an order, reads back the exact merchant, items, fees, address, payment mode, and
total, and waits. Silvia cannot place the order until the same WhatsApp user
taps a signed, order-specific confirmation button.

The hackathon build proves one narrow claim:

> An older adult can prepare and safely confirm a food order through a familiar
> WhatsApp voice conversation without learning another app.

The product is not a general autonomous agent. It is a trusted conversation
surface backed by domain-specific actions and hard approval gates.

## 2. Actors and needs

### Older adult

- Uses WhatsApp already.
- Prefers voice to forms, menus, or account switching.
- Needs concise replies, large tap targets, and plain Brazilian Portuguese.
- Must remain the final authority for any purchase.

### Trusted caregiver

- Signs into a small web dashboard.
- Sees order status and a redacted audit trail in real time.
- Can help when the speech, merchant, address, payment, or connector is
  ambiguous.
- Cannot silently approve an order on the older adult's behalf in the
  hackathon version.

### Hackathon judge

- Must see that Base44 is the operational backend, not a decorative database.
- Must understand the trust boundary in under one minute.
- Must be able to run or watch a reliable end-to-end demonstration even when
  the unofficial iFood interface is unavailable.

### External systems

- Meta WhatsApp Cloud API receives and sends WhatsApp messages.
- ElevenLabs transcribes Portuguese audio and may synthesize the read-back.
- Base44 stores state, runs functions and the order interpreter, authenticates
  caregivers, hosts the dashboard, and publishes real-time changes.
- The optional iFood adapter searches merchants, builds carts, and can submit a
  confirmed order.

## 3. Success and non-goals

### Done when

1. A Portuguese WhatsApp voice note reaches a validated order draft end to end.
2. The caregiver dashboard shows the conversation and order state through a
   Base44 real-time subscription.
3. Silvia sends a complete read-back with `Confirmar pedido` and `Alterar`
   actions.
4. A forged, stale, duplicated, expired, or cart-mismatched confirmation cannot
   call checkout.
5. A valid confirmation can call the selected connector exactly once.
6. Live iFood search or cart failure switches visibly to the deterministic demo
   connector without breaking the demo.
7. Focused tests, the full test suite, lint, and the production build pass.
8. A clean browser session can use the deployed dashboard.
9. The repository contains no secrets and includes every required license and
   attribution notice.
10. The demo, README, and submission state which parts are live, simulated,
    reused, and original.

### Non-goals for the Base44 submission

- US delivery services or English localization
- Web3 wallets or payments
- Card-number, CVV, banking, or OTP storage
- Medication purchase or medical guidance
- Voice biometrics or claims of identity verification
- Recurring or scheduled autonomous purchases
- More than one older-adult profile and one caregiver
- A general-purpose assistant
- A Glaze entry

## 4. Chosen approach

Silvia uses a hybrid connector architecture:

- The real path uses WhatsApp voice messages and the live iFood adapter.
- The stable path uses the same application interfaces with deterministic
  transcript, catalog, cart, and checkout fixtures.
- The UI always labels the active connector as `live` or `demo`.
- Connector fallback never converts into a real checkout.

This approach preserves the strongest judge-visible flow while preventing an
unofficial private API from becoming a single point of demo failure.

Rejected alternatives:

- A fully live iFood build has more spectacle but can fail because of token
  expiry, private API changes, bot detection, merchant payment support, or
  network latency.
- A concierge-only mock is reliable but does not prove a meaningful commerce
  integration.

## 5. System architecture

```text
WhatsApp user
  -> Meta webhook
  -> verified Base44 ingress function
  -> audio fetch and short-lived storage
  -> ElevenLabs transcription
  -> Base44 order interpreter
  -> connector selection
     -> live iFood adapter
     -> deterministic demo adapter
  -> immutable order draft
  -> WhatsApp read-back and signed actions
  -> deterministic confirmation service
  -> one checkout attempt

Base44 entities
  -> real-time subscription
  -> authenticated caregiver dashboard
```

### 5.1 WhatsApp ingress

Responsibilities:

- Answer Meta's webhook verification challenge.
- Verify Meta's webhook signature before processing a message.
- Accept only the configured WhatsApp test number and allowlisted sender.
- Deduplicate by Meta message ID.
- Download voice media through Meta's authenticated media endpoint.
- Persist only the minimum media metadata needed for diagnosis.

The ingress function does not interpret orders or call commerce tools. It
creates an inbound event and invokes the orchestration boundary.

### 5.2 Transcription

The transcription interface accepts audio bytes and locale `pt-BR`, then
returns:

- transcript text;
- provider name;
- provider request ID when available;
- confidence or uncertainty markers when the provider supplies them;
- elapsed time.

ElevenLabs is the primary implementation. The deterministic implementation
returns fixture transcripts for integration tests and the emergency demo path.
Raw audio is deleted after successful transcription or after a short
time-to-live. Logs never contain audio bytes or access URLs.

### 5.3 Order interpreter

A Base44 AI agent converts the transcript into a strict order-intent schema:

```text
items[]:
  spoken_name
  quantity
  modifiers[]
merchant_preference?
category
delivery_or_pickup
notes?
ambiguities[]
language
```

The agent has no checkout, payment, or confirmation tool. Its output is
untrusted until schema validation passes.

Silvia asks at most one clarification per turn. If the order remains ambiguous
after two clarification turns, it moves to `needs_help` rather than guessing.

### 5.4 Commerce connector

Both connector implementations conform to the same boundary:

```text
search(intent, profile) -> candidates
buildDraft(candidate, intent, profile) -> priced draft
checkout(confirmedDraft, idempotencyKey) -> receipt
```

The live adapter uses the separately deployed HTTP transport from
`AriOliv/ifood-mcp`. Base44 stores only an opaque connection identifier. iFood
tokens remain in the adapter's in-memory token store.

The deterministic adapter uses a small, local catalog and produces a
clearly-labelled demo receipt. It never contacts iFood and never charges or
orders anything.

The orchestrator may fall back from `live.search` or `live.buildDraft` to the
demo connector. It may never fall back from a failed live checkout to any
checkout. Checkout failure requires human review.

### 5.5 Order draft and read-back

The priced draft is immutable. Its canonical fields are hashed:

- sender phone hash;
- merchant identifier and name;
- item identifiers, quantities, modifiers, and prices;
- fees, discount, and total;
- delivery address identifier;
- payment mode;
- connector mode;
- expiry timestamp.

Silvia sends a plain-language summary and two WhatsApp actions:

- `Confirmar pedido`
- `Alterar`

If voice synthesis is available, Silvia also sends a Portuguese audio
read-back. Text remains mandatory and authoritative.

### 5.6 Confirmation service

The confirmation token is:

- random and unguessable;
- stored only as a hash;
- bound to the sender, order draft hash, total, connector mode, and expiry;
- single use;
- invalidated by any edit;
- invalidated after a checkout attempt, whether checkout succeeds or fails.

Only the deterministic confirmation service can call `checkout`. The language
model cannot call, wrap, or indirectly invoke that service.

A valid confirmation must also satisfy:

- sender matches the draft;
- state is `awaiting_confirmation`;
- draft has not expired;
- total is at or below the configured cap;
- connector mode has not changed;
- idempotency key has not been spent.

Live checkout defaults to disabled. It can be enabled only after its focused
negative tests and a low-value manual rehearsal pass. Payment is limited to a
merchant-supported pay-on-delivery method; otherwise Silvia hands the user to
the official iFood checkout instead of handling payment credentials.

### 5.7 Caregiver dashboard

The custom React/Vite frontend contains one focused screen:

- current state and active connector;
- redacted transcript;
- proposed merchant, items, fees, and total;
- clarification and confirmation timeline;
- connector or transcription errors;
- an explicit `needs_help` state;
- an audit-event feed updated through Base44 subscriptions.

Base44 authentication protects the dashboard. The frontend cannot use service
role credentials or call checkout.

## 6. Base44 data model

### `SeniorProfile`

- `display_name`
- `phone_hash`
- `locale`
- `saved_address_label`
- `caregiver_user_id`
- `spend_cap_brl`
- `sender_allowlisted`

### `OrderDraft`

- `meta_message_id`
- `profile_id`
- `transcript_redacted`
- `normalized_items`
- `merchant`
- `pricing`
- `address_label`
- `payment_mode`
- `connector_mode`
- `draft_hash`
- `status`
- `expires_at`
- `confirmed_at`
- `checkout_attempted_at`
- `receipt`
- `failure_code`

### `Confirmation`

- `order_draft_id`
- `token_hash`
- `bound_draft_hash`
- `sender_phone_hash`
- `expires_at`
- `used_at`
- `invalidated_at`

### `AuditEvent`

- `order_draft_id`
- `event_type`
- `actor_type`
- `connector_mode`
- `redacted_metadata`
- `occurred_at`

Base44's built-in `User` entity represents the caregiver. Row-level rules limit
the caregiver to the linked profile and orders.

## 7. State machine

```text
received
  -> transcribing
  -> interpreting
  -> clarifying
  -> preparing
  -> awaiting_confirmation
     -> editing -> preparing
     -> expired
     -> confirmed
        -> checkout_in_progress
           -> ordered
           -> checkout_failed

Any pre-checkout state
  -> needs_help
  -> cancelled
```

Invariants:

- `ordered` has exactly one spent idempotency key and one connector receipt.
- `confirmed` requires a fresh confirmation bound to the current draft hash.
- `editing` invalidates every active confirmation.
- `checkout_failed` cannot retry automatically.
- `demo` connector orders cannot be described as live orders.
- Status transitions are append-only audit events even when the current
  `OrderDraft.status` field changes.

## 8. Failure behavior

| Failure | Behavior |
| --- | --- |
| Invalid Meta signature | Return an authorization error and write no order |
| Duplicate Meta message | Return success without repeating work |
| Unsupported media | Ask for a voice note or short text |
| Transcription timeout | Retry once, then use fixture only in explicit demo mode |
| Low-confidence or invalid interpretation | Ask one concise clarification |
| No merchant or item match | Offer up to three alternatives |
| iFood search/cart failure | Switch visibly to demo mode before confirmation |
| Draft changed after read-back | Invalidate confirmation and send a new summary |
| Expired or forged action | Explain that the order changed or expired |
| Spend cap exceeded | Move to `needs_help`; do not expose checkout |
| Checkout timeout or error | Mark `checkout_failed`; never retry automatically |
| Dashboard unavailable | WhatsApp safety flow continues; audit events remain stored |

## 9. Security and privacy limits

- Verify external webhook signatures before parsing bodies.
- Treat transcripts, model output, merchant content, and reply text as
  untrusted input.
- Validate all AI output against an allowlisted schema.
- Hash phone numbers in product entities and redact them in logs.
- Keep API keys in Base44 secrets or the adapter host's secret store.
- Keep iFood tokens outside Base44 and never print them.
- Store no card, CVV, banking, or OTP data.
- Use constant-time comparison for confirmation token hashes where supported.
- Apply bounded payload sizes and request timeouts at external boundaries.
- Redact prompt-injection-like merchant or message content before it reaches
  system instructions.
- Run secret, dependency, license, and obvious security scans before push and
  deployment.

## 10. Test and proof strategy

### Unit proofs

- Strict order-intent validation
- Canonical draft hashing
- Token generation, binding, expiry, and single use
- State-transition allowlist
- Spend-cap enforcement
- Message and checkout idempotency
- Connector contract equivalence
- Log redaction

### Integration proofs

- Fixture voice webhook to order draft
- Clarification to revised draft
- Draft to read-back action payload
- Valid confirmation to exactly one demo checkout
- Duplicate webhook to no duplicate draft
- Forged, stale, expired, edited, or mismatched confirmation to zero checkout
- Live connector failure to visibly labelled demo fallback
- Live checkout failure to no retry

### Runtime proofs

- Real WhatsApp test-number voice message
- Real Portuguese transcription
- Live iFood search and cart when credentials and the private API are healthy
- Realtime authenticated caregiver dashboard
- Deployed clean-browser check with no material console errors
- Two-to-three-minute recorded demo using a rehearsed deterministic script

### Repository proofs

- Fresh Base44 project created during the Build Period
- Public baseline and original delta recorded
- Clean install, test, lint, and production build
- Secret scan
- License and notice check
- README claim audit against runtime behavior

## 11. Reuse ledger

### iFood MCP adapter

- Source: https://github.com/AriOliv/ifood-mcp
- Pinned source commit:
  `887c73c9a01701d3fa8e5d15ea75e4b53bacbc6a`
- License: MIT
- Permitted use: standalone optional adapter or selected adapted code with the
  copyright and license notice retained.
- Existing capability: iFood OTP login, search, catalogs, carts, and checkout.
- Silvia's original delta: WhatsApp voice UX, Base44 orchestration, immutable
  draft and confirmation protocol, caregiver console, fallback connector,
  state machine, and safety evidence.
- Material limit: unofficial consumer API; private endpoints can change and may
  trigger bot detection.

### Meta Jasper's Market

- Source:
  https://github.com/fbsamples/whatsapp-business-jaspers-market
- Pinned source commit:
  `cace07a34204df46ef98c56811d7e54c1a9fc5e2`
- License: Apache-2.0
- Permitted use: reference or selected webhook and interactive-message
  patterns with notices retained and changed files identified.
- Existing capability: WhatsApp Business sample and commerce conversation
  patterns.
- Silvia's original delta: voice-driven order interpretation, Base44 backend,
  iFood connector boundary, confirmation invariants, and caregiver workflow.

The project starts from a fresh Base44 CLI repository rather than disguising a
fork. The public README will link both sources and distinguish reused
capabilities from Silvia's work.

## 12. Rubric fit

| Base44 criterion | Silvia evidence |
| --- | --- |
| Backend depth and technical execution | Entities, row rules, Deno functions, AI agent, real-time subscriptions, auth, storage, and external integrations |
| Frontend creativity and surface | WhatsApp is the primary client; the web UI is a caregiver console |
| Real-world usefulness | Older adults use an interface they already know and retain purchase authority |
| Polish and completeness | End-to-end voice flow, explicit errors, fallback mode, live dashboard, and rehearsed demo |
| Write-up and documentation | Architecture, source ledger, safety invariants, proof map, and honest limitations |

## 13. Delivery and authority

The user authorized product decisions, implementation, push, and deployment by
asking the agent to run the full engineering loop and ship the build.

The contest submission remains a separate irreversible authority gate. The
agent prepares every submission asset and stops before the final submit action
unless the user grants it explicitly.

Any real food purchase or live checkout rehearsal is also a separate spend
gate and requires explicit user approval for the exact order and amount.

## 14. Roadmap after the hackathon

Silvia remains one familiar WhatsApp contact while each new domain gets its own
tools, data boundary, and approval policy.

### Ordering reliability

- Remember favourites and repeat past orders
- Add or remove items conversationally
- Show coupons without changing the order silently
- Track delivery and explain delays
- Renew expired commerce sessions without losing the draft
- Support grocery substitutions
- Measure latency, transcription cost, and cost per completed order

### Family and accessibility

- Multiple trusted caregivers with clear roles
- Caregiver approval above a spending threshold
- Portuguese regional accents, English, and Spanish
- Text-only fallback, slower audio, and accessible confirmation controls
- Fraud alerts for a new phone, address, or unusual order
- US connectors such as DoorDash or Instacart when official access permits

### Trusted daily assistance

- Shopping lists and household reminders
- Appointment and transportation preparation
- Read-only expense capture and simple budgeting summaries
- Bill reminders without autonomous payment
- Forms and service navigation with human review before submission

Medical purchasing, financial transactions, and identity-sensitive actions are
not added as generic agent tools. Each requires a separate design, risk review,
and explicit human approval boundary.

## 15. Source ledger

- Source inspiration and replies:
  https://x.com/yashaswini_s_s/status/2079919241298608639
- Base44 competition:
  https://backendcompetition.base44.app/
- Base44 backend functions:
  https://docs.base44.com/developers/backend/resources/backend-functions/overview
- Base44 entities and real-time data:
  https://docs.base44.com/developers/backend/resources/entities/overview
- Base44 AI agents:
  https://docs.base44.com/developers/references/sdk/docs/interfaces/agents
- iFood official developer documentation:
  https://developer.ifood.com.br/en-US/docs/getting-started
- iFood developer terms:
  https://developer.ifood.com.br/pt-BR/docs/getting-started/documentation/terms-of-use
- Glaze ineligibility evidence:
  https://www.glaze.app/awards/terms
