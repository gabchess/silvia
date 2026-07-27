# Silvia proof map

| Claim | Evidence | Result |
| --- | --- | --- |
| Fresh Base44 app | Ignored `app/base44/.app.jsonc`; deployed app `6a67c3c8b80c051fdec7df73` | Verified |
| Custom frontend | `app/src/App.jsx`, `app/src/components`, `app/src/index.css` | Deployed |
| Base44 backend depth | Four entities, three Deno functions, one agent, auth, real-time subscriptions | Deployed |
| Portuguese priced draft | `prepareOrder`, `DemoConnector`, deployed R$51,70 rehearsal | Verified live |
| Full read-back | Deployed UI showed items, R$6,90 fee, R$51,70 total, address, payment | Verified live |
| Signed confirmation | `app/base44/shared/confirmation.ts`; seven negative binding tests | Passed |
| Exactly one checkout | Compare-and-set claims in `confirmation-service.ts`; race test | Passed |
| Safe demo receipt | `DemoConnector.checkout()` returns `demo_ordered` | Verified live |
| Caregiver access | Google auth plus caregiver-scoped entity RLS | Verified live |
| Real-time audit | Base44 subscriptions update ordered state and timeline | Verified live |
| Meta authenticity | HMAC test plus deployed `meta-webhook` | Passed and deployed |
| Runtime compatibility | Deno check for all function entries | Passed |
| Frontend quality | Vitest, ESLint, Vite build, browser visual check | Passed |
| Live iFood claim | Explicitly cut; fallback fails closed; license preserved | Honest non-claim |

## Final commands

```text
npm test
  10 files passed
  28 tests passed

npm run lint
  exit 0

npm run build
  exit 0

deno check base44/functions/rehearse-order/entry.ts
           base44/functions/meta-webhook/entry.ts
           base44/functions/confirm-order/entry.ts
  exit 0
```

## Deployment proof

- Dashboard:
  <https://app.base44.com/apps/6a67c3c8b80c051fdec7df73/editor/workspace/overview>
- Public app: <https://silvia-dec7df73.base44.app>
- Deployed resources: four entities, three functions, one agent, auth config,
  public visibility, and the built site
- Smoke test: Google sign-in, rehearsal, read-back, confirmation, ordered
  state, and audit events all completed on the public app

No contest submission or real purchase was made while collecting this proof.
