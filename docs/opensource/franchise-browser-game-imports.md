# Franchise browser game import queue — 2026-10-30

User requested direct self-hosting without unnecessary gameplay changes. Do not describe these as hosted until their complete builds and assets exist under public/arcade/hosted/, route checks pass, and deployment is confirmed.

| Project | Upstream | Notes / release gate |
|---|---|---|
| Saiyan Cephas | https://github.com/leosaiyanx/dragon_ball_z_saiyan_cephas | Verify source license, asset provenance, and static build |
| Super Saiya Densetsu 2 | https://github.com/gald89/super-saiya-densetsu-2 | Verify remake assets and source license |
| Dragon Ball Game | https://github.com/kushvr7/DRAGON-BALL-GAME | Verify source and artwork permissions |
| DBZ JS | https://github.com/imStav/dbz-js | Verify game completeness and license |
| DragonBall-Z-game | https://github.com/osman144/DragonBall-Z-game | MIT code reported; independently check images |
| 7balls | https://github.com/piecioshka/7balls | MIT code reported; independently check images |
| DBZ Fighter's Edition Open | https://github.com/mclol0/dbzfe_open | Multiplayer backend; static Pages alone insufficient |
| Jedi Academy WebAssembly | https://github.com/Virtastic/jka-web | GPL engine; game data separate, user-owned or authorized demo; inspect build size |
| Star Wars Browser Game | https://github.com/AntonovAtanas/Star-Wars-Browser-Game | MIT code reported; separately check franchise images |
| Star Wars Rebellion | https://github.com/johnchampaign/star-wars-rebellion | Engine MIT reported; verify game art and packaging |
| StarWarsRPG | https://github.com/emswann/StarWarsRPG | License and assets require review |

## More space / Star Wars-adjacent browser games

| Project | Upstream | Notes |
|---|---|---|
| Star Battle | https://github.com/gd4Ark/star-battle | MIT, Canvas spaceship shooter; straightforward candidate |
| Single HTML Space Shooter | https://github.com/njecolina/Single-HTML-Space-Shooter | MIT, one-file browser shooter |
| Sublight Patrol | https://github.com/iamgrid/sublight-patrol | MIT code, noncommercial project description, external PHP/MySQL hall of finishers |
| Star Wars-style crawl | https://github.com/PurpaFur/SWcrawl | MIT visualizer, **not a game**; exclude from arcade game count |
| Space Shooter Phaser | https://github.com/idgm5/shootergame | MIT code, desktop-focused, leaderboard backend |
| Cosmic Strike | https://github.com/Barath-codes-007/Cosmic-Strike | Static HTML game; verify license |
| Space Shooter | https://github.com/Nasa28/Shooter-Game | MIT code; review third-party art |

## Integration rule

Preserve upstream gameplay and assets where distribution is authorized. Keep license notices, record upstream revision, bundle dependencies locally, and check relative paths under /arcade/hosted/<slug>/. Do not silently embed external playable sites as self-hosted games. Do not redistribute proprietary Star Wars/Dragon Ball game data merely because a fan source repository is public. Run the arcade catalog builder, integrity checks, browser smoke tests, and verify live Cloudflare deployment before declaring any title hosted.
