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

## Movable magical workstations (grid update)

Garden and Bakery generators now occupy dedicated squares on the 6×6 counter. The Sweetshop generator joins the grid at kitchen level 3. Select a generator then select another square to move it, or drag it on touch or desktop. Moving it onto an ingredient swaps their positions without consuming energy, destroying ingredients or changing recipe tiers. Moving one generator onto another swaps their locations. Tap the generator twice to harvest (costs one energy), or use its corresponding Pantry button. Stations now use the game's existing original SVG food illustrations inside animated etched magic circles instead of generic emoji. Their placement survives both device and account save formats. Older kitchens migrate generators onto available spots without replacing saved foods.

## Pantry expansion and customer portraits

The Secret Pantry starts with two free storage pockets, then earns one more at levels 4, 7, 10 and 13, capped at six. Saved pantry dishes are retained as capacity grows and are still servable directly from storage. The grid now has dimensional moonstone sockets and stained-glass highlights, with reduced-motion support. Existing original SVG patrons gain softly animated portrait medallions, expressive speech bubbles and happy movement when their orders are ready. All mechanics remain free to play.

## Verification

The pure engine's 24 regression cases pass in the connector's JavaScript execution environment, covering fresh games, merging, energy, leveling, quests, customer requests, Magic Whisks, generator relocation, shelf upgrades, and legacy save migration. Syntax checks pass for engine and client scripts. Browser rendering and the live Cloudflare deployment still require separate end-to-end verification.

## One-screen mobile kitchen (v7)

The mobile layout prioritizes a single viewport: tiny HUD counters and quick actions, three customers above the counter, then a square 6×6 checkerboard playfield with compact energy, merge and utility controls. Decorative hero content is hidden in the compact layout. Original food SVGs float directly over subtly alternating countertop squares, rather than solid ingredient cards. Storage and the full Kitchen & Quests panel open as accessible slide-up drawers with a backdrop and Escape/close controls; selecting a stored item closes its drawer so the board is immediately usable. Responsive landscape rules and reduced-motion fallbacks remain.

## Bonus energy versus natural regeneration

Natural energy regeneration stops at **40**, but earned energy from orders, level rewards and quests can accumulate up to a safety limit of **999**. Spending earned bonus energy is allowed even above 40. Regeneration resumes once available energy drops below the normal ceiling; bonus energy persists in existing version-1 local and account saves. Energy UI shows the actual balance above 40 and a full threshold meter. No purchase or paid energy mechanic is introduced.

### Verification

The 26 pure-engine regression checks passed in a JavaScript execution harness after the changes, including earned-energy overflow, capped regeneration, quest rewards, and serialization. Client JavaScript syntax and static markup/asset references were checked. Browser layout and live Cloudflare deploy require a separate on-device visual check.

## Square-grid and distinct-generator refinement (v8)

The board now explicitly uses six equal CSS columns and six equal CSS rows, with square slots and centered ingredient artwork. Ingredient tier numbers and item-name overlays have been removed from the board (accessible names remain in ARIA labels). Generator artwork no longer reuses any food symbols: Garden is a little enchanted greenhouse, Bakery is a magic oven, and Sweetshop is a candy-making machine. All three are built as original inline SVGs and remain draggable. Selecting an ingredient now subtly highlights possible matching partners, and a tiny green indicator marks ready-to-serve food. Newly created ingredients and merges receive a lightweight pop animation that respects reduced-motion settings. Existing game state, recipes, and saves are unchanged.

## Night-shift characters with real personalities (v9)

The original Pip the Imp, Mochi Bat, Wisp Ghost and Marnie Witch are joined by four original SVG characters: Grumble Gargoyle, Nix the Moth, Rook the Crow and Bubbles Slime. Each has its own silhouette, accent colors, motion pattern, mannerisms, waiting dialogue, ready-to-eat dialogue and post-serving reaction. Tiny mobile customer cards now retain a readable single-line speech bubble; the full cards retain their larger expressions. Their identities remain deterministic from the existing order ID so no extra schema or save migration is necessary.

Each character favors one existing food family (Garden, Bakery or Sweetshop). Serving that character a favored-family order awards a visible **20% coin tip**, rounded up; normal Rush Hour doubles the bonus too. The bonus and customer name are returned by the pure engine for reliable scoring and transparent results, and the customer card previews the additional tip. The coin bonus is completely earnable and does not affect paid currency or energy. Tests cover all eight roster entries, stable identities across saved games, favorite dishes, normal servings and Rush Hour reward calculation. Client JS and engine syntax and the character-specific UI checks passed in the isolated JavaScript checks.

## Original artwork overhaul (v10)

A coordinated art pass now covers **all 21 recipe icons**, **all eight customer illustrations**, the three magical generator machines and the kitchen presentation. Each recipe SVG has hand-authored, tier-specific highlights and garnish accents while retaining its existing identifier and recognizable cooking silhouette. Characters gain individual expressions and accessories (spiked imp hair and sharp grin, bat headband and cheeks, ethereal ghost stars, witch hat jewelry, gargoyle details, moth antenna decorations, crow plumage, and slime sparkles). Machines receive illuminated trim; the six-by-six checkerboard now uses richer lighting and consistent food drop shadows. Art remains original, vector-based, self-hosted and mobile/offline-friendly; no external font/image services are required. Reduced-motion support remains.

All game rules, customer favorite-tip rewards, storage, energy and save structures are unchanged. Pure-engine checks and the targeted art UI checks passed (29/29 in the JavaScript harness); browser screenshots and live Cloudflare deploy are not independently verified.

## Animated character spotlights and live customer interactions (v11)

All eight night customers now have a larger temporary animated character stage, which appears when a player taps a customer, completes an ordered dish, or serves a meal. The stage shows a large self-hosted character portrait, personality-specific dialogue and contextual meal/coin information (including favorite-food bonuses). Its portrait floats over a spinning decorative halo and the scene self-dismisses after a short interval. Unfinished customers are tappable to speak, but cannot accidentally be served until their requested food exists. Newly ready orders trigger a one-time celebration; the existing ready-order ID set prevents rerenders from repeatedly replaying the animation. The stage is a visual overlay, not another scrollable panel, preserving the one-screen mobile playfield and the existing storage/quests drawers. Animations respect reduced-motion settings. No account or save schema changes; live reload uses CSS/JS v11 query strings. The engine's 28 rules tests plus the focused character-stage check passed in the JavaScript harness; a real-device visual pass is still outstanding.

## Free-standing food illustrations and customer loyalty (v12)

The board is now a single continuous, six-by-six conic-gradient checkerboard. Individual board squares have transparent backgrounds, so ingredients read as dimensional objects laid on the counter instead of card panels. The 21 self-hosted food SVGs remain tier-distinct, with shadows on the illustrated objects rather than their grid cells. A gentle breathing motion and the existing merge-pop animation add life; the stationary generators remain recognizable as their own equipment. Selection and match highlights stay deliberately subtle. No numbers or item-name labels appear over the board ingredients.

The eight customers now remember visits in an optional `patronVisits` save property. Character identities remain stable from order IDs; every third serving to that character gives an additional earned-coin loyalty reward equal to 15 plus five times the current kitchen level, doubled during Rush Hour. Existing favorite-food bonuses are preserved. Players see repeat-visit badges, dialogue evolving with their familiarity, and slightly different mood effects. Legacy saves missing `patronVisits` restore safely with zero visits. The engine and targeted UI harness returned **30/30 passing checks**; live phone visual rendering is not independently verified.

## Targeted order guidance and flying merges (v13)

Tapping an unfinished customer now selects or clears **order focus**, highlights ingredients from the requested recipe family on the board (with stronger treatment for exact ready dishes), and highlights the relevant on-board generator. The current customer card receives a highlighted edge, with a concise progress label showing the number of recipe-tier steps between the highest eligible existing ingredient and the requested dish; pantry items are counted. This is tier distance, not a guarantee of a specific number of merges. Focus follows the existing order ID rather than card position and clears when a customer is served or the order refreshed. Small-screen cards keep progress unobtrusive and tap-to-chat reveals the detailed guidance.

A successful manual merge now launches a temporary SVG ingredient from the source square toward its destination, followed by the existing merge pop and score particles. It uses the established effects overlay rather than new permanent DOM UI, automatically removes the flying artwork, and respects reduced-motion settings. The 6×6 continuous checkerboard remains unchanged and ingredients stay visually free of cards or tier badges. JS and engine checks plus focused UI tests passed **32/32** in the isolated harness; live phone/browser rendering has not been separately verified.
