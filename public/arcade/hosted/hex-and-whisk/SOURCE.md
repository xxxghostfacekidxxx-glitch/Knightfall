# Hex & Whisk · original Knightfall game

**Type:** free, mobile-first merge-cooking / restaurant-order puzzle

**Original implementation and art:** Knightfall contributors, 2026. All markup, CSS, JavaScript game logic, 21 illustrated food symbols and recipes were created for this title. No Merge Cooking source code, textures, characters, branding, or other third-party art was copied.

**Controls:** drag an ingredient onto a matching ingredient to upgrade it, or select one tile and then another. Moving into an empty slot or swapping nonmatches also works. On keyboards, Tab to focus a tile, arrows move focus, Enter/Space select, Backspace/Delete recycle selected, 1/2/3 harvest ingredient stations, U undo, S stir, H hint, W Magic Whisk, M mute. Tap a board ingredient then an empty pantry pocket to stash it (or drag it there). Tap a filled pocket and then a board square to retrieve or swap. Stored dishes can fulfill customer orders directly.

**Saving:** autosaves locally in this browser, including energy regeneration while away. Signed-in Knightfall members can explicitly save and load their kitchen via the arcade progress API. Saving scores to an account is optional. There are no purchases, ads, random paid rewards, external assets, or remote dependencies for gameplay.

This implementation is not affiliated with the creators of Merge Cooking. See the repo's project license for site contribution licensing terms.

## Kitchen progression update

Every new recipe tier is added to the illustrated cookbook and awards a one-time discovery bonus. The Witch's Workboard has three repeatable, gameplay-only missions for merging, serving orders, and harvesting ingredients. Earn coins and energy by claiming completed quests; later stages require more actions. Local and cloud saves retain this progression. Older version-1 kitchen saves remain readable and are migrated without wiping the board or score.

## Magic Whisk and enchanted customers

The Midnight Kitchen has four original in-page SVG customer portraits (Pip the Imp, Mochi Bat, Wisp Ghost and Marnie Witch). The free Find a Match action highlights a pair, prioritizing dishes requested by active customers. Players start with one Magic Whisk and earn another for every three completed customer orders, up to five in storage. Each Whisk spends one earned charge to automatically merge a useful pair. Charges survive local and connected-account saves; older saves migrate with one starter charge. Helpers do not require purchases or use extra energy.

## The Secret Pantry

Two free shelf pockets let players reserve valuable ingredients when the 6×6 cooking table gets crowded. Storing and retrieving do not consume energy or coins, and dragging ingredients directly onto a pocket is supported on touch devices. An occupied pocket swaps with the chosen board ingredient, so items are never silently destroyed. Ready-made dishes on the shelf can be served straight to hungry customers. The shelf is included in local and account saves. Legacy kitchens without shelf data open with two empty pockets, and damaged shelf items are ignored during restore.

## Customer request refresh

When a customer requests a dish that is taking too long to craft, the **New Order** button replaces the first unfinished request for 35 coins earned in-game. Ready-to-serve requests are protected, all ingredients and stored pantry items remain intact, and the replacement is automatically saved with the rest of the kitchen. The button is disabled when every request is ready or there are insufficient coins. No paid currency is involved.
