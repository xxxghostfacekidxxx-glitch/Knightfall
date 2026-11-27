# Miss Chaos — independent runtime / Core
November 27, 2026. Product direction: an original character and platform-owned orchestration, not a skin attached to one language model. The user rejected the prior three expression SVGs. Restore the established portrait while commissioning a cohesive replacement; do not call maintenance an artistic overhaul.
## Implemented
backend/chaos-independent-runtime.mjs separates routing and inference from account identity, persona, saved memory, context, tools, and persistence. Existing streaming and standard endpoints now use the same adapter. Economy default preserves the current answer model. Set server-side CHAOS_INFERENCE_MODE=adaptive only after confirming account usage budget and model availability. Adaptive routes coding to Qwen2.5 Coder 32B, creative tasks to Mistral Small 3.1, deeper requests to Llama 3.3 70B, casual chat to existing Llama 3.1 8B. The existing tool planner remains bounded to one call; final answer permits one pre-stream transient-error fallback to the existing model. No retry on quota, billing, safety, authorization or client errors. No retry after stream delivery. Response metadata identifies selected route and actual engine, never prompts, keys or private user details. All inference stays inside current Workers AI binding. Existing server permissions preserved.
## Next phases
1. Validate model capability and spend limits; configure adaptive canary only after authorization, then test real streaming and ordinary responses.
2. Independent provider interface with optional self-hosted open-weight inference, explicit administrator approval for each provider, per-provider data policy and budget. No arbitrary URLs, secret exposure, or automatic external transfer of private memories. Add standardized stream normalization and capability probes.
3. Long-term memory retrieval with member control, source-aware knowledge, bounded tools and explicit approval for external effects. No unconstrained self-modification or arbitrary execution.
4. Original high-quality character art and cohesive visual direction: concept review, expressive portrait set and motion prototypes, consistent silhouette, typography, illustration and environment, accessible mobile/desktop. Rejected SVGs remain in git history but are not displayed by the revised UI. No replacement art claimed.
5. Real evaluation: conversational usefulness, model differences, privacy isolation, streaming reliability, costs, device usability, independent audience feedback. Never promise that an audience member will like a design.
## Sources
https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/
https://developers.cloudflare.com/workers-ai/models/qwen2.5-coder-32b-instruct/
https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/
https://developers.cloudflare.com/workers-ai/platform/pricing/

## Original weights priority (November 27)
[Experiment 001](MISS-CHAOS-ORIGINAL-MODEL.md) supersedes provider switching as the primary research goal. Actual randomly initialized, trained checkpoint and standalone local browser lab committed. Existing production inference remains until independently trained models meet acceptance thresholds. No provider purchase or permission changes.
