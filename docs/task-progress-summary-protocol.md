# Between the Flames progress summary protocol

## Scope
Summaries use the authorized live task list and repository evidence, not private assistant conversations. Each owner uses their own revocable credential if a supported integration is available. Otherwise the owner requests a manual snapshot. Never share credentials between Osiris and Isis or elevate access for reporting.

## Read-only summary contract
Fetch non-deleted tasks visible to the authenticated caller. Group by status and verification; include task ID, title, version, last update, next step, blocker and evidence URL where present. Compare with the previous authorized snapshot by ID and version. Report newly completed, reopened, blocked and changed tasks separately. Do not count source-checked as runtime-verified. Missing access or failed queries must be reported as unavailable, not zero.

## Scheduling and delivery
Default to an owner-requested summary. Optional daily delivery requires explicit opt-in, destination, timezone and supported scoped authentication. Use a read-only job and send only to the authorized recipient. No automated task status changes, no private chat ingestion and no secrets in logs. Disable the job on credential revocation or repeated authorization failure.

## Acceptance before enabling automation
Test distinct owner credentials, unauthorized access rejection, pagination, empty lists, changed versions, revoked keys and delivery isolation. Keep automation disabled until these tests pass. Manual summaries remain available independently.

This document completes the planning task; implementation and credential provisioning remain separate work items.
