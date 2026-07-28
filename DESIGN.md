---
version: alpha
name: Silvia
description: A calm, senior-readable conversation surface that proves every assisted order remains under human control.
colors:
  primary: "#236247"
  secondary: "#B84635"
  ink: "#241F1A"
  paper: "#F5F0E6"
  surface: "#FFFDF8"
  leaf-dark: "#173F30"
  leaf-soft: "#E4F0E8"
  sun: "#F3C75B"
  line: "#D8D0C2"
  muted: "#5E675F"
  danger: "#9B3D2E"
typography:
  display:
    fontFamily: Fraunces
    fontSize: 4.75rem
    fontWeight: 650
    lineHeight: 0.94
    letterSpacing: "-0.055em"
  heading:
    fontFamily: Fraunces
    fontSize: 1.75rem
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: Atkinson Hyperlegible
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Atkinson Hyperlegible
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: 8px
  md: 16px
  lg: 28px
  bubble: 20px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
components:
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    padding: "{spacing.md}"
    rounded: "{rounded.md}"
  page-shell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "{spacing.lg}"
  conversation-stage:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  user-bubble:
    backgroundColor: "{colors.leaf-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
  silvia-bubble:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
  safety-rail:
    backgroundColor: "{colors.leaf-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  waiting-note:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  voice-control:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  muted-copy:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
  error-state:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
  divider:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    height: 1px
---

## Overview

Silvia feels like a trusted person at the kitchen table, not a control panel.
The judge should understand the voice-order flow and its approval boundary in
one glance. The interface uses one memorable composition: a generous
conversation stage beside a compact, live safety rail.

The visual direction is Brazilian kitchen-table modernism. Warm paper, dark
cocoa, leafy green, guava and sunlight yellow make the product feel familiar
without copying WhatsApp. Every readable order state comes from the real
Base44 workflow.

## Colors

`paper` is the page canvas. `surface` holds the conversation so messages stay
easy to read. `ink` replaces pure black with a warmer high-contrast neutral.

`primary` marks actions that remain safe to continue. `leaf-dark` belongs to the
safety rail, where white text creates a clear proof layer. `secondary` is
reserved for the single idea judges must remember: Silvia waits for confirmation.
`sun` may highlight voice activity or one live state, never decorate every
component.

`line` separates content without turning the page into a stack of cards.
`muted` is permitted only for secondary copy that still passes contrast at the
chosen size. `danger` appears only when a process fails closed.

## Typography

Fraunces gives Silvia a warm, recognisable voice. It is used for the name,
the two-line promise and short section headings. Atkinson Hyperlegible carries
all controls, conversations, prices and status details because its letterforms
remain distinct at a glance.

The main promise stays within two lines on desktop and three on narrow phones.
Body copy never drops below 16px inside the conversation. Labels may use 12px
only when they are secondary and paired with a larger plain-language state.

## Layout

The desktop judge view uses a 12-column grid. The conversation stage spans
seven columns and the safety rail spans five. The stage may grow, but the rail
must remain readable at 360px or wider. The page uses a 1280px maximum content
width with 24px outer gutters.

The conversation is the primary reading path:

1. Dona Maria sends a voice request.
2. Silvia returns a complete priced read-back.
3. Dona Maria confirms or changes it.
4. The rail records the gate and resulting state.

On screens below 900px, the layout becomes one column in that order. Primary
actions remain visible after the read-back. Touch targets are at least 44px,
with 8px or more between adjacent actions.

## Elevation & Depth

The page uses one soft ambient shadow around the conversation stage. Message
bubbles rely on contrast and borders, not independent floating shadows. The
safety rail is a flat dark field with inset dividers. Decorative grain may sit
behind the page at low opacity and must never reduce text contrast.

## Shapes

The large 28px radius belongs only to the two main surfaces. Message bubbles
use an asymmetric 20px corner treatment that suggests conversation without
copying another product. Buttons use 16px corners rather than generic pills.
Circles are reserved for avatars, voice playback and state indicators.

## Components

The header is small and functional: Silvia, the demo disclosure and the signed
in caregiver. It does not compete with the demo.

The conversation stage starts in a ready state with one dominant action,
`Reproduzir demonstração`. Once pressed, the same surface reveals Dona Maria’s
voice message, Silvia’s read-back and the bound confirmation controls. Loading,
error and completed states replace the relevant action in place so the judge
never hunts for the next step.

The safety rail shows three facts: current state, current order and the audit
trail. Its top line always says whether the connector is a browser simulation
or an authorised live connector. The rail never suggests that a real iFood
purchase occurred.

The confirmation control is visually strong but remains subordinate to the
full read-back. Its help text states that a changed order requires a new
confirmation. A completed demo says that nothing was bought or charged.

Motion is brief and functional. New messages reveal in order and the live dot
pulses only while work is active. All motion stops under
`prefers-reduced-motion`.

## Do's and Don'ts

- Do show the conversation and the protection proof at the same time.
- Do keep `Simulação no navegador` visible throughout the demo.
- Do use the exact merchant, items, fee, total, address and payment mode stored
  by Base44.
- Do preserve a clear focus ring and keyboard order.
- Do keep the full judge path above the fold at 1440×900.
- Don't copy WhatsApp branding, logos or exact chrome.
- Don't use generated phone UI as product evidence.
- Don't add a card for every fact or turn the rail into an analytics dashboard.
- Don't hide the confirmation boundary in tooltips or small legal copy.
- Don't animate scroll, pin sections or add motion that delays the next action.
