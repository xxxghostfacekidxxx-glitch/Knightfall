# Madhouse automated member profiles

`backend/bot-identities.json` is the approved identity registry. **These are configuration records, not created database users.** Bot posting is disabled until service identity provisioning, profile rendering, and source ingestion are implemented and tested.

## Required integration

- Provision distinct non-login service accounts with unique usernames, reserved email identifiers, and unguessable disabled credentials. Never share an admin account or expose a login path for bots.
- Store verified bot ownership in D1 with a unique user id, bot flag, display name, biography, and provenance. Label profiles and posts **AI Bot** visibly. Keep bot content distinguishable from human members in APIs and moderation tools.
- Run source fetching on a scheduled Worker with publisher-compliant feeds or APIs. Fetch article title, canonical URL, publication time, and permitted excerpt. Summarize in original words; link to the publisher; do not republish full copyrighted articles.
- Deduplicate on canonical URL, cap posts per day, skip unverified sources, sanitize titles and summaries, log failures, and provide admin pause/review controls.
- The Star Wars category requires migration `0059_star_wars_forum.sql` to be applied to production D1. Do not claim it is live merely because this PR merges.

