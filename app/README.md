# Silvia application

React frontend and Base44 backend for Silvia's safe food-order rehearsal.

The public contest path is deliberately a demonstration: it uses a fictional
restaurant, cash on delivery, and a receipt marked `demo_ordered`. The Meta
WhatsApp and ElevenLabs adapters require the owner's authorized credentials.
No live iFood connector is deployed.

The film-proof rehearsal uses Cozinha da Praça, salmão grelhado com legumes,
suco de laranja, a R$6,90 delivery fee, and a R$66,70 total. It remains a
labelled demo and waits for an order-specific confirmation.

## Development

Requirements: Node 20.19+, Socket CLI, Deno, and a linked Base44 app.

```bash
socket npm ci
npm test
npm run lint
npm run build
deno check base44/functions/*/entry.ts
```

Copy `.env.example` only for local configuration. Never commit secret values.

## Deployment

```bash
npx base44@latest deploy -y
```

See the repository root README for architecture, safety boundaries, proof, and
the judge walkthrough.
