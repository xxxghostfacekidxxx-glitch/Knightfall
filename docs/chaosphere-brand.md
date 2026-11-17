# CHAOSPHERE · Knightfall Messenger
## Approved product name
Chaosphere. Tagline: **Enter the chaos. Find your kind.**

## Mascot brief
An original tiny scarlet demon, enormous mismatched eyes, crooked cream horns,
one ridiculous toothy grin, stubby paws, permanently malfunctioning brain.
Hyperactive and adorable, with dark cartoon humor and fractured-glitch energy.
GIR/JTHM/BMTH are *tonal references*, not character assets to copy.

## Behavior
- The mascot lives in the Chaosphere install icon, inbox hero and floating launcher.
- It wiggles on unread messages. Motion stops when reduced motion is requested.
- Chat and live-message events use existing Knightfall D1 messaging, WebSocket and push.
- It never blocks game controls, never plays sound without a user action and never automatically sends messages or game invitations.
- Planned: custom reactions/emotes, optional sounds, costume unlocks and seasonal expressions. Not yet implemented.

## Compatibility
- `/messages.html` and D1 remain the authoritative inbox. No conversation migration.
- `/chaosphere.html` is the canonical install route. `/ruinwire.html` redirects to it.
- `?app=chaosphere` is canonical. `?app=ruinwire` still works for existing clients.
- Installed PWA `id: "/ruinwire"` and Android package `com.ashfall.ruinwire` stay stable for upgrades.
- Legacy GitHub workflow/artifact identifiers may retain the original name.
- The app title and icon have changed, but **no production-signed Android APK is published**.

## Before independent public-store launch
Check U.S. and international trademarks, app-store naming conflicts and brand availability.
The name has not been legally cleared. The term is also in existing commercial use.
