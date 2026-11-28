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

## Chaos Core 004 — causal-attention experiment (November 28)
Original single-block causal self-attention, learned token/position embeddings, query/key/value/output projections and residual tanh feed-forward layer. Width 24, 32-token context, 517-symbol word vocabulary, 28,981 trainable parameters. No pretrained weights, inference API, or private data. 152 authored training examples, 16 validation, 9 separate initial test. Actual 6,000 Adam updates from seed 28004; selected 5,000-step checkpoint by validation loss. Validation 6.222912→4.139118, accuracy 32.5%; separate test 6.231950→4.376376, accuracy 31.18%, including unknown tokens. Samples confuse compiler/cache/token concepts: not a qualified production model. Reproducible trainer: node scripts/train-chaos-core-004.mjs /new/candidate.json. Exact samples in training/chaos-core-004-samples.json. Osiris local-model POST accepts chaos-core-004; independent council command `generate chaos core 004: what is a compiler`. 003 remains default; production unchanged. Analytic-gradient, checkpoint and authorization tests authored; CI/live acceptance pending. This is a compact transformer-style research architecture, not a full modern LLM.

## Chaos Core Recall 001 — evidence retrieval research
Original sparse hashed word/character/bigram softmax classifier trained with 44250 updates on 590 examples (including repeated features), 35910 parameters. 69 authored concepts, 207 aliases. Held-out alias test: neural top-1 45/69, accepted neural 44/69; hybrid exact-alias lookup 69/69, unsupported abstention 22/22. Exact aliases are curated, not unseen factual generalization. Prior exploratory ranker reached 42/69 accepted and failed the 70% floor. This hybrid explicitly reports neural agreement vs deterministic fallback; no neural-only promotion. Source lesson IDs and authored text returned, no external inference. Existing public chat and generative checkpoint defaults unchanged. Research references: https://arxiv.org/abs/2005.11401 and https://arxiv.org/abs/2109.01652 (architectural inspiration, no imported weights or claims of reproducing their results). CI and live deployment pending.

## Chaos Core engineering evidence and byte tokenizer — November 28
- 45 newly authored engineering/ML lessons added to the 69 existing concepts (114 concepts, 342 unique explicit aliases). Compiler, decompiler, WebAssembly, testing, concurrency, deployment, tokenization and verification topics. Independent council supports bounded comparison of two distinct concepts and lists of up to four definitions; only exact reviewed-in-code aliases compose evidence, unknown comparisons abstain, no neural synthesis claim. All 18 direct routing/abstention fixtures passed before commit.
- Trained a deterministic byte-pair tokenizer with 256 learned merges, vocabulary 512, on 228 authored text strings. Training corpus 9,013 UTF-8 bytes → 3,760 tokens. Seven lossless source, multilingual, whitespace and empty-string round trips passed directly. This tokenizer is a research artifact for future checkpoints; existing word-token models are not compatible and remain unchanged. Reproduce with `node scripts/train-chaos-core-byte-bpe.mjs /new/tokenizer.json`. No external weights, new paid compute, or production chat replacement. CI and authenticated live verification pending. Research background: https://aclanthology.org/D19-1410/ (learned semantic retrieval; not implemented SBERT), https://arxiv.org/abs/1508.07909 (subword BPE).

## Chaos Core 005 — original prompt-conditioned byte-pair checkpoint
Actual training run: 16,000 SGD updates from random seed 28006, width 32, 64-token prompt pooling, six positional autoregressive history tokens, 514 IDs including start/end markers, 132,130 parameters. 213 original training pairs including 29 JavaScript/Python/JSON examples, 13 validation pairs, 13 separate test pairs. Selected step 14,000 by validation loss (6.244888 to 4.822838; 15.13% token accuracy). Separate test loss 6.241792 to 4.656411; accuracy 20.55%. Tokenizer fixed from prior 114-concept corpus, so held-out concept text may have influenced token merges; it was excluded from neural weight training. Sample code and definitions are invalid or incoherent, no production promotion and no automatic execution. Original causal attention 004 remains separate; 005 uses a simpler pooled prompt/positional architecture, not a longer autoregressive attention window. Reproduce with `node scripts/train-chaos-core-005.mjs /new/checkpoint.json`. Explicit owner selection `generate chaos core 005: ...`; 003 remains default. All samples preserved, no third-party weights or new paid services. CI and live verification pending.

## Chaos Core scalar script synthesis — November 28
- Original bounded grammar of 171 scalar arithmetic candidates. Three to sixteen distinct two-integer examples, optional disjoint validation, JavaScript/Python emission, ambiguity probes and explicit no-match. All typed interpreter checks in two simulated 100-specialist peer rounds passed (1,200/1,200 cases, four ambiguous sets each round). Not live bot activity or neural weight training. CI adds native Node and isolated Python interpreter checks for fixed generated source; those CI checks have not yet run in this session.
- `synthesize scalar: {"language":"python","examples":[{"input":[0,0],"output":3},{"input":[1,5],"output":5},{"input":[-2,1],"output":-1}],"validation":[{"input":[10,7],"output":23}]}`. `build scalar script:` uses identical input and creates an owner-scoped expiring .py/.mjs attachment only if one candidate remains and at least one validation input was supplied. No arbitrary code execution, external model, or deployment. `scalar training status` runs the bounded simulated benchmark. Existing models remain unchanged; native CI and authenticated live download pending.

## Chaos Core text pipeline synthesis — November 28
- 15 original ASCII text operations, depth 1–3, exhaustive 3,166 candidate search at depth 3, independent validation, disambiguating probes. Two simulated 100-specialist rounds (0 and 52), each 500/500 held-out typed interpreter checks; 12 oracle families, five ambiguous and 79 probe-agreement sets per round. Probe agreement does not prove equivalence. Four-step lowercase/trim/whitespace-collapse/hyphen slug example failed within depth 3; preserved in evaluation. No live bot activity or neural weight updates.
- `synthesize text:` accepts JSON `{language,examples:[{input,output}],validation:[{input,output}],maxDepth}`. `build text script:` requires disjoint validation and a unique grammar match or explicitly supplied `operations` list that matches every example; returns owner-only expiring .py/.mjs artifact. ASCII input bound 256 characters chosen for matching cross-language behavior; Unicode not supported by this tool. `text training status` reports simulated benchmark. Native JavaScript/Python execution tests authored; live CI/download verification pending. No third-party inference or paid dependencies.
