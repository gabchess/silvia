# Silvia

Silvia helps an older adult ask for food by voice, hear the full order back,
and confirm it without leaving WhatsApp.

[Open the live Base44 app](https://silvia-dec7df73.base44.app)

## Why this exists

Most delivery apps assume small type, several screens, saved cards, and comfort
with changing interfaces. Many older adults already know one interface well:
conversation.

Silvia turns this flow into a chat:

1. The person sends a Portuguese voice note.
2. Silvia transcribes and interprets the request.
3. A commerce connector builds a priced, immutable draft.
4. Silvia reads back every item, fee, total, delivery address, and payment
   method.
5. The person or caregiver confirms that exact draft.
6. One valid confirmation permits one checkout attempt.

The language model never receives a checkout tool.

## Try the deployed demo

1. Sign in with Google.
2. Select **Ensaiar pedido por voz**.
3. Read Silvia's R$51,70 order summary.
4. Select **Confirmar pedido de demonstração**.
5. Watch the order and audit timeline update in real time.

The rehearsal uses a fictional restaurant and creates a receipt marked
`demo`. It does not contact iFood, buy food, or charge money.

## Built with Base44

This project started from a fresh Base44 CLI app and uses:

- Base44 hosting for the React caregiver experience
- Base44 Google authentication
- four Base44 entities with caregiver-scoped row access
- three Base44 Deno functions for rehearsal, Meta webhooks, and confirmation
- a tool-free Base44 AI agent for strict Portuguese order interpretation
- Base44 real-time entity subscriptions for the caregiver timeline
- Base44 secrets for confirmation signing and disabled live checkout

The app ID remains in the CLI-managed, ignored `.app.jsonc` file.

## Safety model

- **Exact read-back:** Items, modifiers, fee, total, address, and payment mode
  appear before confirmation.
- **Bound confirmation:** The random token is hashed with the draft hash,
  sender hash, total, connector mode, expiry, and a server secret.
- **Changed means invalid:** Any changed field produces a different draft hash.
- **Exactly one attempt:** A compare-and-set state claim moves one request from
  `confirmed` to `checkout_in_progress`.
- **No automatic retry:** A checkout failure is terminal.
- **Spend cap:** The order must fit the senior profile's caregiver-set limit.
- **No payment secrets:** Silvia stores no card number, CVV, bank credential,
  OTP, raw phone number, or iFood token.
- **Fail closed:** Live checkout is off unless a separate server setting and
  an authorized commerce connector both exist.

## WhatsApp status

The Meta webhook path is implemented and deployed. It verifies
`X-Hub-Signature-256`, deduplicates Meta message IDs, limits audio to 10 MB,
uses ElevenLabs Scribe v2 for Portuguese, validates agent output with Zod, and
sends bound WhatsApp buttons.

Meta and ElevenLabs account credentials are not included in this repository or
the public demo. The browser rehearsal is the contest proof path.

## Architecture

```text
WhatsApp voice note                Caregiver web rehearsal
        |                                   |
        v                                   v
  meta-webhook                         rehearse-order
        |                                   |
        +----------> prepareOrder <----------+
                          |
                  immutable demo draft
                          |
                signed confirmation record
                          |
              confirm-order / Meta button
                          |
               atomic checkout state claim
                          |
                 labelled demo receipt
                          |
              Base44 real-time dashboard
```

Pure TypeScript modules live in `app/base44/shared` so Base44 bundles them with
each backend function. Thin files in `app/base44/lib` preserve fast Vitest
imports without putting server startup code in the test process.

## Local development

Requirements: Node 20.19 or newer, Socket CLI, Deno, and a linked Base44 app.

```bash
cd app
socket npm ci
npm test
npm run lint
npm run build
deno check base44/functions/*/entry.ts
```

Deploy from the built `app` directory:

```bash
npx base44@latest deploy -y
```

Secret names are documented in `app/.env.example`. Never commit their values.

## Current proof

- 28 tests pass across 10 files.
- ESLint passes.
- The Vite production build passes.
- Deno checks all three backend functions.
- Base44 deployed four entities, three functions, one agent, auth, visibility,
  and the site.
- A deployed smoke test completed Google sign-in, draft creation, R$51,70
  read-back, confirmation, one demo checkout, and the ordered timeline.

See [the proof map](docs/proof-map.md) and
[the 90-second demo script](docs/demo-script.md).

## Live commerce decision

We reviewed the MIT-licensed
[AriOliv/ifood-mcp](https://github.com/AriOliv/ifood-mcp) project and preserved
its license. We did not deploy an unofficial consumer-session gateway or claim
an official iFood integration. The reason and upgrade gate are in
[the live gateway decision](docs/live-gateway-cut.md).

## Roadmap

The same trusted chat can later help with grocery reorders, plate nutrition
estimates, simple expense tracking, medication reminders, ride requests, bill
explanations, and caregiver alerts. Each action should keep Silvia's core rule:
read it back, wait for consent, and show the family what happened.

## Inspiration and attribution

The product direction was inspired by
[Yashaswini's WhatsApp assistant for her dadi](https://x.com/yashaswini_s_s/status/2079919241298608639).
Dependency and research credits are recorded in
[ATTRIBUTIONS.md](ATTRIBUTIONS.md).
