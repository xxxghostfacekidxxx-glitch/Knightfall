# Order of the 66 — Fist of Chaos / CODE-001
November 27, 2026. Miss Chaos is the fictional leader of the dedicated research corps. This curriculum is shared by all 66, with one authored lesson and designated cross-division peer per identity. Designated peers are assignments, not recorded completed lessons. Original 32 retain original duties.

Six modules: code comprehension, encoding/data, independent implementation, defensive review, neural engineering, verification/authorized networks. Authorized public documentation, original implementation, defensive inspection and synthetic fixtures only. No targeted surveillance, unauthorized access, packet transmission to third parties or execution of untrusted code. No claim of unrestricted agency or subjective emotion.

## First original-model coding experiment
{
  "experiment": "CODE-001",
  "trainingRows": 100,
  "originalRows": 40,
  "curriculumTrainingRows": 60,
  "heldoutRows": 6,
  "steps": 12000,
  "parameters": 29151,
  "vocabulary": 591,
  "before": {
    "tokens": 1332,
    "loss": 6.383432178972802,
    "perplexity": 591.9559237414567,
    "accuracy": 0.0015015015015015015
  },
  "after": {
    "tokens": 1332,
    "loss": 3.86199810328954,
    "perplexity": 47.560286857433645,
    "accuracy": 0.27927927927927926
  },
  "heldout": {
    "tokens": 74,
    "loss": 5.382462998019098,
    "perplexity": 217.55745966773253,
    "accuracy": 0.16216216216216217
  },
  "sample": "check the same of;; a small suspicious,; a suspicious suspicious.",
  "promotion": "not approved"
}

Actual training from random initialization using existing dependency-free 24-unit two-token neural architecture. 60 curriculum entries and 40 original examples used for training; six curriculum examples held out by module, vocabulary fitted only on training. Original checkpoint and sample are experimental: limited topic-conditioned word generation, not a code-understanding model, no syntax-preserving tokenizer. Loss reduction is not evidence of coding competence. No production replacement. Reproduce with node scripts/train-order66-code.mjs candidate.json. No external AI model or paid inference used. All 66 have assigned curriculum entries; not 66 trained neural models.

Next: task-specific classifiers and executable safe test fixtures, byte-level transformer scaling, independent code evaluation, scheduled candidate generation on approved corpus, peer evidence and model-quality promotion. No automatic model promotion or privileged tools.

## Peer learning experiment 001
{
  "before": {
    "loss": 1.6146193026804065,
    "accuracy": 0.2,
    "count": 120
  },
  "rounds": [
    {
      "round": 1,
      "validation": {
        "loss": 0.8498799297988213,
        "accuracy": 0.8,
        "count": 120
      }
    },
    {
      "round": 2,
      "validation": {
        "loss": 0.3680746848930426,
        "accuracy": 0.8166666666666667,
        "count": 120
      }
    },
    {
      "round": 3,
      "validation": {
        "loss": 0.2921378971251662,
        "accuracy": 1,
        "count": 120
      }
    }
  ],
  "clients": 66,
  "stepsPerClientPerRound": 180,
  "totalSteps": 35640,
  "examplesPerClient": 60,
  "validationRows": 120
}
66 tiny neural data-format classifiers, one per dedicated identity, each initialized from the same shared weights, trained on distinct synthetic samples, then averaged over three rounds. Five labels: plain text, JSON, CSV, hex, base64. No network or live source execution. This is simulated federated learning, not autonomous general intelligence, malware classification, decryption, or code synthesis. Synthetic held-out template results do not establish real-world accuracy. A weekly candidate-only CI workflow (manual trigger also) runs the two experiments with a five-minute timeout, read-only repository access and seven-day artifacts. It does not deploy, purchase compute, import unreviewed external data or continually update weights in production. Workflow execution remains to be verified.

## CODE-001 follow-up
All hourly research queries now target code, compiler, software testing, data and model engineering. Owner-only manual current-hour kickoff shares existing idempotent hour/identity claim and rate limit; existing maintenance cron provides same-hour backup, not additional unbounded runs. Root cause of absent scheduled records not established. Original restricted arithmetic compiler and JSON/hex/base64 decoder in public/order66-code-lab.mjs, with tests; no arbitrary code execution. Initial curated public repository metadata seeded separately from scheduled run evidence. Tool adoption remains subject to license, review and testing.

## November 27 source recovery
Production shows six failed scheduled attempts at 12:07 and 13:07 UTC; all six were recorded, no discoveries. Previous release cdf764e Worker deployment and Pages preflight succeeded. Failure diagnostics previously discarded the reason; new bounded status codes, source attribution, isolated peer failure and one distinct npm metadata fallback for temporary Wikidata failure (not for 401/403/429) added. Maximum two requests per assignment when eligible; archive caps rechecked as inserts accumulate. Original six manually curated tool records preserved. No successful autonomous discovery claimed. Verify diagnostics and actual source response after deploy.

## Interactive compiler lab
Original restricted compiler now exposes a per-instruction stack trace. Browser page /order66-code-lab.html links from Miss Chaos realm and displays arithmetic result, bytecode trace and bounded JSON/hex/base64 text decoder. No general code execution, filesystem or network access in tools. Source execution checks verify arithmetic and final stack; real browser/CI pending.

## Iron Crucible compiler expansion
Original arithmetic language now supports exponentiation (right associative), remainder, leading-decimal and scientific notation, and column-specific syntax errors. Single VM implementation supplies execution and stack tracing; strict instruction arity, finite arithmetic, zero-divisor checks and depth bounds remain. Ten positive arithmetic cases and eight invalid inputs passed direct checks; additional regression tests committed. Not a general-purpose language or native compiler. CI/live verification pending.
