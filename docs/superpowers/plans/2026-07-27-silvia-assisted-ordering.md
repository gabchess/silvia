# Silvia Assisted Ordering Implementation Plan

> **Historical plan:** The implementation diverged where the live iFood path
> could not be shipped honestly. The repository README, proof map, and design
> specification describe the verified contest scope. No live iFood connector
> is deployed, and all commerce in the public proof is labelled demo.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Base44-backed WhatsApp assistant that converts a Portuguese voice note into a priced food-order draft, requires a signed order-specific confirmation, and shows the complete state in a real-time caregiver dashboard.

**Architecture:** A fresh Base44 React template supplies hosting, auth, entities, Deno functions, an AI agent, and real-time subscriptions. Pure TypeScript domain modules enforce state, hashing, confirmation, and connector rules; thin Base44 functions adapt those modules to WhatsApp, ElevenLabs, persistence, and commerce. A deterministic connector proves the complete path first, while a separately deployed, attributed iFood gateway adds live search and cart only after the reliable path is green.

**Tech Stack:** Node.js 20.19+, React, Vite, Tailwind CSS, Base44 CLI and SDK, Deno backend functions, Vitest, Testing Library, Zod, Meta WhatsApp Cloud API, ElevenLabs Scribe, optional Node iFood gateway adapted from `AriOliv/ifood-mcp`.

## Global Constraints

- Create the Base44 project through `npx base44@latest create` during the contest Build Period and retain its valid App ID locally in ignored `base44/.app.jsonc`.
- Work inside `app/`; repository-level specifications, proof, attribution, and submission files stay at the repository root.
- Detect the lockfile before every install. For the generated npm project, use `socket npm install`; never use bare `npm install`.
- Primary language and copy are Brazilian Portuguese. The hackathon supports one older-adult profile, one saved address, and one caregiver.
- The language model has no checkout, payment, confirmation, or arbitrary function tool.
- Live checkout defaults to disabled and requires both passing negative tests and explicit spend approval for the exact order and amount.
- Never store card numbers, CVVs, banking credentials, OTP values, raw iFood tokens, or unredacted phone numbers in Base44 entities or logs.
- Any demo connector state is labelled `demo`; it must never be described as a live iFood order.
- A changed draft invalidates prior confirmation. A checkout failure never retries automatically.
- Pin and preserve the MIT notice for `ifood-mcp` commit `887c73c9a01701d3fa8e5d15ea75e4b53bacbc6a`.
- Pin and preserve the Apache-2.0 notice for Meta Jasper's Market commit `cace07a34204df46ef98c56811d7e54c1a9fc5e2` when any code is carried.
- Push and deployment are authorized. Contest submission and any real purchase remain separate authority gates.

## File Structure

```text
app/
  base44/
    auth/config.jsonc
    agents/order_interpreter.jsonc
    entities/
      SeniorProfile.jsonc
      OrderDraft.jsonc
      Confirmation.jsonc
      AuditEvent.jsonc
    functions/
      rehearseOrder/entry.ts
      metaWebhook/entry.ts
      confirmOrder/entry.ts
    lib/
      contracts.ts
      canonical.ts
      state-machine.ts
      confirmation.ts
      intent-schema.ts
      connectors.ts
      demo-connector.ts
      orchestrator.ts
      checkout.ts
      whatsapp.ts
      transcription.ts
  src/
    App.jsx
    api/base44Client.js
    components/
      Dashboard.jsx
      OrderCard.jsx
      Timeline.jsx
    lib/presentation.js
    index.css
  tests/
    setup.js
    app.test.jsx
    domain/
      canonical.test.ts
      state-machine.test.ts
      confirmation.test.ts
      connectors.test.ts
      orchestrator.test.ts
    functions/
      meta-webhook.test.ts
      confirm-order.test.ts
    resources.test.ts
  .env.example
  package.json
  package-lock.json
services/
  ifood-gateway/
    api/index.ts
    src/client.ts
    tests/client.test.ts
    package.json
    package-lock.json
    vercel.json
LICENSES/
  ifood-mcp-MIT.txt
  whatsapp-business-jaspers-market-Apache-2.0.txt
docs/
  demo-script.md
  proof-map.md
README.md
ATTRIBUTIONS.md
```

Each `base44/lib` module is pure and independently testable. Function entry
files only verify transport input, create a Base44 client, call one domain
operation, persist the result, and format a response. The frontend consumes
entities and never imports backend secrets or checkout code.

---

### Task 1: Fresh Base44 project and test harness

**Files:**
- Create through CLI: `app/**`
- Modify: `app/package.json`
- Modify: `app/vite.config.js`
- Modify: `app/src/App.jsx`
- Create: `app/tests/setup.js`
- Create: `app/tests/app.test.jsx`
- Create: `app/.env.example`

**Interfaces:**
- Consumes: Base44 CLI authentication and the `backend-and-client` template.
- Produces: a valid Base44 App ID, a React/Vite app, `npm test`, `npm run lint`, and `npm run build`.

- [ ] **Step 1: Confirm the required runtime and create the contest project**

Run:

```bash
node --version
npx base44@latest whoami
npx base44@latest create silvia --path ./app --template backend-and-client
```

Expected: Node is at least `20.19.0`; `app/base44/.app.jsonc` exists; the
command prints the Base44 project and live-site identifiers. If `whoami`
requires browser authentication, complete `npx base44@latest login` and rerun
the three commands.

- [ ] **Step 2: Detect the generated lockfile and add only the test dependencies**

Run:

```bash
test -f app/package-lock.json
cd app
socket npm install zod
socket npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `package-lock.json` remains the only package-manager lockfile and
Socket reports no install blocker.

- [ ] **Step 3: Write the failing brand smoke test**

Create `app/tests/setup.js`:

```js
import "@testing-library/jest-dom/vitest";
```

Create `app/tests/app.test.jsx`:

```jsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Silvia shell", () => {
  it("states the promise and confirmation boundary", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /silvia/i })).toBeInTheDocument();
    expect(screen.getByText(/só faz o pedido quando você confirma/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/app.test.jsx
```

Expected: FAIL because the generated template does not contain Silvia's copy.

- [ ] **Step 5: Configure Vitest and implement the smallest branded shell**

Add these scripts to `app/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "build": "vite build"
  }
}
```

Add this `test` entry inside `defineConfig` in `app/vite.config.js`:

```js
test: {
  environment: "jsdom",
  setupFiles: "./tests/setup.js",
},
```

Replace the generated `App` body with:

```jsx
export default function App() {
  return (
    <main lang="pt-BR">
      <p>Sua assistente no WhatsApp</p>
      <h1>Silvia</h1>
      <p>Peça por voz. A Silvia só faz o pedido quando você confirma.</p>
    </main>
  );
}
```

Create `app/.env.example` with names only:

```dotenv
META_VERIFY_TOKEN=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_GRAPH_VERSION=
ELEVENLABS_API_KEY=
IFOOD_GATEWAY_URL=
IFOOD_GATEWAY_SHARED_SECRET=
CONFIRMATION_PEPPER=
ENABLE_LIVE_CHECKOUT=false
```

- [ ] **Step 6: Verify and commit the foundation**

Run:

```bash
cd app
npm test
npm run lint
npm run build
cd ..
git add app
git commit -m "Create Silvia Base44 application"
```

Expected: all three checks pass; `base44/.app.jsonc` is ignored and absent from
the commit.

---

### Task 2: Domain contracts, canonical drafts, and state machine

**Files:**
- Create: `app/base44/lib/contracts.ts`
- Create: `app/base44/lib/canonical.ts`
- Create: `app/base44/lib/state-machine.ts`
- Create: `app/tests/domain/canonical.test.ts`
- Create: `app/tests/domain/state-machine.test.ts`

**Interfaces:**
- Consumes: none beyond Web Platform APIs.
- Produces: `OrderIntent`, `PricedDraft`, `OrderStatus`, `canonicalize()`, `draftHash()`, and `transition()`.

- [ ] **Step 1: Write failing canonicalization and transition tests**

Create `app/tests/domain/canonical.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canonicalize, draftHash } from "../../base44/lib/canonical";

describe("canonical draft", () => {
  it("hashes equal values identically regardless of key insertion order", async () => {
    const a = { total: 4590, merchant: { id: "m1", name: "Lanche da Praça" } };
    const b = { merchant: { name: "Lanche da Praça", id: "m1" }, total: 4590 };
    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(await draftHash(a)).toBe(await draftHash(b));
  });
});
```

Create `app/tests/domain/state-machine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { transition } from "../../base44/lib/state-machine";

describe("order state machine", () => {
  it("allows the confirmed checkout path", () => {
    expect(transition("awaiting_confirmation", "confirmed")).toBe("confirmed");
    expect(transition("confirmed", "checkout_in_progress")).toBe("checkout_in_progress");
  });

  it("rejects checkout before confirmation and retries after failure", () => {
    expect(() => transition("preparing", "checkout_in_progress")).toThrow("invalid transition");
    expect(() => transition("checkout_failed", "checkout_in_progress")).toThrow("invalid transition");
  });
});
```

- [ ] **Step 2: Run both tests and record red evidence**

Run:

```bash
cd app
npx vitest run tests/domain/canonical.test.ts tests/domain/state-machine.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Define the exact shared contracts**

Create `app/base44/lib/contracts.ts`:

```ts
export type ConnectorMode = "demo" | "live";

export type OrderStatus =
  | "received"
  | "transcribing"
  | "interpreting"
  | "clarifying"
  | "preparing"
  | "awaiting_confirmation"
  | "editing"
  | "expired"
  | "confirmed"
  | "checkout_in_progress"
  | "ordered"
  | "checkout_failed"
  | "needs_help"
  | "cancelled";

export type OrderItem = {
  id: string;
  spokenName: string;
  displayName: string;
  quantity: number;
  modifiers: string[];
  unitPriceCents: number;
};

export type OrderIntent = {
  items: Array<Pick<OrderItem, "spokenName" | "quantity" | "modifiers">>;
  merchantPreference?: string;
  category: "food" | "grocery";
  deliveryOrPickup: "delivery" | "pickup";
  notes?: string;
  ambiguities: string[];
  language: "pt-BR";
};

export type PricedDraft = {
  senderPhoneHash: string;
  merchant: { id: string; name: string };
  items: OrderItem[];
  subtotalCents: number;
  feeCents: number;
  discountCents: number;
  totalCents: number;
  addressId: string;
  addressLabel: string;
  paymentMode: "cash_on_delivery" | "handoff";
  connectorMode: ConnectorMode;
  expiresAt: string;
};

export type ConnectorReceipt = {
  connectorMode: ConnectorMode;
  externalId: string;
  status: "demo_ordered" | "ordered";
};
```

- [ ] **Step 4: Implement deterministic canonicalization and hashing**

Create `app/base44/lib/canonical.ts`:

```ts
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, normalize(child)]),
    );
  }
  return value;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function draftHash(value: unknown): Promise<string> {
  return sha256Hex(canonicalize(value));
}
```

- [ ] **Step 5: Implement the explicit state transition allowlist**

Create `app/base44/lib/state-machine.ts`:

```ts
import type { OrderStatus } from "./contracts.ts";

const allowed: Record<OrderStatus, OrderStatus[]> = {
  received: ["transcribing", "needs_help", "cancelled"],
  transcribing: ["interpreting", "needs_help", "cancelled"],
  interpreting: ["clarifying", "preparing", "needs_help", "cancelled"],
  clarifying: ["interpreting", "needs_help", "cancelled"],
  preparing: ["awaiting_confirmation", "needs_help", "cancelled"],
  awaiting_confirmation: ["editing", "expired", "confirmed", "cancelled"],
  editing: ["preparing", "cancelled"],
  expired: [],
  confirmed: ["checkout_in_progress"],
  checkout_in_progress: ["ordered", "checkout_failed"],
  ordered: [],
  checkout_failed: [],
  needs_help: ["cancelled"],
  cancelled: [],
};

export function transition(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!allowed[from].includes(to)) {
    throw new Error(`invalid transition: ${from} -> ${to}`);
  }
  return to;
}
```

- [ ] **Step 6: Verify and commit the domain foundation**

Run:

```bash
cd app
npx vitest run tests/domain/canonical.test.ts tests/domain/state-machine.test.ts
npm test
cd ..
git add app/base44/lib app/tests/domain
git commit -m "Define Silvia order domain"
```

Expected: focused and full tests pass.

---

### Task 3: Confirmation tokens and exactly-once claim logic

**Files:**
- Create: `app/base44/lib/confirmation.ts`
- Create: `app/tests/domain/confirmation.test.ts`

**Interfaces:**
- Consumes: `sha256Hex()` from Task 2.
- Produces: `issueConfirmation()`, `verifyConfirmation()`, `ConfirmationBinding`, and `claimFilter()`.

- [ ] **Step 1: Write failing confirmation tests**

Create `app/tests/domain/confirmation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  issueConfirmation,
  verifyConfirmation,
  claimFilter,
} from "../../base44/lib/confirmation";

describe("confirmation boundary", () => {
  it("accepts one exact unexpired binding", async () => {
    const issued = await issueConfirmation({
      draftHash: "draft-a",
      senderPhoneHash: "phone-a",
      totalCents: 4590,
      connectorMode: "demo",
      expiresAt: "2030-01-01T00:00:00.000Z",
      pepper: "test-pepper",
    });
    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: issued.binding,
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("rejects a token after the draft changes", async () => {
    const issued = await issueConfirmation({
      draftHash: "draft-a",
      senderPhoneHash: "phone-a",
      totalCents: 4590,
      connectorMode: "demo",
      expiresAt: "2030-01-01T00:00:00.000Z",
      pepper: "test-pepper",
    });
    expect(
      await verifyConfirmation({
        token: issued.token,
        tokenHash: issued.tokenHash,
        binding: { ...issued.binding, draftHash: "draft-b" },
        pepper: "test-pepper",
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("rejects forged and expired tokens", async () => {
    const issued = await issueConfirmation({
      draftHash: "draft-a",
      senderPhoneHash: "phone-a",
      totalCents: 4590,
      connectorMode: "demo",
      expiresAt: "2030-01-01T00:00:00.000Z",
      pepper: "test-pepper",
    });
    expect(await verifyConfirmation({
      token: "forged",
      tokenHash: issued.tokenHash,
      binding: issued.binding,
      pepper: "test-pepper",
      now: new Date("2029-01-01T00:00:00.000Z"),
    })).toBe(false);
    expect(await verifyConfirmation({
      token: issued.token,
      tokenHash: issued.tokenHash,
      binding: issued.binding,
      pepper: "test-pepper",
      now: new Date("2030-01-01T00:00:00.000Z"),
    })).toBe(false);
  });

  it.each([
    { senderPhoneHash: "phone-b" },
    { totalCents: 4591 },
    { connectorMode: "live" as const },
  ])("rejects a mismatched binding: %o", async (changed) => {
    const issued = await issueConfirmation({
      draftHash: "draft-a",
      senderPhoneHash: "phone-a",
      totalCents: 4590,
      connectorMode: "demo",
      expiresAt: "2030-01-01T00:00:00.000Z",
      pepper: "test-pepper",
    });
    expect(await verifyConfirmation({
      token: issued.token,
      tokenHash: issued.tokenHash,
      binding: { ...issued.binding, ...changed },
      pepper: "test-pepper",
      now: new Date("2029-01-01T00:00:00.000Z"),
    })).toBe(false);
  });

  it("claims only a confirmed order with no prior attempt", () => {
    expect(claimFilter("order-1")).toEqual({
      id: "order-1",
      status: "confirmed",
      checkout_attempted_at: { $exists: false },
    });
  });
});
```

- [ ] **Step 2: Run the test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/domain/confirmation.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement signed binding and constant-work hash comparison**

Create `app/base44/lib/confirmation.ts`:

```ts
import { canonicalize, sha256Hex } from "./canonical.ts";
import type { ConnectorMode } from "./contracts.ts";

export type ConfirmationBinding = {
  draftHash: string;
  senderPhoneHash: string;
  totalCents: number;
  connectorMode: ConnectorMode;
  expiresAt: string;
};

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function boundHash(
  token: string,
  binding: ConfirmationBinding,
  pepper: string,
): Promise<string> {
  return sha256Hex(`${pepper}.${token}.${canonicalize(binding)}`);
}

function fixedLengthEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function issueConfirmation(input: ConfirmationBinding & {
  pepper: string;
}): Promise<{
  token: string;
  tokenHash: string;
  binding: ConfirmationBinding;
}> {
  const { pepper, ...binding } = input;
  const token = randomToken();
  return {
    token,
    tokenHash: await boundHash(token, binding, pepper),
    binding,
  };
}

export async function verifyConfirmation(input: {
  token: string;
  tokenHash: string;
  binding: ConfirmationBinding;
  pepper: string;
  now: Date;
}): Promise<boolean> {
  if (input.now.getTime() >= new Date(input.binding.expiresAt).getTime()) {
    return false;
  }
  const candidate = await boundHash(input.token, input.binding, input.pepper);
  return fixedLengthEqual(candidate, input.tokenHash);
}

export function claimFilter(orderId: string): Record<string, unknown> {
  return {
    id: orderId,
    status: "confirmed",
    checkout_attempted_at: { $exists: false },
  };
}
```

- [ ] **Step 4: Verify and commit the confirmation boundary**

Run:

```bash
cd app
npx vitest run tests/domain/confirmation.test.ts
npm test
cd ..
git add app/base44/lib/confirmation.ts app/tests/domain/confirmation.test.ts
git commit -m "Enforce order confirmation boundary"
```

Expected: all tests pass.

---

### Task 4: Base44 entities, auth, and tool-free order interpreter

**Files:**
- Create: `app/base44/entities/SeniorProfile.jsonc`
- Create: `app/base44/entities/OrderDraft.jsonc`
- Create: `app/base44/entities/Confirmation.jsonc`
- Create: `app/base44/entities/AuditEvent.jsonc`
- Create: `app/base44/auth/config.jsonc`
- Create: `app/base44/agents/order_interpreter.jsonc`
- Create: `app/tests/resources.test.ts`

**Interfaces:**
- Consumes: Base44 JSON schemas and agent configuration.
- Produces: `SeniorProfile`, `OrderDraft`, `Confirmation`, and `AuditEvent` entity registries plus agent `order_interpreter`.

- [ ] **Step 1: Write a failing resource contract test**

Create `app/tests/resources.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function resource(path: string) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
}

describe("Base44 resources", () => {
  it("defines the four product entities", () => {
    for (const name of ["SeniorProfile", "OrderDraft", "Confirmation", "AuditEvent"]) {
      expect(resource(`base44/entities/${name}.jsonc`).name).toBe(name);
    }
  });

  it("keeps the order interpreter away from functions", () => {
    const agent = resource("base44/agents/order_interpreter.jsonc");
    expect(agent.name).toBe("order_interpreter");
    expect(agent.tool_configs).toEqual([]);
    expect(agent.instructions).toMatch(/JSON/);
  });
});
```

- [ ] **Step 2: Run the resource test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/resources.test.ts
```

Expected: FAIL because the resource files do not exist.

- [ ] **Step 3: Create the profile and order schemas**

Create `SeniorProfile.jsonc` with this exact security shape:

```json
{
  "name": "SeniorProfile",
  "type": "object",
  "title": "Senior Profile",
  "properties": {
    "display_name": { "type": "string", "minLength": 1, "maxLength": 80 },
    "phone_hash": { "type": "string", "minLength": 64, "maxLength": 64 },
    "locale": { "type": "string", "enum": ["pt-BR"], "default": "pt-BR" },
    "saved_address_id": { "type": "string", "maxLength": 120 },
    "saved_address_label": { "type": "string", "maxLength": 240 },
    "caregiver_user_id": { "type": "string" },
    "spend_cap_brl": { "type": "number", "minimum": 0, "maximum": 500 },
    "sender_allowlisted": { "type": "boolean", "default": false }
  },
  "required": ["display_name", "phone_hash", "locale", "caregiver_user_id", "spend_cap_brl", "sender_allowlisted"],
  "rls": {
    "create": false,
    "read": { "data.caregiver_user_id": "{{user.id}}" },
    "update": { "data.caregiver_user_id": "{{user.id}}" },
    "delete": false
  }
}
```

Create `OrderDraft.jsonc`:

```json
{
  "name": "OrderDraft",
  "type": "object",
  "title": "Order Draft",
  "properties": {
    "meta_message_id": { "type": "string", "maxLength": 200 },
    "profile_id": { "type": "string" },
    "caregiver_user_id": { "type": "string" },
    "transcript_redacted": { "type": "string", "maxLength": 3000 },
    "normalized_items": { "type": "array", "items": { "type": "object" } },
    "merchant": { "type": "object" },
    "pricing": { "type": "object" },
    "address_label": { "type": "string", "maxLength": 240 },
    "payment_mode": { "type": "string", "enum": ["cash_on_delivery", "handoff"] },
    "connector_mode": { "type": "string", "enum": ["demo", "live"] },
    "draft_hash": { "type": "string", "minLength": 64, "maxLength": 64 },
    "status": { "type": "string" },
    "expires_at": { "type": "string", "format": "date-time" },
    "confirmed_at": { "type": "string", "format": "date-time" },
    "checkout_attempted_at": { "type": "string", "format": "date-time" },
    "receipt": { "type": "object" },
    "failure_code": { "type": "string", "maxLength": 120 }
  },
  "required": ["meta_message_id", "profile_id", "caregiver_user_id", "normalized_items", "connector_mode", "draft_hash", "status", "expires_at"],
  "rls": {
    "create": false,
    "read": { "data.caregiver_user_id": "{{user.id}}" },
    "update": false,
    "delete": false
  }
}
```

- [ ] **Step 4: Create the protected confirmation and audit schemas**

Create `Confirmation.jsonc`:

```json
{
  "name": "Confirmation",
  "type": "object",
  "title": "Confirmation",
  "properties": {
    "order_draft_id": { "type": "string" },
    "caregiver_user_id": { "type": "string" },
    "token_hash": { "type": "string", "minLength": 64, "maxLength": 64 },
    "bound_draft_hash": { "type": "string", "minLength": 64, "maxLength": 64 },
    "sender_phone_hash": { "type": "string", "minLength": 64, "maxLength": 64 },
    "total_cents": { "type": "integer", "minimum": 0 },
    "connector_mode": { "type": "string", "enum": ["demo", "live"] },
    "expires_at": { "type": "string", "format": "date-time" },
    "used_at": { "type": "string", "format": "date-time" },
    "invalidated_at": { "type": "string", "format": "date-time" }
  },
  "required": ["order_draft_id", "token_hash", "bound_draft_hash", "sender_phone_hash", "total_cents", "connector_mode", "expires_at"],
  "rls": { "create": false, "read": false, "update": false, "delete": false }
}
```

Create `AuditEvent.jsonc`:

```json
{
  "name": "AuditEvent",
  "type": "object",
  "title": "Audit Event",
  "properties": {
    "order_draft_id": { "type": "string" },
    "caregiver_user_id": { "type": "string" },
    "event_type": { "type": "string", "maxLength": 120 },
    "actor_type": { "type": "string", "enum": ["senior", "caregiver", "system", "connector"] },
    "connector_mode": { "type": "string", "enum": ["demo", "live"] },
    "redacted_metadata": { "type": "object" },
    "occurred_at": { "type": "string", "format": "date-time" }
  },
  "required": ["order_draft_id", "caregiver_user_id", "event_type", "actor_type", "connector_mode", "occurred_at"],
  "rls": {
    "create": false,
    "read": { "data.caregiver_user_id": "{{user.id}}" },
    "update": false,
    "delete": false
  }
}
```

- [ ] **Step 5: Configure caregiver auth and a tool-free interpreter**

Create `app/base44/auth/config.jsonc`:

```json
{
  "enableUsernamePassword": true,
  "enableGoogleLogin": false,
  "enableMicrosoftLogin": false,
  "enableFacebookLogin": false,
  "enableAppleLogin": false,
  "googleOAuthMode": "default",
  "googleOAuthClientId": null
}
```

Create `app/base44/agents/order_interpreter.jsonc`:

```json
{
  "name": "order_interpreter",
  "description": "Converts one Brazilian Portuguese food-order message into strict order JSON.",
  "instructions": "Return JSON only. Shape: {items:[{spoken_name:string,quantity:number,modifiers:string[]}],merchant_preference?:string,category:'food'|'grocery',delivery_or_pickup:'delivery'|'pickup',notes?:string,ambiguities:string[],language:'pt-BR'}. Never invent a merchant, item, price, address, payment method, or quantity. Put missing or conflicting details in ambiguities. Do not call tools or claim an order was placed.",
  "model": "openai/gpt-4o-mini",
  "tool_configs": [],
  "whatsapp_greeting": "Oi, eu sou a Silvia. Pode me contar por áudio o que você quer pedir."
}
```

- [ ] **Step 6: Validate locally and commit the resources**

Run:

```bash
cd app
npx vitest run tests/resources.test.ts
npx base44@latest types generate
npm test
cd ..
git add app/base44 app/tests/resources.test.ts
git commit -m "Define Silvia Base44 resources"
```

Expected: the resource test passes and `base44/.types/types.d.ts` contains all
four entity names plus `order_interpreter`.

---

### Task 5: Connector contract and deterministic complete flow

**Files:**
- Create: `app/base44/lib/connectors.ts`
- Create: `app/base44/lib/demo-connector.ts`
- Create: `app/base44/lib/orchestrator.ts`
- Create: `app/base44/functions/rehearseOrder/entry.ts`
- Create: `app/tests/domain/connectors.test.ts`
- Create: `app/tests/domain/orchestrator.test.ts`

**Interfaces:**
- Consumes: `OrderIntent`, `PricedDraft`, `ConnectorReceipt`, `draftHash()`, `issueConfirmation()`.
- Produces: `CommerceConnector`, `DemoConnector`, `prepareOrder()`, and HTTP function `rehearseOrder`.

- [ ] **Step 1: Write the failing connector contract test**

Create `app/tests/domain/connectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";

describe("demo connector", () => {
  it("prices a known Portuguese order and labels the receipt demo", async () => {
    const connector = new DemoConnector();
    const candidates = await connector.search(
      {
        items: [{ spokenName: "hambúrguer", quantity: 2, modifiers: ["sem cebola"] }],
        category: "food",
        deliveryOrPickup: "delivery",
        ambiguities: [],
        language: "pt-BR",
      },
      { senderPhoneHash: "p", addressId: "a", addressLabel: "Casa" },
    );
    const draft = await connector.buildDraft(candidates[0], {
      senderPhoneHash: "p",
      addressId: "a",
      addressLabel: "Casa",
    });
    expect(draft.connectorMode).toBe("demo");
    expect(draft.totalCents).toBeGreaterThan(0);
    expect((await connector.checkout(draft, "once")).status).toBe("demo_ordered");
  });
});
```

- [ ] **Step 2: Run the connector test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/domain/connectors.test.ts
```

Expected: FAIL because the connector files do not exist.

- [ ] **Step 3: Define the connector boundary**

Create `app/base44/lib/connectors.ts`:

```ts
import type {
  ConnectorReceipt,
  OrderIntent,
  PricedDraft,
} from "./contracts.ts";

export type OrderProfile = {
  senderPhoneHash: string;
  addressId: string;
  addressLabel: string;
};

export type Candidate = {
  merchant: { id: string; name: string };
  intent: OrderIntent;
};

export interface CommerceConnector {
  readonly mode: "demo" | "live";
  search(intent: OrderIntent, profile: OrderProfile): Promise<Candidate[]>;
  buildDraft(candidate: Candidate, profile: OrderProfile): Promise<PricedDraft>;
  checkout(draft: PricedDraft, idempotencyKey: string): Promise<ConnectorReceipt>;
}
```

- [ ] **Step 4: Implement the deterministic connector**

Create `app/base44/lib/demo-connector.ts` with one merchant, three catalog
items, a fixed R$6.90 fee, a 20-minute expiry, and this public surface:

```ts
export class DemoConnector implements CommerceConnector {
  readonly mode = "demo" as const;

  async search(intent: OrderIntent): Promise<Candidate[]> {
    return [{ merchant: { id: "demo-praca", name: "Lanche da Praça" }, intent }];
  }

  async buildDraft(candidate: Candidate, profile: OrderProfile): Promise<PricedDraft> {
    const items = candidate.intent.items.map((item, index) => ({
      id: `demo-item-${index + 1}`,
      spokenName: item.spokenName,
      displayName: item.spokenName,
      quantity: item.quantity,
      modifiers: item.modifiers,
      unitPriceCents: item.spokenName.toLowerCase().includes("coca") ? 700 : 1890,
    }));
    const subtotalCents = items.reduce(
      (total, item) => total + item.quantity * item.unitPriceCents,
      0,
    );
    return {
      senderPhoneHash: profile.senderPhoneHash,
      merchant: candidate.merchant,
      items,
      subtotalCents,
      feeCents: 690,
      discountCents: 0,
      totalCents: subtotalCents + 690,
      addressId: profile.addressId,
      addressLabel: profile.addressLabel,
      paymentMode: "cash_on_delivery",
      connectorMode: "demo",
      expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    };
  }

  async checkout(_draft: PricedDraft, idempotencyKey: string): Promise<ConnectorReceipt> {
    return {
      connectorMode: "demo",
      externalId: `demo-${idempotencyKey}`,
      status: "demo_ordered",
    };
  }
}
```

- [ ] **Step 5: Write a failing orchestrator test**

Create `app/tests/domain/orchestrator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";
import { prepareOrder } from "../../base44/lib/orchestrator";

describe("prepareOrder", () => {
  it("returns an immutable draft and a bound confirmation", async () => {
    const result = await prepareOrder({
      intent: {
        items: [{ spokenName: "hambúrguer", quantity: 2, modifiers: [] }],
        category: "food",
        deliveryOrPickup: "delivery",
        ambiguities: [],
        language: "pt-BR",
      },
      profile: { senderPhoneHash: "p", addressId: "a", addressLabel: "Casa" },
      connector: new DemoConnector(),
      confirmationPepper: "test-pepper",
    });
    expect(result.draftHash).toHaveLength(64);
    expect(result.confirmation.binding.draftHash).toBe(result.draftHash);
    expect(result.readBack).toMatch(/Confirmar pedido/);
  });
});
```

- [ ] **Step 6: Implement order preparation**

Create `app/base44/lib/orchestrator.ts`:

```ts
import { draftHash } from "./canonical.ts";
import { issueConfirmation } from "./confirmation.ts";
import type { CommerceConnector, OrderProfile } from "./connectors.ts";
import type { OrderIntent } from "./contracts.ts";

export async function prepareOrder(input: {
  intent: OrderIntent;
  profile: OrderProfile;
  connector: CommerceConnector;
  confirmationPepper: string;
}) {
  if (input.intent.ambiguities.length > 0) {
    return { kind: "clarification" as const, questions: input.intent.ambiguities.slice(0, 3) };
  }
  const candidates = await input.connector.search(input.intent, input.profile);
  if (candidates.length === 0) throw new Error("no_candidates");
  const draft = await input.connector.buildDraft(candidates[0], input.profile);
  const hash = await draftHash(draft);
  const confirmation = await issueConfirmation({
    draftHash: hash,
    senderPhoneHash: draft.senderPhoneHash,
    totalCents: draft.totalCents,
    connectorMode: draft.connectorMode,
    expiresAt: draft.expiresAt,
    pepper: input.confirmationPepper,
  });
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const itemSummary = draft.items
    .map((item) => `${item.quantity}x ${item.displayName}${
      item.modifiers.length ? ` (${item.modifiers.join(", ")})` : ""
    }`)
    .join("; ");
  return {
    kind: "draft" as const,
    draft,
    draftHash: hash,
    confirmation,
    readBack: `Seu pedido na ${draft.merchant.name}: ${itemSummary}. ` +
      `Taxa ${money.format(draft.feeCents / 100)}. ` +
      `Total ${money.format(draft.totalCents / 100)}. ` +
      `Entrega em ${draft.addressLabel}, pagamento na entrega. ` +
      "Confira e toque em Confirmar pedido ou Alterar.",
  };
}
```

- [ ] **Step 7: Add an authenticated rehearsal function**

Create `app/base44/functions/rehearseOrder/entry.ts`. It must:

1. call `createClientFromRequest(req)`;
2. require `await base44.auth.me()`;
3. accept `{ transcript: string }`;
4. use a fixed parser only when `transcript` matches the rehearsal phrase;
5. call `prepareOrder()` with `DemoConnector`;
6. persist `OrderDraft`, `Confirmation`, and two `AuditEvent` records through
   `base44.asServiceRole.entities`;
7. return `{ orderId, draftHash, readBack, confirmationToken, connectorMode }`.

Use this adapter shape so authentication, persistence, and the domain operation
remain separate:

```ts
import { createClientFromRequest } from "npm:@base44/sdk";
import { DemoConnector } from "../../lib/demo-connector.ts";
import { prepareOrder } from "../../lib/orchestrator.ts";

export async function handleRehearsal(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  const base44 = createClientFromRequest(req);
  const caregiver = await base44.auth.me();
  if (!caregiver) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pepper = Deno.env.get("CONFIRMATION_PEPPER");
  if (!pepper) {
    return Response.json({ error: "confirmation_not_configured" }, { status: 503 });
  }
  const { transcript } = await req.json();
  if (transcript.trim().toLowerCase() !==
      "silvia, quero dois hambúrgueres sem cebola e uma coca sem açúcar") {
    return Response.json({ error: "unsupported_rehearsal_phrase" }, { status: 422 });
  }
  // Load the caregiver's one SeniorProfile, call prepareOrder, then persist
  // the draft, confirmation, and audit events in that order.
}

Deno.serve(handleRehearsal);
```

Use this fixed rehearsal interpretation:

```ts
const rehearsalIntent = {
  items: [
    { spokenName: "hambúrguer", quantity: 2, modifiers: ["sem cebola"] },
    { spokenName: "Coca sem açúcar", quantity: 1, modifiers: [] },
  ],
  category: "food",
  deliveryOrPickup: "delivery",
  ambiguities: [],
  language: "pt-BR",
} as const;
```

The function must read `CONFIRMATION_PEPPER`; when absent, return HTTP 503 with
`{ "error": "confirmation_not_configured" }`.

- [ ] **Step 8: Verify and commit the complete deterministic preparation path**

Run:

```bash
cd app
npx vitest run tests/domain/connectors.test.ts tests/domain/orchestrator.test.ts
npm test
npm run build
cd ..
git add app/base44 app/tests/domain
git commit -m "Build deterministic Silvia order flow"
```

Expected: all tests and the production build pass.

---

### Task 6: Verified WhatsApp voice ingress and read-back

**Files:**
- Create: `app/base44/lib/whatsapp.ts`
- Create: `app/base44/lib/transcription.ts`
- Create: `app/base44/functions/metaWebhook/entry.ts`
- Create: `app/tests/functions/meta-webhook.test.ts`

**Interfaces:**
- Consumes: Meta webhook headers/body, ElevenLabs audio transcription, `prepareOrder()`, Base44 service-role entities.
- Produces: GET webhook verification, POST message processing, and WhatsApp interactive read-back.

- [ ] **Step 1: Write failing transport-security tests**

Create `app/tests/functions/meta-webhook.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  verifyMetaSignature,
  extractVoiceMessage,
  confirmationButtons,
} from "../../base44/lib/whatsapp";

describe("Meta webhook boundary", () => {
  it("rejects a forged signature", async () => {
    expect(
      await verifyMetaSignature(
        new TextEncoder().encode('{"entry":[]}'),
        "sha256=00",
        "app-secret",
      ),
    ).toBe(false);
  });

  it("deduplicates around Meta's message id", () => {
    const message = extractVoiceMessage({
      entry: [{ changes: [{ value: { messages: [{
        id: "wamid.1",
        from: "5511999990000",
        type: "audio",
        audio: { id: "media.1", mime_type: "audio/ogg" },
      }] } }] }],
    });
    expect(message).toEqual({
      messageId: "wamid.1",
      sender: "5511999990000",
      mediaId: "media.1",
      mimeType: "audio/ogg",
    });
  });

  it("binds both buttons to the order token", () => {
    expect(confirmationButtons("order-1", "token-1")[0].reply.id)
      .toBe("confirm:order-1:token-1");
  });
});
```

- [ ] **Step 2: Run the webhook test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/functions/meta-webhook.test.ts
```

Expected: FAIL because `whatsapp.ts` does not exist.

- [ ] **Step 3: Implement signature verification, parsing, and interactive payloads**

Create `app/base44/lib/whatsapp.ts` with:

```ts
export async function verifyMetaSignature(
  rawBody: Uint8Array,
  signature: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signature?.startsWith("sha256=") || !appSecret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, rawBody);
  const expected = `sha256=${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return mismatch === 0;
}

export function confirmationButtons(orderId: string, token: string) {
  return [
    { type: "reply", reply: { id: `confirm:${orderId}:${token}`, title: "Confirmar pedido" } },
    { type: "reply", reply: { id: `edit:${orderId}:${token}`, title: "Alterar" } },
  ];
}
```

Also export:

```ts
extractVoiceMessage(payload: unknown): {
  messageId: string;
  sender: string;
  mediaId: string;
  mimeType: string;
} | null
```

It must return `null` unless every nested collection and field exists and the
message type is `audio`.

- [ ] **Step 4: Implement external API helpers with bounded requests**

Create `app/base44/lib/transcription.ts` with:

```ts
export async function transcribePtBr(input: {
  audio: Uint8Array;
  mimeType: string;
  apiKey: string;
  timeoutMs?: number;
}): Promise<{ text: string; provider: "elevenlabs"; elapsedMs: number }> {
  const started = Date.now();
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("language_code", "por");
  form.append("file", new Blob([input.audio], { type: input.mimeType }), "voice.ogg");
  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": input.apiKey },
    body: form,
    signal: AbortSignal.timeout(input.timeoutMs ?? 12_000),
  });
  if (!response.ok) throw new Error(`transcription_${response.status}`);
  const body = await response.json();
  return { text: String(body.text ?? ""), provider: "elevenlabs", elapsedMs: Date.now() - started };
}
```

In `whatsapp.ts`, add `downloadMetaMedia()` and `sendInteractiveReadBack()`.
Both require `META_GRAPH_VERSION` from the environment rather than hard-coding
a version. Set a 10-second timeout, never log tokens or media URLs, and reject
media over 10 MB before transcription.

- [ ] **Step 5: Define and use the strict agent-output boundary**

Create `app/base44/lib/intent-schema.ts`:

```ts
import { z } from "npm:zod";

export const orderIntentSchema = z.object({
  items: z.array(z.object({
    spoken_name: z.string().min(1).max(160),
    quantity: z.number().int().min(1).max(20),
    modifiers: z.array(z.string().max(120)).max(12),
  })).min(1).max(20),
  merchant_preference: z.string().max(160).optional(),
  category: z.enum(["food", "grocery"]),
  delivery_or_pickup: z.enum(["delivery", "pickup"]),
  notes: z.string().max(500).optional(),
  ambiguities: z.array(z.string().max(240)).max(5),
  language: z.literal("pt-BR"),
}).strict();
```

Use the current Base44 agent API:

```ts
const conversation = await base44.asServiceRole.agents.createConversation({
  agent_name: "order_interpreter",
  metadata: { meta_message_id: voice.messageId },
});
const agentReply = await base44.asServiceRole.agents.addMessage(conversation, {
  role: "user",
  content: transcript.text,
});
const content = typeof agentReply.content === "string"
  ? JSON.parse(agentReply.content)
  : agentReply.content;
const parsedIntent = orderIntentSchema.parse(content);
const intent = {
  items: parsedIntent.items.map((item) => ({
    spokenName: item.spoken_name,
    quantity: item.quantity,
    modifiers: item.modifiers,
  })),
  merchantPreference: parsedIntent.merchant_preference,
  category: parsedIntent.category,
  deliveryOrPickup: parsedIntent.delivery_or_pickup,
  notes: parsedIntent.notes,
  ambiguities: parsedIntent.ambiguities,
  language: parsedIntent.language,
};
```

- [ ] **Step 6: Implement the webhook function**

Create `app/base44/functions/metaWebhook/entry.ts` with these exact branches:

```text
GET:
  if hub.mode=subscribe and hub.verify_token=META_VERIFY_TOKEN
    return hub.challenge as text/200
  else return 403

POST:
  read raw bytes once
  verify X-Hub-Signature-256 before JSON.parse
  extract one voice message
  hash sender with CONFIRMATION_PEPPER
  find allowlisted SeniorProfile by phone_hash
  if no profile: return 200 without order creation
  find OrderDraft by meta_message_id
  if present: return 200 without processing
  download and transcribe audio
  create a service-role order_interpreter conversation and add the transcript
  validate returned JSON with Zod
  call prepareOrder using the selected connector
  persist draft, confirmation, and audit events
  send WhatsApp read-back and buttons
  return 200
```

If transcription or interpretation fails once, persist `needs_help`, send
`"Não consegui entender esse áudio. Pode mandar de novo, mais devagar?"`, and
return 200. Never switch to a fixture unless `SILVIA_DEMO_MODE=true`.

- [ ] **Step 7: Verify and commit WhatsApp ingress**

Run:

```bash
cd app
npx vitest run tests/functions/meta-webhook.test.ts
npm test
npm run lint
npm run build
cd ..
git add app/base44 app/tests/functions/meta-webhook.test.ts
git commit -m "Receive Silvia WhatsApp voice orders"
```

Expected: all checks pass.

---

### Task 7: Atomic confirmation claim and one checkout attempt

**Files:**
- Create: `app/base44/lib/checkout.ts`
- Create: `app/base44/functions/confirmOrder/entry.ts`
- Create: `app/tests/functions/confirm-order.test.ts`
- Modify: `app/base44/functions/metaWebhook/entry.ts`

**Interfaces:**
- Consumes: WhatsApp interactive reply ID, `Confirmation`, `OrderDraft`, `verifyConfirmation()`, connector.
- Produces: one atomic `updateMany()` claim and at most one checkout call.

- [ ] **Step 1: Write the failing confirmation-function test around a fake repository**

Create `app/tests/functions/confirm-order.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { confirmAndCheckout } from "../../base44/lib/checkout";

describe("confirmAndCheckout", () => {
  it("calls checkout once when two confirmations race", async () => {
    let claimed = false;
    const repo = {
      claim: vi.fn(async () => {
        if (claimed) return false;
        claimed = true;
        return true;
      }),
      markOrdered: vi.fn(),
      markFailed: vi.fn(),
      appendAudit: vi.fn(),
    };
    const connector = { checkout: vi.fn(async () => ({
      connectorMode: "demo",
      externalId: "demo-1",
      status: "demo_ordered",
    })) };
    const input = {
      order: { id: "o1", status: "confirmed", connectorMode: "demo" },
      idempotencyKey: "o1:draft",
    };
    await Promise.all([
      confirmAndCheckout(input, repo, connector),
      confirmAndCheckout(input, repo, connector),
    ]);
    expect(connector.checkout).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/functions/confirm-order.test.ts
```

Expected: FAIL because `confirmAndCheckout` does not exist.

- [ ] **Step 3: Implement the pure claim orchestration**

Export this function from `app/base44/lib/checkout.ts`. Keeping it out of the
`Deno.serve` entry prevents server startup side effects in Vitest:

```ts
export async function confirmAndCheckout(
  input: { order: any; idempotencyKey: string },
  repo: {
    claim(orderId: string): Promise<boolean>;
    markOrdered(orderId: string, receipt: unknown): Promise<void>;
    markFailed(orderId: string, code: string): Promise<void>;
    appendAudit(orderId: string, event: string): Promise<void>;
  },
  connector: { checkout(draft: any, idempotencyKey: string): Promise<any> },
) {
  if (!(await repo.claim(input.order.id))) return { kind: "duplicate" as const };
  await repo.appendAudit(input.order.id, "checkout_claimed");
  try {
    const receipt = await connector.checkout(input.order, input.idempotencyKey);
    await repo.markOrdered(input.order.id, receipt);
    await repo.appendAudit(input.order.id, "ordered");
    return { kind: "ordered" as const, receipt };
  } catch (error) {
    await repo.markFailed(input.order.id, "connector_checkout_failed");
    await repo.appendAudit(input.order.id, "checkout_failed");
    return { kind: "failed" as const };
  }
}
```

- [ ] **Step 4: Implement the Base44 HTTP adapter**

The `confirmOrder/entry.ts` handler accepts authenticated rehearsal requests.
The Meta webhook verifies Meta's signature and calls the same domain operation
directly. The `confirmOrder` `Deno.serve` handler must:

1. accept only POST;
2. require `await base44.auth.me()` and reject unauthenticated callers;
3. accept only `{ action, orderId, token, senderPhoneHash }`, where `action` is
   `confirm` or `edit`;
4. load the `OrderDraft` and matching active `Confirmation`;
5. call `verifyConfirmation()` with current time and `CONFIRMATION_PEPPER`;
6. compare sender phone hash, draft hash, total, connector mode, and expiry;
7. reject totals above the profile's `spend_cap_brl * 100`;
8. update status to `confirmed`;
9. claim checkout through:

```ts
const claim = await base44.asServiceRole.entities.OrderDraft.updateMany(
  {
    id: order.id,
    status: "confirmed",
    checkout_attempted_at: { $exists: false },
  },
  {
    $set: {
      status: "checkout_in_progress",
      checkout_attempted_at: new Date().toISOString(),
    },
  },
);
```

The repository's `claim()` returns `claim.updated === 1`. Demo checkout is
always allowed. Live checkout returns `live_checkout_disabled` unless
`ENABLE_LIVE_CHECKOUT === "true"`.

- [ ] **Step 5: Route interactive WhatsApp replies to confirmation**

Modify `metaWebhook/entry.ts` so audio messages use the order path and
interactive replies parse only `confirm:<orderId>:<token>` or
`edit:<orderId>:<token>`, re-hash Meta's sender, and invoke the same shared
operation used by `confirmOrder`. An edit
reply marks the order `editing`, sets `Confirmation.invalidated_at`, sends
`"Tudo bem. Me diga o que você quer mudar."`, and never claims checkout.

- [ ] **Step 6: Verify and commit confirmation checkout**

Run:

```bash
cd app
npx vitest run tests/functions/confirm-order.test.ts
npm test
npm run lint
npm run build
cd ..
git add app/base44 app/tests/functions/confirm-order.test.ts
git commit -m "Make Silvia checkout single use"
```

Expected: the race test reports one checkout call and all wider checks pass.

---

### Task 8: Authenticated real-time caregiver dashboard

**Files:**
- Modify: `app/src/App.jsx`
- Create: `app/src/components/Dashboard.jsx`
- Create: `app/src/components/OrderCard.jsx`
- Create: `app/src/components/Timeline.jsx`
- Create: `app/src/lib/presentation.js`
- Modify: `app/src/index.css`
- Modify: `app/tests/app.test.jsx`

**Interfaces:**
- Consumes: Base44 `auth.me()`, `OrderDraft.filter()`, `AuditEvent.filter()`, and both entities' `subscribe()`.
- Produces: one responsive dashboard that labels mode, state, price, timeline, and help conditions.

- [ ] **Step 1: Replace the smoke test with the failing dashboard contract**

Add to `app/tests/app.test.jsx`:

```jsx
it("renders the senior, current order, connector label, and safety boundary", async () => {
  render(<App />);
  expect(await screen.findByText("Dona Maria")).toBeInTheDocument();
  expect(screen.getByText(/ambiente de demonstração/i)).toBeInTheDocument();
  expect(screen.getByText(/aguardando confirmação/i)).toBeInTheDocument();
  expect(screen.getByText(/a Silvia nunca confirma por você/i)).toBeInTheDocument();
});
```

Mock `../src/api/base44Client` so `auth.me()`, entity filters, and subscriptions
return one demo order and three audit events. The subscription mock returns
`() => undefined`.

- [ ] **Step 2: Run the test and record red evidence**

Run:

```bash
cd app
npx vitest run tests/app.test.jsx
```

Expected: FAIL because the dashboard does not exist.

- [ ] **Step 3: Implement presentation helpers**

Create `app/src/lib/presentation.js`:

```js
export const statusLabel = {
  received: "Recebido",
  transcribing: "Ouvindo o áudio",
  interpreting: "Entendendo o pedido",
  clarifying: "Precisamos confirmar um detalhe",
  preparing: "Montando o pedido",
  awaiting_confirmation: "Aguardando confirmação",
  editing: "Alterando o pedido",
  expired: "Pedido expirado",
  confirmed: "Confirmado",
  checkout_in_progress: "Enviando pedido",
  ordered: "Pedido realizado",
  checkout_failed: "Não foi possível pedir",
  needs_help: "Precisa de ajuda",
  cancelled: "Cancelado",
};

export function brl(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents ?? 0) / 100);
}
```

- [ ] **Step 4: Implement the three focused components**

`Dashboard.jsx` owns loading, authenticated entity queries, and cleanup of
subscriptions. `OrderCard.jsx` receives only `{ order }` and renders merchant,
items, total, status, and a red `demo` banner or green `live` banner.
`Timeline.jsx` receives only `{ events }` and renders ordered audit rows.

Use this safety copy verbatim:

```text
A Silvia nunca confirma por você. Qualquer mudança no pedido exige uma nova confirmação.
```

Use `aria-live="polite"` for state changes, at least 44px interactive targets,
and no icon-only controls.

- [ ] **Step 5: Apply the visual system**

Update `index.css` with:

```css
:root {
  color: #1f2a24;
  background: #f4efe5;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.dashboard {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 64px;
}

.card {
  background: #fffdf8;
  border: 1px solid #d8d0c0;
  border-radius: 24px;
  box-shadow: 0 18px 50px rgb(45 55 48 / 9%);
}

:focus-visible {
  outline: 3px solid #176b4d;
  outline-offset: 3px;
}
```

Use dark green `#176b4d` for trust, warm cream `#f4efe5` for the canvas, and
coral `#c94d3f` only for errors or `needs_help`.

- [ ] **Step 6: Verify dashboard behavior, accessibility, and build**

Run:

```bash
cd app
npx vitest run tests/app.test.jsx
npm test
npm run lint
npm run build
cd ..
git add app/src app/tests/app.test.jsx
git commit -m "Show Silvia caregiver dashboard"
```

Expected: all checks pass.

---

### Task 9: Optional live iFood gateway with explicit attribution

**Files:**
- Create: `services/ifood-gateway/package.json`
- Create: `services/ifood-gateway/api/index.ts`
- Create: `services/ifood-gateway/src/client.ts`
- Create: `services/ifood-gateway/tests/client.test.ts`
- Create: `services/ifood-gateway/vercel.json`
- Create: `LICENSES/ifood-mcp-MIT.txt`
- Create: `ATTRIBUTIONS.md`
- Modify: `app/base44/lib/connectors.ts`
- Modify: `app/base44/lib/orchestrator.ts`
- Create: `app/base44/lib/live-connector.ts`
- Create: `app/tests/domain/live-fallback.test.ts`
- Modify: `app/base44/functions/metaWebhook/entry.ts`

**Interfaces:**
- Consumes: pinned MIT source behavior, gateway environment credentials, Base44 gateway URL and shared secret.
- Produces: authenticated JSON endpoints `/api/search`, `/api/draft`, and a disabled-by-default `/api/checkout`.

- [ ] **Step 1: Create the gateway package and secure install**

Create `services/ifood-gateway/package.json`:

```json
{
  "name": "@silvia/ifood-gateway",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.19.0" },
  "scripts": {
    "test": "vitest run",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

Run:

```bash
cd services/ifood-gateway
socket npm install
cd ../..
```

Expected: `package-lock.json` is created and Socket reports no blocker.

- [ ] **Step 2: Write failing gateway tests**

Create `services/ifood-gateway/tests/client.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createIfoodClient } from "../src/client";

describe("iFood gateway client", () => {
  it("requires auth and bounded fetch for search", async () => {
    const calls: any[] = [];
    const client = createIfoodClient({
      token: "token",
      accountId: "account",
      deviceId: "device",
      sessionId: "session",
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ sections: [] }), { status: 200 });
      },
    });
    await client.search({ term: "hambúrguer", latitude: -23.5, longitude: -46.6 });
    expect(calls[0].init.headers.authorization).toBe("Bearer token");
  });

  it("blocks checkout unless explicitly enabled", async () => {
    const client = createIfoodClient({
      token: "token",
      accountId: "account",
      deviceId: "device",
      sessionId: "session",
      checkoutEnabled: false,
      fetchImpl: async () => new Response("{}"),
    });
    await expect(client.checkout({ cartId: "c", payload: {} }))
      .rejects.toThrow("live_checkout_disabled");
  });
});
```

- [ ] **Step 3: Implement the minimum attributed client**

Adapt only the header builder, `ifood_search`, merchant catalog, cart creation,
and checkout request behavior from pinned `ifood-mcp/src/index.ts`. Put this
header at the top of `src/client.ts`:

```ts
/*
 * Portions adapted from AriOliv/ifood-mcp
 * commit 887c73c9a01701d3fa8e5d15ea75e4b53bacbc6a
 * Copyright (c) 2026 Ari Oliveira
 * Licensed under the MIT License; see ../../LICENSES/ifood-mcp-MIT.txt.
 */
```

Export:

```ts
createIfoodClient(config): {
  search(input): Promise<unknown>;
  buildDraft(input): Promise<unknown>;
  checkout(input): Promise<unknown>;
}
```

Use native `fetch`, `AbortSignal.timeout(8_000)`, explicit allowlisted paths,
and redacted errors. Do not port the MCP server, filesystem token persistence,
generic tool dispatcher, or OAuth UI.

- [ ] **Step 4: Implement a shared-secret HTTP boundary**

Create `api/index.ts` with one POST handler. Reject requests unless
`x-silvia-gateway-key` matches `SILVIA_GATEWAY_SHARED_SECRET`. Parse this
schema:

```ts
const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("search"), input: z.object({
    term: z.string().min(1).max(120),
    latitude: z.number(),
    longitude: z.number(),
  }) }),
  z.object({ operation: z.literal("draft"), input: z.record(z.unknown()) }),
  z.object({ operation: z.literal("checkout"), input: z.record(z.unknown()) }),
]);
```

Map each operation to one client method. `checkout` also requires
`ENABLE_LIVE_CHECKOUT === "true"`.

- [ ] **Step 5: Add Base44's live connector**

Create `app/base44/lib/live-connector.ts` implementing `CommerceConnector`.
Each method POSTs to `IFOOD_GATEWAY_URL`, includes
`x-silvia-gateway-key`, uses an 8-second timeout, and maps gateway responses
into `Candidate`, `PricedDraft`, or `ConnectorReceipt`.

Modify selection in `metaWebhook/entry.ts`:

```ts
const connector =
  Deno.env.get("SILVIA_CONNECTOR_MODE") === "live"
    ? new LiveConnector({
        url: requiredEnv("IFOOD_GATEWAY_URL"),
        secret: requiredEnv("IFOOD_GATEWAY_SHARED_SECRET"),
      })
    : new DemoConnector();
```

Catch only live `search` and `buildDraft` errors, append
`live_connector_fallback`, and rerun preparation with `DemoConnector`.
Never catch live checkout into demo checkout.

- [ ] **Step 6: Prove visible live-preparation fallback**

Add `prepareOrderWithFallback()` to `orchestrator.ts`. It calls
`prepareOrder()` with the primary connector, catches a preparation error only
when `primary.mode === "live"`, appends `live_connector_fallback`, then retries
with the supplied demo connector and returns `fallbackUsed: true`.

Create `app/tests/domain/live-fallback.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { DemoConnector } from "../../base44/lib/demo-connector";
import { prepareOrderWithFallback } from "../../base44/lib/orchestrator";

it("falls back visibly when live preparation fails", async () => {
  const live = {
    mode: "live" as const,
    search: vi.fn(async () => { throw new Error("private_api_changed"); }),
    buildDraft: vi.fn(),
    checkout: vi.fn(),
  };
  const appendEvent = vi.fn();
  const result = await prepareOrderWithFallback({
    intent: {
      items: [{ spokenName: "hambúrguer", quantity: 1, modifiers: [] }],
      category: "food",
      deliveryOrPickup: "delivery",
      ambiguities: [],
      language: "pt-BR",
    },
    profile: { senderPhoneHash: "p", addressId: "a", addressLabel: "Casa" },
    primary: live,
    fallback: new DemoConnector(),
    confirmationPepper: "test-pepper",
    appendEvent,
  });
  expect(result.fallbackUsed).toBe(true);
  expect(result.result.kind).toBe("draft");
  if (result.result.kind !== "draft") throw new Error("expected draft");
  expect(result.result.draft.connectorMode).toBe("demo");
  expect(appendEvent).toHaveBeenCalledWith("live_connector_fallback");
  expect(live.checkout).not.toHaveBeenCalled();
});
```

- [ ] **Step 7: Preserve the exact MIT license and attribution**

Copy the exact MIT license from the pinned repository into
`LICENSES/ifood-mcp-MIT.txt`. Create `ATTRIBUTIONS.md` with source URL, pinned
commit, carried behavior, modified files, and Silvia's original delta.

- [ ] **Step 8: Verify and commit the live adapter**

Run:

```bash
cd services/ifood-gateway
npm test
npm run build
cd ../../app
npm test
npm run build
cd ..
git add services app/base44 app/tests/domain/live-fallback.test.ts LICENSES ATTRIBUTIONS.md
git commit -m "Add attributed iFood gateway"
```

Expected: gateway tests, application tests, and both builds pass. If this task
cannot become green within two attempts, preserve the failure evidence and
ship the deterministic path without claiming live iFood integration.

- [ ] **Step 9: Deploy only a green gateway**

Use the connected Vercel deployment capability with
`services/ifood-gateway` as the project root. Configure only these server-side
environment names:

```dotenv
IFOOD_ACCESS_TOKEN=
IFOOD_ACCOUNT_ID=
IFOOD_DEVICE_ID=
IFOOD_SESSION_ID=
SILVIA_GATEWAY_SHARED_SECRET=
ENABLE_LIVE_CHECKOUT=false
```

Record the production HTTPS URL. Do not configure Base44 to use it until a
real `/api/search` request passes and its response contains no token or session
identifier.

---

### Task 10: Deployment, proof packet, and submission assets

**Files:**
- Create: `README.md`
- Create: `docs/demo-script.md`
- Create: `docs/proof-map.md`
- Create: `outputs/submission/base44-writeup.md`
- Create: `outputs/submission/base44-checklist.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: every prior task's build, tests, runtime endpoints, attribution, and known limits.
- Produces: public repository, Base44 production URL, proof packet, demo script, and ready-to-paste submission without pressing Submit.

- [ ] **Step 1: Write the README claim contract**

First create `.gitignore` with:

```gitignore
.DS_Store
.env
.env.*
!.env.example
node_modules/
dist/
work/
app/base44/.app.jsonc
```

Create `README.md` with these headings:

```markdown
# Silvia
## The problem
## What the demo proves
## Safety boundary
## Base44 architecture
## Run locally
## Environment variables
## Test and build
## Live versus demo connector
## Reused open-source work
## Known limits
## Roadmap
```

State verbatim:

```text
Silvia never gives a language model a checkout tool. A deterministic service
accepts only a fresh, single-use confirmation tied to the exact draft.

The iFood consumer connector is unofficial and can break when private iFood
endpoints change. The demo connector is always labelled and never places a
real order.
```

- [ ] **Step 2: Write the two-to-three-minute demo script**

Create `docs/demo-script.md` with this timed path:

```text
0:00–0:20  Dona Maria uses WhatsApp, not five delivery apps.
0:20–0:50  Send the Portuguese voice note.
0:50–1:15  Show transcription and order interpretation in the dashboard.
1:15–1:45  Show merchant, items, fee, total, and Confirmar/Alterar.
1:45–2:10  Attempt a stale confirmation; show zero checkout calls.
2:10–2:35  Tap the fresh confirmation; show exactly one demo receipt.
2:35–2:55  Show Base44 entities, functions, agent, auth, and realtime.
2:55–3:00  Close: familiar interface, human authority.
```

- [ ] **Step 3: Create the requirement-to-evidence map**

Create `docs/proof-map.md` with one row for every `Done when` item from the
design spec. Each row has `Requirement`, `Command or runtime action`,
`Expected evidence`, and `Current result`. Initial current results are
`not-run`; replace them only with fresh command output, runtime screenshots, or
URLs.

- [ ] **Step 4: Run local quality and security gates**

Run:

```bash
cd app
npm test
npm run lint
npm run build
npx base44@latest types generate
cd ../services/ifood-gateway
npm test
npm run build
cd ../..
git diff --check
rg -n '(sk-|xi-api-key|Bearer [A-Za-z0-9._-]{20,}|access_token|refresh_token|client_secret)' --glob '!package-lock.json' --glob '!docs/**'
git status --short
```

Expected: tests, lint, builds, type generation, and diff check pass; the secret
scan shows only environment-variable names and explanatory test fixtures.
Skip the gateway commands only if Task 9 was formally cut after its attempt
budget, and record that limit.

- [ ] **Step 5: Deploy Base44 resources and site**

From `app/`, configure only secret values that are available:

```bash
npx base44@latest secrets set CONFIRMATION_PEPPER
npx base44@latest secrets set META_VERIFY_TOKEN META_APP_SECRET META_ACCESS_TOKEN META_PHONE_NUMBER_ID META_GRAPH_VERSION
npx base44@latest secrets set ELEVENLABS_API_KEY
npx base44@latest deploy
npx base44@latest site open
```

Expected: deploy returns a production URL and the page loads through HTTPS.
Configure `IFOOD_GATEWAY_URL`, `IFOOD_GATEWAY_SHARED_SECRET`, and
`SILVIA_CONNECTOR_MODE=live` only after Task 9 has a healthy deployed gateway.

- [ ] **Step 6: Verify the deployed winning path**

Perform and record:

```text
1. Open the deployed dashboard in a clean browser session.
2. Authenticate as the caregiver.
3. Send the rehearsed voice note to the Meta test number.
4. Observe the order appear through realtime without page refresh.
5. Attempt an edited or stale token and confirm no receipt appears.
6. Tap the current confirmation and observe exactly one demo receipt.
7. Reload the dashboard and confirm the same final state remains.
8. Inspect browser console and Base44 logs for material errors.
```

Save screenshots and redacted logs under `outputs/proof/`. Do not store access
tokens, phone numbers, or raw audio.

- [ ] **Step 7: Build the submission packet**

Create `outputs/submission/base44-writeup.md` containing:

- a 120-word pitch;
- the one judge-visible claim;
- the five Base44 judging criteria mapped to evidence;
- Base44 features used;
- live versus simulated behavior;
- exact source attribution;
- repository URL, live URL, and demo-video URL fields once known.

Create `outputs/submission/base44-checklist.md` with every portal field:

```text
full name
email
project name
pitch
surface type
project URL
repository URL
demo video URL
write-up
Base44 backend features
BaaS feedback
Base44 app_id
social post URL
```

- [ ] **Step 8: Final review, commit, push, and stop before submission**

Run:

```bash
git diff --check
git status --short
git add README.md docs/demo-script.md docs/proof-map.md \
  outputs/submission outputs/proof .gitignore
git commit -m "Prepare Silvia hackathon submission"
git push
git status --short
```

Expected: the repository is pushed, the app is deployed, and all submission
fields are prepared. Stop before the portal's final Submit action and before
any real food purchase.
