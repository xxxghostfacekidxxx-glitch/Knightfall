# Arcade family consolidation

| Survivor | Harvested features | Retired versions |
| --- | --- | --- |
| Shatterpocalypse | Saved-run checkpoints and resume | Ember Rebound |
| Cursed Circuit | Classic sequence mode, adjustable playback, rune art | Ember Echo, Void Sequence |
| Cinder Merge | Merge chains, legacy cloud save import | Cinder 2048 |
| Ash Tiles | Solvable scramble, animated moves, undo, goal preview | 15 Puzzle |
| Lights Out: Afterburn | Lantern art, undo, safe solution hints | Void Lanterns |
| Crypt Words | Expanded word bank, optional free guesses, legacy save import | Wordlee |
| Cinder Crossing | Six-crossing single-life challenge, edge tap controls | Ash Crossing |

Eight duplicate catalog listings are removed. Old standalone entry URLs redirect to survivors through Cloudflare Pages `_redirects`; embedded game hashes redirect in their original collection pages. Remaining collection games stay available. Historical upstream license is archived under `docs/archive/licenses`.

The family rules suite exercises actual page scripts with DOM/canvas stubs, including stale callbacks, save validation, undo, legacy imports, and score boundaries. Cloud account synchronization requires the deployed account service and is not verified by the local preview. Offline ZIP packaging includes the shared family assets.
