# Base44 Dev Build-Off submission

Submission portal: <https://backendcompetition.base44.app/submit>

Portal cutoff: July 29, 2026 at 00:00 Pacific, which is July 29 at 04:00
in São Paulo.

## Section 1: Your submission

### Full name

`[YOUR FULL LEGAL NAME]`

### Email

`[YOUR BEST CONTACT EMAIL]`

### Project title

Silvia

### One-line pitch

A trusted voice assistant that helps older adults order food, reads every
charge back, and waits for their exact confirmation.

### Surface type

Web app

### Live URL

<https://silvia-dec7df73.base44.app>

### GitHub repo

<https://github.com/gabchess/silvia-whatsapp-assistant>

### Access instructions

Open the live URL and sign in with Google. Select **Ensaiar pedido por voz**,
review the fictional salmon-and-orange-juice order, then select **Confirmar
pedido de demonstração**. The order state and audit timeline update in real
time. This is a safe rehearsal and does not place a real order or charge money.

### Demo video URL

Paste the public X post URL after publishing the 45-second video.

### Project write-up

Silvia helps older adults prepare and confirm a food order through a voice
conversation instead of learning another delivery app. A person describes the
meal in Portuguese. Silvia interprets the request, reads back the merchant,
items, fee, total, address, and payment method, then waits. The AI model cannot
buy anything.

Base44 is the operational backend. Silvia uses Google authentication, four
entities with caregiver-scoped row access, three Deno functions, a tool-free AI
agent, secrets, real-time subscriptions, hosting, and a public React app. Each
confirmation is signed to the sender, immutable draft hash, total, connector
mode, and expiry. A compare-and-set state claim permits one checkout attempt.

The contest flow uses a fictional catalog and produces a receipt marked
`demo_ordered`. It does not contact iFood or charge money. The Meta WhatsApp
and ElevenLabs transcription paths are deployed and tested, but need the
owner's authorized account credentials before a WhatsApp number can go live.

### Agentic IDE used

Codex

### Base44 App ID

`6a67c3c8b80c051fdec7df73`

### Social post URL

Paste the public X post URL. This field is required, and the post must tag
`@base44`.

## Section 2: Backend features used

Select these five:

- Authentication & user management
- Database / entities
- Backend functions (Deno)
- AI / LLM / agents
- Real-time subscriptions

Do not select **File & media storage**. The submitted build does not depend on
Base44 storage.

## Section 3: BaaS feedback

### What worked well?

The strongest part was keeping auth, entities, row access, functions, the AI
agent, real-time updates, secrets, and hosting in one backend. The CLI and
file-based resources also made the architecture easy to inspect and test from
an agentic IDE.

### Where did you get stuck?

The device login code expired once during setup, and it was not always obvious
which resource state was live versus only local. Clearer deploy status,
resource diffs, and function logs in the CLI would shorten that feedback loop.

### What was missing?

A first-party local emulator for functions and real-time subscriptions would
make safety and failure-path testing faster. A one-command environment
diagnostic and official messaging connector templates would also help.

### Bugs or rough edges

The device authentication code expired during setup. Relinking fixed it, and
no launch-blocking issue remained.

### Anything else

Base44 works well with an agentic IDE because the backend resources are
reviewable files rather than hidden configuration. That made it practical to
put the confirmation and exactly-once rules at the backend boundary.

### Likelihood to keep using Base44 Backend

Recommended score: **8 / 10**

Leave the follow-up checkbox enabled if you are happy for Base44 to contact
you.

## Final check before Submit

- The live app opens in a private browser window.
- The public GitHub repo opens without a login.
- The X post is public, includes the video, and tags `@base44`.
- The social post URL is pasted into both the social field and the optional
  demo video field.
- The five backend features above are selected.
- The first three feedback answers are complete.
- The review screen shows the correct app ID and links.
- Save a screenshot of the success screen after submitting.
