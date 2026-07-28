# Silvia UGC Film — Design Specification

Date: 2026-07-28

Status: Approved for production

Primary use: Base44 hackathon submission and YouTube/X presentation

Primary master: 16:9, 1920×1080, 30 fps

Target duration: 40–45 seconds

## 1. Objective

Create a Portuguese actor-led UGC film that makes a hackathon judge feel
Maria's loss of independence, understand Silvia's consent boundary, see five
seconds of real product proof, and remember Maria's relief.

The audience should leave with one association:

> Silvia gives an older adult independence without taking away control.

The film is not a tutorial. Maria's physical and emotional change carries the
story. The real Silvia interface proves the product. Deterministic graphics own
all captions, claims, labels, UI, prices and brand text.

## 2. Reference boundary

The supplied AI-ad workflow contributes production functions:

- generate and test several casting and location candidates;
- lock the winning character, wardrobe, location and props before motion;
- use one connected visual style across the shot list;
- give each generated shot one action, one camera move and one focal point;
- change one variable per retry;
- cut keeper moments from approved source clips instead of expecting one
  generation to produce the finished film.

The film must not copy the reference creator's cast, locations, choreography,
dialogue, product, plot, signature shots or visual identity.

The Marketing Lab contributes:

- immediate tension through a recognisable problem;
- vulnerability without humiliation;
- a visible reward after the product turn;
- dignity: Maria is capable, but the interface was not designed for her;
- an honest before-and-after in which the product proof remains real.

The available Lenny material contributes:

- the status quo is the foil: cooking while exhausted or depending on a
  daughter;
- Silvia's bold promise is autonomy with explicit consent;
- the transformation matters more than the feature list.

The current `refoundai/lenny-skills` repository does not contain an upstream
`brand-storytelling` skill. A separate attributed derivative may be created
after this film specification exits review.

## 3. Audience and desired response

### Primary audience

Hackathon judges evaluating product value, craft, operational proof and honest
use of Base44.

### Secondary audience

Older Brazilian adults and the family members who help them with delivery
apps.

### Desired response

- Know: Silvia turns a voice request into a priced order and waits for consent.
- Feel: Maria is respected, relieved and back in control.
- Do: open the live MVP or advance Silvia in judging.
- Share: "She talks. Maria decides."

## 4. Locked story

Maria is a Brazilian working woman around 70. She arrives home tired, sees that
her daughter is not there to help with a delivery app, and faces a choice she
resents: cook while exhausted or depend on someone else. A short waveform
transition introduces Silvia. Maria sends a WhatsApp voice note. Five seconds
of the real MVP show the interpreted request, priced read-back, confirmation
and completed demo state. A labelled product-vision beat moves to an unbranded
delivery at Maria's door. Maria eats, relaxes and ends the film in control.

The emotional sequence is:

> exhaustion → forced dependence → resignation → voice action → real proof →
> imagined fulfilment → relief

## 5. Cast, voices, location and props

### Maria

- Brazilian woman, apparent age 68–74.
- Working, self-possessed and expressive.
- Realistic skin and age detail; no beauty-filter finish.
- Warm lower-mid voice, unhurried but not frail.
- Slight fatigue in the opening and quiet confidence after confirmation.
- No caricatured "grandmother voice," helplessness or comic incompetence.

Generate four Maria casting candidates with Soul Cast. Select the face that
holds age, warmth and expression in a low-cost motion test. Save the winner as
the single identity reference used by every Maria shot.

Wardrobe: a simple warm-toned work blouse, dark trousers and practical shoes.
No jewellery, watch, small logos or ornate fasteners.

### Voice audition

Use Qwen Audio 3.0 TTS inside Higgsfield. Audition Ines first, then Marisol and
Mabel using the same line and identical direction. Select by:

1. credible Brazilian Portuguese;
2. apparent age without frailty;
3. natural pauses and conversational rhythm;
4. emotional movement from fatigue to confidence;
5. absence of announcer or synthetic cadence.

The recording, not the preset name, decides the winner.

### Silvia

Silvia has no human body in the film. She exists as the WhatsApp conversation,
the real product interface and its written read-back. The primary master does
not add a separate assistant or announcer voice. Maria narrates the story, so
the film keeps one emotional point of view.

### Courier

The courier appears only in the product-vision handoff. Keep the courier's face
outside the focal plane. Use neutral clothing and an unbranded insulated bag.

### Location

One modest, cared-for Brazilian apartment with an entrance opening into a
small kitchen/dining area. Generate and lock a bright three-quarter reference
with spatial depth. The opening grades the location cooler and dimmer; the
resolution warms the same space without changing its physical layout.

### Props

- keys;
- practical work bag;
- smartphone with no generated readable screen;
- kitchen chair or stool;
- unbranded delivery bag;
- fixed salmon-and-vegetable meal presentation;
- clear cup or bottle of orange juice;
- simple plate and cutlery.

## 6. Revised demo order

The spoken order and the real product proof must match:

> Silvia, quero um salmão grelhado com legumes e um suco de laranja.

The deterministic Base44 rehearsal will use:

| Field | Value |
| --- | --- |
| Merchant | Cozinha da Praça |
| Meal | Salmão grelhado com legumes |
| Meal price | R$49,90 |
| Drink | Suco de laranja |
| Drink price | R$9,90 |
| Delivery | R$6,90 |
| Total | R$66,70 |
| Payment | Dinheiro na entrega |
| Spend cap | R$80,00 |

The fixture, tests, deployed UI, README, demo script, proof map and submission
copy must all move together. No recorded screen may show the former hamburger
order.

## 7. Timed treatment and dialogue

| Time | Picture | Portuguese audio | Burned English caption |
| --- | --- | --- | --- |
| 0–5s | Maria enters, drops her keys and work bag, and looks toward the kitchen. | "Cheguei cansada do trabalho." | "I just got home exhausted from work." |
| 5–10s | Maria looks at her phone, then toward the stove. | "Minha filha, que sabe mexer nesses aplicativos, não tá em casa." | "My daughter, the one who knows these apps, isn't home." |
| 10–14s | Maria holds on the unwanted choice. | "Eu só queria pedir meu jantar sem depender de ninguém." | "I just wanted dinner without relying on anyone." |
| 14–17s | A WhatsApp waveform, warm light and the title `Conheça a Silvia` bridge the kitchen to the phone. | "Foi aí que eu conheci a Silvia." | "That's when I met Silvia." |
| 17–21s | Maria opens WhatsApp and records a voice note. | "Silvia, quero um salmão grelhado com legumes e um suco de laranja." | "Silvia, grilled salmon with vegetables and an orange juice." |
| 21–26s | Real MVP montage: request, priced read-back, confirm and completed demo state. | "Silvia repete tudo, mostra o total e espera o sim." | "Silvia reads it back, shows the total, and waits for yes." |
| 26–28s | Time transition into the imagined outcome. | "Um pouco depois..." | "A little later..." |
| 28–34s | Doorbell and unbranded delivery handoff. | No dialogue. | "Product vision" remains visible with its Portuguese pair. |
| 34–41s | Maria changes out of her work shoes, takes the first bite and relaxes. | No dialogue. | No caption. |
| 41–43s | Stay on Maria's relief as the Silvia mark and `Ela conversa. Maria decide.` appear. | "Ela conversa. Eu decido." | "She talks. I decide." |

Performance may breathe within a 40–45 second master, but dialogue, event order
and claims remain fixed.

## 8. Shot architecture

### Generated source shots

| ID | Duration | Start → end | Subject action | Camera | Focal point |
| --- | ---: | --- | --- | --- | --- |
| S1 | 5s | Closed door → keys on table | Maria enters and drops keys | Gentle handheld follow | Weight of her arrival |
| S2 | 10s | Standing by kitchen → resigned look at phone | Maria weighs cooking against asking for help | Slow push from medium to close | Her face |
| S3 | 5s | Phone lowered → voice note sent | Maria raises the phone and records | Over-shoulder drift | Her deliberate action |
| S4 | 5s | Door closed → bag transferred | Maria accepts the delivery | Locked three-quarter doorway | Handoff, not courier |
| S5 | 5s | Meal untouched → first-bite exhale | Maria takes one bite and settles | Slow lateral move | Relief in her face |

S2 may use Maria's approved audio as an audio reference. S1, S3, S4 and S5
should be generated silent unless production sound materially improves the
clip. Exact dialogue and narration remain deterministic audio sources.

### Deterministic units

- 3-second waveform and "Conheça a Silvia" transition;
- 5-second capture or code reconstruction of the verified live MVP;
- confirmation-completed state;
- 2-second "Um pouco depois..." transition;
- persistent `Visão do produto · Product vision` label during the fictional
  delivery beat;
- English captions;
- Silvia mark and final line.

Generated footage must not contain readable UI, prices, captions, claims,
logos or brand marks.

## 9. Visual and motion system

### Look

- Natural commercial realism, not glossy luxury.
- Warm Brazilian domestic palette: cocoa, cream, leaf green and muted guava.
- Opening uses cooler evening neutrals and more negative space.
- Silvia's arrival introduces warm light and soft green from the phone side.
- Resolution keeps the same home but lets warmth, posture and framing open up.
- Skin texture, fabric detail and ordinary domestic imperfections stay intact.

### Camera

- 16:9 compositions protect the centre and lower-third caption safe areas.
- Human beats use restrained handheld movement.
- Product proof is clean, stable and orthogonal.
- Every generated shot has one causal action and one camera move.
- Match motion from Maria raising the phone into the waveform transition.
- Do not use fast zooms, orbit shots, drone movement or generic AI spectacle.

### Transitions

- Keys hitting the table motivate the first hard cut.
- Phone lift motivates the waveform bridge.
- Confirmation tap motivates the "Um pouco depois..." card.
- Door closing motivates the dining cut.
- Maria's exhale gives the music its final resolution.

## 10. Product proof and truth boundary

The proof insert is real and lasts approximately five seconds. It must show:

1. Maria's matching salmon-and-juice request;
2. the matching priced order;
3. the confirmation action;
4. the completed demo state.

The fictional courier payoff represents a future authorized commerce
connection. The label `Visão do produto · Product vision` must remain legible
throughout that delivery beat. The courier, bag and meal carry no iFood or
third-party branding. The film does not say or imply that the current MVP
placed a live iFood order.

The ending stays emotional and contains no disclaimer card. The repository and
post copy retain the full technical disclosure, but they do not replace the
in-film product-vision label.

## 11. Sound

Speech stays dominant. Maria's selected voice is the sole narration source.
Use tactile sound only when it explains cause:

- keys on wood;
- work bag settling;
- room and refrigerator tone;
- voice-note start and send;
- confirmation tap;
- doorbell;
- delivery bag rustle;
- cutlery and first-bite room tone.

Music begins sparse and tired, gains pulse at Silvia's entrance, then resolves
warmly after the doorbell. Use one licensed source with recorded provenance.
Higgsfield currently has no standalone music or general sound-effect generator,
so source licensed audio and finish locally. Do not spend HeyGen or ChatCut
credits.

## 12. Production route and credit contract

Higgsfield account state at preflight:

- plan: Plus;
- available balance: 495.92 credits;
- credits spent during design: 0.

Route:

1. Soul Cast for four Maria candidates.
2. Lock one Maria reference and one three-quarter location.
3. Qwen Audio 3.0 TTS for controlled voice auditions.
4. Seedance 2.0 for one 16:9 source shot at a time.
5. Prototype at 720p using the low-cost mode.
6. Review the full clip and a contact sheet before the next paid call.
7. Change one variable per retry.
8. Capture the real product after the matching fixture is deployed.
9. Assemble captions, UI, transitions, sound and master locally with
   deterministic tools.

Live preflight prices:

| Operation | Exact cost |
| --- | ---: |
| Four Soul Cast candidates | 0.12 credits |
| Seedance 2.0, 5s, 720p prototype | 17.5 credits |
| Seedance 2.0, 10s, 720p prototype | 35 credits |
| Seedance 2.0, 5s, native 1080p | 45 credits |
| Maria voice audition line | approximately 0.07 credits |
| One-click 15s UGC generator, rejected | 75 credits |

Initial five-shot source pass: 105 credits.

Controlled retry reserve: 70 credits.

Voice and casting allowance: less than 1 credit.

Hard production ceiling: **180 credits**.

No paid operation may push the project above the ceiling. Generate one approved
test at a time. Quote any keeper-only upscale separately because the live
upscale tool does not provide cost preflight.

## 13. Failure handling

| Risk | Prevention | Rejection rule |
| --- | --- | --- |
| Maria looks too young, frail or caricatured | Four-candidate casting and one-variable motion test | Reject identity or age mismatch |
| Face, outfit or home drifts | One locked Maria reference, wardrobe and location | Reject any visible continuity break |
| Phone produces fake UI | Keep screen unreadable in generated footage; insert real proof | Reject invented text or logos |
| Hands or delivery bag morph | One simple contact action and short keeper range | Reject duplicate fingers, bag or meal |
| Courier competes with Maria | Keep courier face soft or outside frame | Reject a second focal performance |
| Voice sounds synthetic or non-Brazilian | Identical Ines/Marisol/Mabel audition | Reject announcer cadence or wrong locale |
| Delivery implies current live commerce | Persistent bilingual product-vision label | Reject missing or unreadable label |
| Spoken request and proof disagree | Update, test and deploy one fixture before capture | Reject any item, price or total mismatch |
| Captions obscure faces or UI | Fixed safe areas and manual English timing | Reject clipping, mistranslation or collision |
| Source shot attempts several actions | One action, move and focal point per prompt | Split and regenerate rather than upscale |

## 14. Acceptance and QA

The master passes only when:

- duration is 40–45 seconds;
- output is 16:9 H.264 video with AAC audio, 30 fps and Rec.709 colour;
- final delivery is 1920×1080, with any upscale applied only to approved
  keepers;
- the human story is understandable without post copy;
- Maria remains the same person, age, outfit and home;
- Portuguese audio sounds natural and English captions match its meaning;
- captions remain inside 16:9 safe areas and are readable on a laptop;
- product proof is real, legible, approximately five seconds and matches the
  deployed fixture;
- confirmation and completed demo states are visible;
- `Visão do produto · Product vision` remains visible through the fictional
  delivery;
- no iFood logo, partnership claim, generated UI, fake price or invented
  purchase proof appears;
- no dialogue repeats and no source clip freezes, gaps or drifts;
- speech is dominant, the music ducks under voice, integrated loudness targets
  approximately −14 LUFS and true peak stays at or below −1 dBTP;
- the final image is Maria's relief with the line "Ela conversa. Maria decide."

Automated media inspection does not replace a full-size human watch with sound.

## 15. Follow-on work outside this film

After the film specification is approved, create a separate implementation
plan. The requested global `brand-storytelling` skill remains a follow-on:
derive it with explicit attribution from the verified Lenny positioning
principles, this Marketing Lab material and the durable story rules learned
here, then verify discovery in both Codex and Claude Code.
