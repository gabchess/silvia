# Silvia UGC Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one QA-passed 40–45 second, 1920×1080 Silvia UGC film in Portuguese with burned English captions, five seconds of real product proof, and an honest product-vision delivery payoff.

**Architecture:** Higgsfield produces the recurring actor, location, voice, and five physical source shots. The Base44 app supplies the real consent-flow proof after one synchronized salmon-and-juice fixture update. A small local FFmpeg pipeline owns timing, captions, disclosure text, UI, sound mix, conformance, and the final master.

**Tech Stack:** Higgsfield Soul Cast, Higgsfield Qwen Audio 3.0 TTS, Higgsfield Seedance 2.0, Base44 React/Vite, Vitest, Playwright or browser capture, Python 3, FFmpeg/ffprobe.

## Global Constraints

- Primary master is 16:9, 1920×1080, 30 fps, H.264 video, AAC audio, and Rec.709 colour.
- Duration is 40–45 seconds.
- Portuguese performance uses one selected Maria voice; English captions are deterministic and burned in.
- Maria appears 68–74, working, self-possessed, and consistent in face, wardrobe, and home.
- The real proof insert lasts approximately five seconds and shows request, priced read-back, confirmation, and completed demo state.
- The order is Cozinha da Praça: salmão grelhado com legumes R$49,90, suco de laranja R$9,90, delivery R$6,90, total R$66,70, cash on delivery.
- Generated footage contains no readable UI, prices, captions, claims, logos, or brand marks.
- The fictional delivery carries `Visão do produto · Product vision` throughout.
- Higgsfield spend cannot exceed 180 credits. No HeyGen or ChatCut credits may be spent.
- Quote each paid operation before running it, generate one test at a time, and record the result before the next operation.
- Human publishing and hackathon submission remain outside this workflow.

---

## File Structure

```text
production/silvia-ugc-film/
  00-brief/                 production contract and live capability preflight
  01-development/           approved treatment and beat sheet
  02-previs/                storyboard and contact sheets
  03-elements/              Maria, apartment, wardrobe, courier, meal references
  04-source/                shot manifest, generated clips, proof capture, ledgers
  05-edit/                  EDL, caption file, and render script
  06-motion/                transition and typography contract
  07-audio/                 Maria narration, licensed music, ambience, SFX, ledger
  08-qa/                    technical and human review evidence
  09-handoff/               QA-passed master and ready-to-post copy
  exports/                  working renders
app/
  src/lib/presentation.js   public rehearsal transcript
  base44/functions/rehearse-order/entry.ts
  base44/shared/demo-connector.ts
  tests/app.test.jsx
  tests/functions/rehearse-order.test.ts
README.md
app/README.md
docs/demo-script.md
docs/proof-map.md
```

`production/silvia-ugc-film` is the immutable production record. The app files
change together because they present the same demo order. The render script
consumes only accepted, hashed assets named in the source manifest.

---

### Task 1: Create and validate the production contract

**Files:**
- Create: `production/silvia-ugc-film/**`
- Source: `docs/superpowers/specs/2026-07-28-silvia-ugc-film-design.md`

**Interfaces:**
- Consumes: the approved film design and current live provider capabilities.
- Produces: a scaffold-valid project with approved treatment, beats, storyboard, elements, shots, and a recorded 180-credit ceiling.

- [ ] **Step 1: Create the project scaffold**

Run:

```bash
python3 /Users/gava/.agents/skills/cinematic-ad-video/scripts/init_project.py \
  production/silvia-ugc-film \
  --name "Silvia — Ela conversa. Maria decide." \
  --channel youtube \
  --format ugc-ad \
  --duration-mode social \
  --language pt-BR \
  --fps 30
```

Expected: the project contains all contract files and refuses to overwrite a
non-empty directory.

- [ ] **Step 2: Freeze the approved production data**

Set `00-brief/project.json` to `status: "previs-approved"`,
`paid_generation_approved: true`, checkpoint
`2026-07-28-approved-180-credit-ceiling`, duration minimum 40 and maximum 45,
and audio target −14 LUFS with −1 dBFS true peak.

Copy the approved story, dialogue, product boundary, and acceptance criteria
verbatim into `00-brief/brief.md` and
`01-development/locked-treatment.md`. Record these beat IDs in
`01-development/beat-sheet.json`:

```json
["arrival", "dependence", "silvia-turn", "real-proof", "product-vision", "relief"]
```

Write six matching storyboard panels, mark the storyboard approved, and add
element contracts for `maria`, `maria-wardrobe`, `apartment`,
`phone`, `courier`, `delivery-bag`, and `salmon-meal`.

- [ ] **Step 3: Record the live preflight**

Check the Higgsfield plan and balance, the exact cost for four Soul Cast
images, three voice auditions, and each Seedance source duration. Check local
`ffmpeg`, `ffprobe`, Node, and the app build. Store exact results and fallbacks
in `00-brief/capability-preflight.json`.

- [ ] **Step 4: Validate and commit the contract**

Run:

```bash
python3 /Users/gava/.agents/skills/cinematic-ad-video/scripts/validate_project.py \
  production/silvia-ugc-film --stage scaffold
git add production/silvia-ugc-film
git commit -m "Create Silvia film production contract"
```

Expected: `PASS: scaffold contract valid`.

---

### Task 2: Synchronize and verify the salmon demo fixture

**Files:**
- Modify: `app/src/lib/presentation.js`
- Modify: `app/base44/functions/rehearse-order/entry.ts`
- Modify: `app/base44/shared/demo-connector.ts`
- Modify: `app/tests/app.test.jsx`
- Create or modify: `app/tests/functions/rehearse-order.test.ts`
- Modify: `README.md`
- Modify: `app/README.md`
- Modify: `docs/demo-script.md`
- Modify: `docs/proof-map.md`

**Interfaces:**
- Consumes: the locked order values from the film specification.
- Produces: one tested request and receipt whose item names and total are
  identical in backend, UI, documentation, and captured proof.

- [ ] **Step 1: Write the failing fixture assertions**

Change the app test order to:

```js
{
  merchant: { name: "Cozinha da Praça" },
  normalized_items: [
    { displayName: "Salmão grelhado com legumes", quantity: 1, modifiers: [] },
    { displayName: "Suco de laranja", quantity: 1, modifiers: [] },
  ],
  pricing: { fee_cents: 690, total_cents: 6670 },
  payment_mode: "cash_on_delivery",
}
```

Assert that rehearsing sends:

```text
Silvia, quero um salmão grelhado com legumes e um suco de laranja.
```

Add a backend function test asserting merchant, both items, delivery fee,
total, payment mode, `connector_mode: "demo"`, and the order-specific
confirmation boundary.

- [ ] **Step 2: Run the focused tests and verify red**

Run:

```bash
cd app
npx vitest run tests/app.test.jsx tests/functions/rehearse-order.test.ts
```

Expected: failures show the old hamburger merchant, items, transcript, or
R$51,70 total.

- [ ] **Step 3: Implement the smallest synchronized fixture update**

Use these values everywhere:

```js
const transcript =
  "Silvia, quero um salmão grelhado com legumes e um suco de laranja.";
const pricing = {
  meal_cents: 4990,
  drink_cents: 990,
  fee_cents: 690,
  total_cents: 6670,
};
```

Keep the connector in demo mode, cash on delivery, and retain the existing
R$80 spend cap.

- [ ] **Step 4: Update only public proof that names the old fixture**

Replace the former hamburger request, merchant, items, and R$51,70 receipt in
the four public documents. Keep every demo/live limitation intact.

- [ ] **Step 5: Verify the application**

Run:

```bash
cd app
npm test
npm run lint
npm run build
deno check base44/functions/*/entry.ts
```

Expected: tests, lint, build, and Deno checks pass.

- [ ] **Step 6: Deploy and capture the real proof**

Run the linked Base44 deploy:

```bash
cd app
npx base44@latest deploy -y
```

Open the public URL, rehearse once, reset, then record a clean five-second
proof showing the matching request, R$66,70 read-back, confirmation, and
completed demo state. Save it as
`production/silvia-ugc-film/04-source/real-product-proof.mp4`.

Inspect frames near 0.5s, 2.5s, and 4.5s. Reject the capture if any required
state is absent or the old order appears.

- [ ] **Step 7: Hash, log, and commit**

Record the proof path, SHA-256, live URL, capture time, and real-product
provenance in the source manifest.

```bash
git add app README.md docs production/silvia-ugc-film/04-source
git commit -m "Match Silvia demo proof to the film order"
```

---

### Task 3: Lock Maria, the apartment, and the Portuguese voice

**Files:**
- Modify: `production/silvia-ugc-film/03-elements/element-manifest.json`
- Modify: `production/silvia-ugc-film/04-source/source-manifest.json`
- Modify: `production/silvia-ugc-film/04-source/generation-ledger.jsonl`
- Create: `production/silvia-ugc-film/03-elements/casting/**`
- Create: `production/silvia-ugc-film/03-elements/location/**`
- Create: `production/silvia-ugc-film/07-audio/voice-auditions/**`

**Interfaces:**
- Consumes: approved Maria, wardrobe, apartment, and voice descriptions.
- Produces: one reusable Maria reference, one apartment reference, and one
  approved Portuguese narration source.

- [ ] **Step 1: Quote and record the casting test**

Preflight four 16:9 Soul Cast candidates. Record model, count, dimensions,
exact cost, the variable `credible 68–74-year-old working Brazilian woman`,
and the user’s approved 180-credit checkpoint before submitting.

- [ ] **Step 2: Generate and review four candidates**

Use one prompt:

```text
Four distinct casting portraits for Maria, a Brazilian woman aged 68 to 74
who still works. Warm lower-mid presence, self-possessed, expressive tired
eyes, realistic age lines and skin texture, no beauty filter, no frailty,
no caricature. Simple muted-guava work blouse, dark trousers, practical
shoes, no jewellery, watch, logos, or ornate fasteners. Natural commercial
realism in a modest cared-for Brazilian apartment at early evening.
```

Select one face only after full-size inspection. Reject candidates that look
under 65, frail, comic, glossy, or synthetic.

- [ ] **Step 3: Generate and lock the apartment reference**

Create one bright three-quarter 16:9 apartment frame with the entrance,
small kitchen, dining table, and clear spatial depth. Use the Maria winner as
the only person reference. Save Maria and apartment as reusable Higgsfield
elements and record their provider names exactly.

- [ ] **Step 4: Quote and generate identical voice auditions**

Generate Ines, Marisol, and Mabel with the same line and settings:

```text
Eu só queria pedir meu jantar sem depender de ninguém.
```

Direction: Brazilian Portuguese, woman around 70, warm lower-mid register,
natural conversational pauses, tired but capable, no announcer cadence, no
frailty. Choose the recording by accent, age, rhythm, emotional movement, and
naturalness.

- [ ] **Step 5: Generate the complete locked narration once**

Use the selected voice for the approved Portuguese lines in order, with
timing pauses preserved. Save one lossless source and one 48 kHz WAV working
copy. Record voice preset, model, cost, text hash, output hash, and usage
rights.

- [ ] **Step 6: Commit accepted continuity anchors**

```bash
git add production/silvia-ugc-film/03-elements \
  production/silvia-ugc-film/04-source \
  production/silvia-ugc-film/07-audio
git commit -m "Lock Maria film continuity"
```

---

### Task 4: Generate and review the five physical source shots

**Files:**
- Modify: `production/silvia-ugc-film/04-source/shot-manifest.json`
- Modify: `production/silvia-ugc-film/04-source/source-manifest.json`
- Modify: `production/silvia-ugc-film/04-source/generation-ledger.jsonl`
- Create: `production/silvia-ugc-film/04-source/generated/S1/**`
- Create: `production/silvia-ugc-film/04-source/generated/S2/**`
- Create: `production/silvia-ugc-film/04-source/generated/S3/**`
- Create: `production/silvia-ugc-film/04-source/generated/S4/**`
- Create: `production/silvia-ugc-film/04-source/generated/S5/**`
- Create: `production/silvia-ugc-film/02-previs/contact-sheets/**`

**Interfaces:**
- Consumes: locked Maria and apartment elements plus the approved shot
  manifest.
- Produces: five accepted 16:9 clips with hashes, provider provenance, contact
  sheets, and an accepted/rejected review record.

- [ ] **Step 1: Freeze all five one-action prompts**

Use Seedance 2.0 at 720p. S1, S3, S4, and S5 are five seconds. S2 is ten
seconds. Every prompt names one action, one camera move, one focal point,
matching start/end state, and forbidden changes.

S1 action: Maria enters and drops keys; gentle handheld follow; keys and the
weight of arrival are focal.

S2 action: Maria looks from phone to stove and settles into a resigned look;
slow medium-to-close push; her face is focal.

S3 action: Maria raises a phone with its screen turned away and records one
voice note; restrained over-shoulder drift; her deliberate action is focal.

S4 action: Maria accepts one unbranded delivery bag at the doorway; locked
three-quarter camera; the handoff is focal and the courier face stays soft.

S5 action: Maria takes one bite of salmon and exhales; slow lateral move; her
relief is focal.

- [ ] **Step 2: Generate S1 and gate the result**

Quote 17.5 credits, generate one clip, download it, calculate SHA-256, watch
the full clip, and create a first/middle/final contact sheet. Accept only if
Maria, wardrobe, apartment, hands, keys, and causality remain stable.

- [ ] **Step 3: Repeat the paid gate for S2 through S5**

Run one clip at a time. Quote 35 credits for S2 and 17.5 credits for each
five-second clip. After each clip, update spend, ledger, hash, and review
before the next call. Change one variable per retry. Stop before 180 credits.

- [ ] **Step 4: Validate the source package**

Confirm that accepted source assets total one S1–S5 clip, no invented UI or
brand appears, and every generated asset links to an approved paid operation
in the source manifest.

- [ ] **Step 5: Commit accepted shots**

```bash
git add production/silvia-ugc-film/02-previs \
  production/silvia-ugc-film/04-source
git commit -m "Generate Silvia film source shots"
```

---

### Task 5: Build the deterministic 43-second master

**Files:**
- Create: `production/silvia-ugc-film/05-edit/captions.ass`
- Create: `production/silvia-ugc-film/05-edit/render_master.py`
- Modify: `production/silvia-ugc-film/05-edit/edl.json`
- Modify: `production/silvia-ugc-film/05-edit/timing-events.json`
- Modify: `production/silvia-ugc-film/06-motion/motion-spec.json`
- Modify: `production/silvia-ugc-film/07-audio/audio-sources.json`
- Create: `production/silvia-ugc-film/exports/silvia-cut-only.mp4`
- Create: `production/silvia-ugc-film/exports/silvia-captioned.mp4`
- Create: `production/silvia-ugc-film/exports/silvia-master-v1.mp4`

**Interfaces:**
- Consumes: accepted S1–S5 clips, real proof capture, locked narration, and
  licensed/local audio assets.
- Produces: a reproducible 43-second master and frame-accurate EDL.

- [ ] **Step 1: Encode the exact EDL**

Use these output intervals:

```text
00–05 S1
05–14 S2
14–17 deterministic Silvia waveform/title
17–21 S3
21–26 real-product-proof
26–28 deterministic "Um pouco depois..."
28–34 S4, extended only with a clean hold or second accepted keeper range
34–41 S5, extended only with a clean hold or room-tone reaction range
41–43 S5 relief plus deterministic Silvia mark and final line
```

Do not freeze a visibly moving subject. If S4 or S5 lacks a clean keeper range,
adjust the cut within 40–45 seconds instead of duplicating frames.

- [ ] **Step 2: Render and inspect the cut-only master**

Normalize every source to 1920×1080, 30 fps, square pixels, Rec.709, and
48 kHz audio. Render cuts only. Watch the full result and verify that events
occur once, in order, with no gaps, overlaps, repeats, freezes, or A/V drift.

- [ ] **Step 3: Add deterministic titles, disclosure, and captions**

Render `Conheça a Silvia` at 14–17s, `Um pouco depois...` at 26–28s,
`Visão do produto · Product vision` throughout 28–34s, and the Silvia mark
plus `Ela conversa. Maria decide.` at 41–43s.

Burn the approved English translations from the design specification. Keep
captions inside the lower-third safe area and move them above product UI or
the disclosure label where required.

- [ ] **Step 4: Build the licensed sound bed**

Use room tone, keys, bag, voice-note start/send, confirmation tap, doorbell,
delivery bag, cutlery, and one licensed music source. Record creator, URL,
license, receipt or ownership basis, path, transformation, and mix level for
every source. Keep speech dominant and duck music beneath it.

- [ ] **Step 5: Render the conformed master**

Encode H.264 high profile with AAC audio. Target approximately −14 LUFS and
true peak at or below −1 dBFS. Save the complete command and source hashes so
the render is reproducible.

- [ ] **Step 6: Commit the reproducible edit**

```bash
git add production/silvia-ugc-film/05-edit \
  production/silvia-ugc-film/06-motion \
  production/silvia-ugc-film/07-audio
git commit -m "Assemble Silvia UGC film"
```

---

### Task 6: Run technical and human QA, then prepare handoff

**Files:**
- Modify: `production/silvia-ugc-film/08-qa/qa-report.json`
- Create: `production/silvia-ugc-film/08-qa/contact-sheet.jpg`
- Create: `production/silvia-ugc-film/08-qa/human-review.json`
- Create: `production/silvia-ugc-film/09-handoff/silvia-ugc-master.mp4`
- Modify: `production/silvia-ugc-film/09-handoff/ready-to-post.md`

**Interfaces:**
- Consumes: the encoded master and complete source/audio ledgers.
- Produces: one QA-passed, hashed handoff master; no publication or
  submission.

- [ ] **Step 1: Run automated media QA**

Run:

```bash
python3 /Users/gava/.agents/skills/cinematic-ad-video/scripts/qa_master.py \
  production/silvia-ugc-film/exports/silvia-master-v1.mp4 \
  --project production/silvia-ugc-film \
  --output production/silvia-ugc-film/08-qa/qa-report.json
```

Expected: 1920×1080, 30 fps, 40–45 seconds, H.264/AAC, audible speech,
approximately −14 LUFS, and true peak no higher than −1 dBFS.

- [ ] **Step 2: Inspect the encoded deliverable**

Create a contact sheet and inspect at full size. Watch the complete file with
sound. Record pass/fail evidence for story, Maria identity, age, wardrobe,
apartment, hands, props, product truth, captions, disclosure, timing, audio,
and the final emotional image.

- [ ] **Step 3: Fix only failed checks and rerun QA**

Change one relevant layer per failure. Do not regenerate accepted source
footage for a caption, timing, mix, or disclosure issue. Re-run automated and
full-watch QA after every new master.

- [ ] **Step 4: Request the named human seal**

Present the final master to Gabe for full-watch approval. After he supplies
the human review, run:

```bash
SILVIA_REVIEWED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python3 /Users/gava/.agents/skills/cinematic-ad-video/scripts/finalize_qa.py \
  production/silvia-ugc-film \
  --reviewer "Gabe" \
  --reviewed-at "$SILVIA_REVIEWED_AT" \
  --evidence production/silvia-ugc-film/08-qa/human-review.json
```

- [ ] **Step 5: Validate delivery and commit**

```bash
python3 /Users/gava/.agents/skills/cinematic-ad-video/scripts/validate_project.py \
  production/silvia-ugc-film --stage delivery
git add production/silvia-ugc-film
git commit -m "Finalize Silvia UGC film"
```

Expected: `PASS: delivery contract valid`. The film is ready for the human to
upload and submit; the workflow performs neither action.
