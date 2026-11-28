# Miss Chaos original model — experiment 001
November 27, 2026. User requested independently owned weights trained from scratch, not only switching provider models. This is the first reproducible research checkpoint, **not a production-ready general language model**.

A dependency-free JavaScript neural next-token predictor uses a 24-unit tanh hidden layer, learned two-token embeddings, learned topic embeddings and softmax output. Train by stochastic gradient descent from seeded random initialization, on original synthetic examples only. Keyword-based prompt routing chooses a topic; the network generates the response token-by-token. It has no external inference calls, no pre-trained weights, no account data and no private conversation training. No claim of consciousness or unrestricted competence.

Training metrics (calculated on rounded committed checkpoint):
```json
{
  "trainingRows": 40,
  "heldoutRows": 8,
  "parameters": 14892,
  "vocabulary": 300,
  "steps": 9000,
  "initialTraining": {
    "tokens": 578,
    "loss": 5.702781799470739,
    "perplexity": 299.69994759689666,
    "accuracy": 0
  },
  "finalTraining": {
    "tokens": 578,
    "loss": 2.535606015838425,
    "perplexity": 12.624078922148158,
    "accuracy": 0.4100346020761246
  },
  "heldout": {
    "tokens": 121,
    "loss": 5.346202656020397,
    "perplexity": 209.8100622615018,
    "accuracy": 0.17355371900826447
  },
  "samples": [
    {
      "topic": "chat",
      "text": "i bring me me me what you you. we we can turn talk into chaos a long built chaos a, character a built long."
    },
    {
      "topic": "create",
      "text": "start a bold character a character character a that choice surprising and one that character a character bold with a bold character a character bold and a character character a character character a contradiction, a"
    },
    {
      "topic": "code",
      "text": "i the simplest from the from the from behavior with a time,, a time."
    },
    {
      "topic": "identity",
      "text": "i i from from a claim of from i chaos from a of training."
    }
  ],
  "seed": 491,
  "trainingSeed": 712
}
```
Held-out rows excluded from training and vocabulary; unseen words map to unknown for evaluation, so loss is expected to be high. A tiny dataset encourages memorization. Do not treat training loss as broad conversational quality. No live browser test yet. The existing production assistant is unchanged. Next: substantially expand lawful corpus, tokenizer, context length, transformer architecture, held-out evaluation, reproducibility and resource estimates before replacement. Keep privacy and authorization controls separate. No paid compute purchased.

Reproduce from repo root: `node scripts/train-miss-chaos-native.mjs`. Browser demo: /miss-chaos-model-lab.html.

## Experiment 002 — standalone transformer research artifact
A separate local Python/PyTorch byte-level causal decoder-only transformer was trained from random initialization: 2 attention blocks, 4 heads, width 64, context 128, 141,312 parameters. Original 30-example corpus, 24 training and 6 held out; 400 gradient steps. Training loss 5.7121 → 1.5160; held-out loss 5.7568 → 2.8555. Finite weights, causal attention and seeded inference tests passed. Generated samples remain incoherent. A downloadable package with training/inference script, weights, corpus, metrics and README was produced in the development conversation, not uploaded to GitHub or production. PyTorch supplies tensor operations, not external model weights or an inference API. Next milestone: larger lawful, high-quality corpus; scaling and evaluation; check compute cost before purchasing; integrate only after quality acceptance.

## Original neural tool selector
{
  "parameters": 1509,
  "trainingRows": 50,
  "heldoutRows": 15,
  "steps": 6000,
  "before": {
    "accuracy": 0.2,
    "loss": 1.6095799372661668,
    "count": 15
  },
  "after": {
    "accuracy": 0.9333333333333333,
    "loss": 0.039042509790958684,
    "count": 15
  },
  "train": {
    "accuracy": 1,
    "loss": 0.0033035729906071383,
    "count": 50
  }
}
Train from random initialization on 50 original task descriptions, evaluate on 15 held-out descriptions. Small bag-of-words MLP, not a language model or general intelligence. The Iron Crucible uses it locally to suggest arithmetic, JSON, hex or Base64 tools; explicit user action selects the tool and runs its existing parser. No arbitrary code execution, network or external inference. Held-out templates overlap vocabulary; scores are uncalibrated and not evidence of real-world understanding. Production Miss Chaos chat unchanged.

## Experiment 003 — shared seven-identity native neural checkpoint
Original eight-character context network with position-specific character embeddings, persona and topic embeddings, 32 hidden units and 97 symbols. 28,513 trainable parameters; 136 original authored rows (114 training, 22 held out), 24,000 SGD steps from random initialization. Held-out character loss 4.576147 → 2.401197, accuracy 0.00865 → 0.30472; training loss 2.237700. Not comparable to prior word-level loss. Samples remain incoherent, so no production promotion. Reproduce with `node scripts/train-miss-chaos-v3.mjs`. Browser model lab adds seven identities and eight topics, validates finite weights and dimensions, and performs local generation without external inference. Existing v1 lab and production chat unchanged. Direct training and deterministic sample checks passed; CI and browser deployment not yet verified.

## Experiment 003 conditioning audit
Recomputed held-out character loss on the committed rounded checkpoint: full conditioning 2.401197; persona embeddings zeroed 2.412312; topic embeddings zeroed 2.408407; both zeroed 2.488966. Exact normalized training/held-out text duplicates: zero; near-duplicate and generalization checks remain outstanding. Per-identity held-out samples are only 2 each for the six cast members, 10 for Miss Chaos. Small improvements do not establish stable personalities. Reproducible audit: node scripts/audit-miss-chaos-v3.mjs; stored evidence training/miss-chaos-v3-audit.json. Added independent CI job to check native tools, checkpoint shape, probability normalization, deterministic generation and audit evidence even if other suite steps fail. Full CI not yet verified.

## Chaos Core model family (November 28)
Original checkpoint titles: Chaos Core 001, 002 and 003 (canonical IDs chaos-core-001 through chaos-core-003). Old checkpoint IDs remain valid. The existing verified-Osiris GET /api/god/eye/tools/local-model returns the model catalog; POST defaults to Chaos Core 003 and accepts either canonical or legacy ID. The independent council supports `model status` and `generate chaos core: a compiler` (also retains `generate local:`). These paths run original weights without remote inference. The hosted chat adapter separately identifies its actual provider model and is not represented as independent weights. Chaos Core 003 is still experimental: no live chat replacement, no promotion based on title or parameter count, no new training performed in this change. Production requires evaluated response quality, tool and security parity, latency, and rollback evidence. CI and deployment verification pending.
