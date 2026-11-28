import {recordControlSourcePractice} from "../chaos-forge-control-source-course.mjs";
import {recordJavaScriptPractice} from "../chaos-forge-javascript-course.mjs";
import {recordDataPractice} from "../chaos-forge-data-course.mjs";
import {recordLogicPractice} from "../chaos-forge-logic-course.mjs";
import {recordCodingPractice} from "./order100-coding-practice.mjs";
import {recordPeerAssessment} from "./order100-peer-assessments.mjs";
import {shareSoftwareReferences} from "./order66-software-sharing.mjs";
// Scheduled, non-generative public metadata discovery. Does not browse arbitrary URLs or ingest user content.
export const RESEARCH_FLEET=Object.freeze([
  {
    "key": "mc-01",
    "name": "Axiom",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "philosophy",
      "ethics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-02",
    "name": "Seshat",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "ancient Egyptian civilization",
      "archaeology"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-03",
    "name": "Mnemosyne",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "world history",
      "oral history"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-04",
    "name": "Runewake",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "historical linguistics",
      "writing systems"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-05",
    "name": "Vesper",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "comparative mythology",
      "religious studies"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-06",
    "name": "Papyrus",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "manuscript studies",
      "book history"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-07",
    "name": "Atlas",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "geography",
      "cartography"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-08",
    "name": "Lexicon",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "lexicography",
      "translation studies"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-09",
    "name": "Chronicle",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "historical chronology",
      "history of science"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-10",
    "name": "Palimpsest",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "digital preservation",
      "library science"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-11",
    "name": "Vellum",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "public domain literature",
      "bibliography"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-12",
    "name": "Quasar",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "astronomy",
      "astrophysics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-13",
    "name": "Helix",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "biology",
      "genetics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-14",
    "name": "Catalyst",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "chemistry",
      "materials science"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-15",
    "name": "Vector",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "mathematics",
      "linear algebra"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-16",
    "name": "Entropy",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "thermodynamics",
      "physics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-17",
    "name": "Gaia",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "ecology",
      "climate science"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-18",
    "name": "Circuit",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "electrical engineering",
      "electronics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-19",
    "name": "Kinetic",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "mechanical engineering",
      "robotics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-20",
    "name": "Synapse",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "cognitive science",
      "neuroscience"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-21",
    "name": "Prism",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "optics",
      "computer graphics"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-22",
    "name": "Meridian",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "statistics",
      "scientific method"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-23",
    "name": "Forge",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "compiler",
      "build systems"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-24",
    "name": "Byte",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "language tokenizer",
      "text processing"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-25",
    "name": "Kernel",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "operating systems",
      "systems programming"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-26",
    "name": "Tensor",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "machine learning framework",
      "tensor library"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-27",
    "name": "Relay",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "local inference",
      "model serving"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-28",
    "name": "Cipher",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "cryptographic library",
      "secure storage"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-29",
    "name": "Patch",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "unit testing",
      "code analysis"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-30",
    "name": "Circuitbreak",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "observability",
      "performance profiling"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-31",
    "name": "Anchor",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "database migration",
      "data integrity"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-32",
    "name": "Thread",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "job queue",
      "distributed computing"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-33",
    "name": "Warden",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "accessibility testing",
      "dependency auditing"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-34",
    "name": "Nymera",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "digital illustration",
      "graphic design"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-35",
    "name": "Chroma",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "color theory",
      "image processing"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-36",
    "name": "Echo",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "speech synthesis",
      "audio processing"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-37",
    "name": "Resonance",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "music theory",
      "sound design"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-38",
    "name": "Storyboard",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "creative writing",
      "interactive fiction"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-39",
    "name": "Glyph",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "typography",
      "font rendering"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-40",
    "name": "Spectra",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "3d modeling",
      "animation"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-41",
    "name": "Canvas",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "vector graphics",
      "drawing software"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-42",
    "name": "Lumen",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "lighting design",
      "photography"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-43",
    "name": "Pixelwitch",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "game development",
      "procedural art"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-44",
    "name": "Muse",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "creative coding",
      "generative art"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-45",
    "name": "Neural",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "neural network",
      "deep learning"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-46",
    "name": "Context",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "natural language processing",
      "language modeling"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-47",
    "name": "Gradient",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "optimization",
      "gradient descent"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-48",
    "name": "Corpus",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "open datasets",
      "data curation"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-49",
    "name": "Recall",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "information retrieval",
      "knowledge graph"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-50",
    "name": "Distill",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "model evaluation",
      "knowledge distillation"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-51",
    "name": "Tokenizer",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "byte pair encoding",
      "tokenization"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-52",
    "name": "Embedd",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "vector embedding",
      "semantic search"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-53",
    "name": "Attention",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "transformer architecture",
      "sequence modeling"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-54",
    "name": "Quant",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "model compression",
      "quantization"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-55",
    "name": "Epoch",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "continual learning",
      "catastrophic forgetting"
    ],
    "sources": [
      "wikidata",
      "github",
      "gitlab",
      "npm"
    ]
  },
  {
    "key": "mc-56",
    "name": "Veritas",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "source criticism",
      "fact checking"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-57",
    "name": "Citation",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "bibliographic database",
      "citation analysis"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-58",
    "name": "License",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "open source licensing",
      "public domain"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-59",
    "name": "Provenance",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "data provenance",
      "research integrity"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-60",
    "name": "Sanctuary",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "data privacy",
      "privacy engineering"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-61",
    "name": "Integrity",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "software supply chain security",
      "software verification"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-62",
    "name": "Baseline",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "benchmarking",
      "reproducible research"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-63",
    "name": "Contradiction",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "critical thinking",
      "logical fallacy"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-64",
    "name": "Curator",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "knowledge organization",
      "metadata standards"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-65",
    "name": "Balance",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "algorithmic fairness",
      "evaluation methodology"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-66",
    "name": "Archivist",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "version control",
      "digital curation"
    ],
    "sources": ["wikidata","github","npm","gitlab"]
  },
  {
    "key": "mc-67",
    "name": "Lexicon",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "lexical database",
      "terminology management"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-68",
    "name": "Quill",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "documentation testing",
      "literate programming"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-69",
    "name": "Semantica",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "formal semantics",
      "denotational semantics"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-70",
    "name": "Glyph",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "text normalization",
      "character encoding"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-71",
    "name": "Scriptor",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "language tooling",
      "documentation search"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-72",
    "name": "Concord",
    "division": "archive",
    "divisionName": "The Obsidian Archive",
    "topics": [
      "corpus linguistics",
      "concordance index"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-73",
    "name": "Eigen",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "eigenvalue algorithm",
      "spectral decomposition"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-74",
    "name": "Vector",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "vector arithmetic",
      "linear transformation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-75",
    "name": "Delta",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "finite difference",
      "numerical differentiation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-76",
    "name": "Sigma",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "variance estimation",
      "descriptive statistics"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-77",
    "name": "Orbit",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "Monte Carlo method",
      "sampling algorithm"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-78",
    "name": "Tensor",
    "division": "science",
    "divisionName": "The Null Observatory",
    "topics": [
      "tensor contraction",
      "multidimensional array"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-79",
    "name": "Emberforge",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "incremental compilation",
      "build cache"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-80",
    "name": "Relay",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "event driven architecture",
      "message queue"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-81",
    "name": "Atlas",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "database indexing",
      "query planning"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-82",
    "name": "Sable",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "memory allocator",
      "garbage collection"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-83",
    "name": "Cinder",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "code coverage",
      "test harness"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-84",
    "name": "Mender",
    "division": "engineering",
    "divisionName": "The Iron Crucible",
    "topics": [
      "error handling",
      "exception propagation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-85",
    "name": "Prism",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "layout engine",
      "responsive typography"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-86",
    "name": "Sonata",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "digital audio",
      "audio resampling"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-87",
    "name": "Frame",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "sprite animation",
      "frame interpolation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-88",
    "name": "Mosaic",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "image compression",
      "lossless encoding"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-89",
    "name": "Canvas",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "canvas rendering",
      "graphics pipeline"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-90",
    "name": "Focus",
    "division": "creation",
    "divisionName": "The Neon Foundry",
    "topics": [
      "keyboard navigation",
      "accessibility audit"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-91",
    "name": "Neuron",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "model architecture",
      "neural layer"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-92",
    "name": "Gradient",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "learning rate schedule",
      "optimizer state"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-93",
    "name": "Cache",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "inference cache",
      "key value cache"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-94",
    "name": "Distill",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "small language model",
      "language model evaluation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-95",
    "name": "Context",
    "division": "intelligence",
    "divisionName": "The Black Cortex",
    "topics": [
      "context window",
      "positional encoding"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-96",
    "name": "Audit",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "software reproducibility",
      "deterministic build"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-97",
    "name": "Metric",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "calibration metric",
      "prediction uncertainty"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-98",
    "name": "Ledger",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "dataset provenance",
      "metadata validation"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-99",
    "name": "Proof",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "formal verification",
      "invariant testing"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  },
  {
    "key": "mc-100",
    "name": "Sentinel",
    "division": "verification",
    "divisionName": "The Council of Ash",
    "topics": [
      "test isolation",
      "regression analysis"
    ],
    "sources": [
      "wikidata",
      "github",
      "npm",
      "gitlab"
    ]
  }
].map(x=>Object.freeze({...x,topics:Object.freeze(x.topics),sources:Object.freeze(x.sources)})));
export const KNOWLEDGE_CRON="*/5 * * * *";
export const RESEARCH_SLOT_MS=300000, RESEARCH_BATCH_SIZE=5;
const LIMIT=10000, TOOL_LIMIT=3000;
// Each specialist has an independent mission, not a division-wide duplicate search.
const CODE_MISSION_QUERIES=[["lexical analysis","lexical analyzer"],["grammar formalism","context free grammar"],["syntax tree","abstract syntax tree"],["Unicode normalization","Unicode segmentation"],["regular expression","pattern matching"],["documentation generator","API documentation"],["source mapping","debug symbols"],["symbol table","scope resolution"],["language specification","programming language semantics"],["software documentation","technical writing"],["code formatting","source code formatter"],["numerical methods","numerical integration"],["linear algebra library","sparse matrix"],["floating point arithmetic","rounding error"],["matrix multiplication","matrix factorization"],["probability distribution","Bayesian inference"],["statistical computing","statistical estimation"],["signal processing","digital filter"],["algorithm complexity","algorithm analysis"],["numerical optimization","convex optimization"],["computer graphics","rasterization"],["random number generator","pseudorandom generator"],["compiler construction","compiler optimization"],["parser generator","recursive descent parser"],["operating system kernel","systems programming"],["tensor library","automatic differentiation"],["local model inference","model serving"],["cryptographic library","secure storage"],["unit testing framework","integration testing"],["performance profiling","application tracing"],["database migration","data integrity"],["job queue","distributed computing"],["dependency auditing","static analysis"],["accessibility testing","screen reader testing"],["color contrast","color space"],["speech synthesis","text to speech"],["audio processing","audio synthesis"],["interactive fiction","narrative engine"],["font rendering","text shaping"],["animation engine","skeletal animation"],["vector graphics","SVG rendering"],["image processing","image transformation"],["game engine","collision detection"],["procedural generation","procedural noise"],["neural network","deep learning"],["language modeling","sequence modeling"],["gradient descent","stochastic optimization"],["dataset curation","dataset validation"],["information retrieval","search indexing"],["model evaluation","evaluation metrics"],["byte pair encoding","subword tokenization"],["vector embedding","semantic search"],["transformer architecture","attention mechanism"],["model quantization","model compression"],["continual learning","catastrophic forgetting"],["source verification","fact checking"],["bibliographic metadata","citation analysis"],["software licensing","license compliance"],["data provenance","research integrity"],["privacy engineering","data minimization"],["software supply chain security","dependency verification"],["benchmark reproducibility","performance benchmark"],["property based testing","test generation"],["metadata standards","knowledge organization"],["algorithmic fairness","evaluation methodology"],["version control","digital preservation"],["lexical database","terminology management"],["documentation testing","literate programming"],["formal semantics","denotational semantics"],["text normalization","character encoding"],["language tooling","documentation search"],["corpus linguistics","concordance index"],["eigenvalue algorithm","spectral decomposition"],["vector arithmetic","linear transformation"],["finite difference","numerical differentiation"],["variance estimation","descriptive statistics"],["Monte Carlo method","sampling algorithm"],["tensor contraction","multidimensional array"],["incremental compilation","build cache"],["event driven architecture","message queue"],["database indexing","query planning"],["memory allocator","garbage collection"],["code coverage","test harness"],["error handling","exception propagation"],["layout engine","responsive typography"],["digital audio","audio resampling"],["sprite animation","frame interpolation"],["image compression","lossless encoding"],["canvas rendering","graphics pipeline"],["keyboard navigation","accessibility audit"],["model architecture","neural layer"],["learning rate schedule","optimizer state"],["inference cache","key value cache"],["small language model","language model evaluation"],["context window","positional encoding"],["software reproducibility","deterministic build"],["calibration metric","prediction uncertainty"],["dataset provenance","metadata validation"],["formal verification","invariant testing"],["test isolation","regression analysis"]];
// Historical database column "hour" now contains a five-minute slot ID for new runs; old hourly IDs remain intact.
export function assignments(time){const hour=Math.floor(Number(time)/RESEARCH_SLOT_MS);if(!Number.isSafeInteger(hour)||hour<0)throw Error("invalid schedule");const cycle=Math.floor(hour/(RESEARCH_FLEET.length/RESEARCH_BATCH_SIZE));return Array.from({length:RESEARCH_BATCH_SIZE},(_,i)=>{const index=(hour*RESEARCH_BATCH_SIZE+i)%RESEARCH_FLEET.length,row=RESEARCH_FLEET[index];return {hour,key:row.key,name:row.name,division:row.division,query:CODE_MISSION_QUERIES[index][Math.floor(cycle/4)%2],source:row.sources[(cycle+index)%4]};});}
export function normalizeCandidates(payload){if(payload?.error)throw Error("source error");const results=Array.isArray(payload?.search)?payload.search:[];return results.slice(0,3).flatMap(x=>{const id=String(x.id||""),title=String(x.label||"").trim().slice(0,150),description=String(x.description||"").trim().slice(0,300);return /^Q[1-9][0-9]{0,14}$/.test(id)&&title&&description?[{id,title,description,url:"https://www.wikidata.org/wiki/"+id,license:"CC0-1.0"}]:[];});}
async function enabled(env){const row=await env.DB.prepare("SELECT k.enabled AS enabled,e.paused AS paused FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1").first();return row!=null&&Number(row.enabled)===1&&Number(row.paused)===0;}
async function readLimited(response){if(!response.ok)throw Object.assign(Error("source unavailable"),{sourceStatus:response.status});if(!response.body)throw Error("source empty");const r=response.body.getReader();let n=0,s="";const d=new TextDecoder();try{while(true){const {done,value}=await r.read();if(done)break;n+=value.byteLength;if(n>32000){await r.cancel();throw Error("source too large");}s+=d.decode(value,{stream:true});}try{return JSON.parse(s+d.decode());}catch{throw Error("invalid source JSON");}}finally{r.releaseLock();}}
const runtimeFetch=(...args)=>globalThis.fetch(...args);
async function researchResponse(url,headers,fetcher){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);try{const response=await fetcher(url,{redirect:"error",headers,signal:controller.signal});return await readLimited(response);}finally{clearTimeout(timer);}}
export async function discover(query,fetcher=runtimeFetch){const u=new URL("https://www.wikidata.org/w/api.php");for(const [k,v] of Object.entries({action:"wbsearchentities",search:query,language:"en",format:"json",limit:"3",type:"item",maxlag:"5"}))u.searchParams.set(k,v);return normalizeCandidates(await researchResponse(u.href,{"accept":"application/json","user-agent":"KnightfallKnowledge/1.0 (https://ash-fall.com)","api-user-agent":"KnightfallKnowledge/1.0 (https://ash-fall.com)"},fetcher));}
// Discovery metadata only. No repository cloning, arbitrary URLs, installation, shell commands or code execution.
const safeText=(v,n)=>String(v??"").trim().slice(0,n);
export function toolCandidates(source,payload){
 const results=source==="github"?payload?.items:source==="gitlab"?payload:source==="npm"?payload?.objects:undefined;
 if(!Array.isArray(results))throw Error("invalid tool response");
 return results.slice(0,3).flatMap(item=>{
  let id,title,url,license,version;
  if(source==="github"){if(item.private!==false||item.archived===true||!/^[-A-Za-z0-9_.]+\/[-A-Za-z0-9_.]+$/.test(item.full_name||""))return [];id=title=item.full_name;url="https://github.com/"+id;license=item.license?.spdx_id;version=item.default_branch;}
  else if(source==="gitlab"){if(item.visibility!=="public"||!Number.isSafeInteger(item.id)||item.id<=0||!/^[-A-Za-z0-9_.]+(?:\/[-A-Za-z0-9_.]+)+$/.test(item.path_with_namespace||""))return [];id=String(item.id);title=item.path_with_namespace;url="https://gitlab.com/"+title;license=item.license?.key;version=item.default_branch;}
  else if(source==="npm"){const p=item.package;if(!p||!/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(p.name||""))return [];id=title=p.name;url="https://www.npmjs.com/package/"+encodeURIComponent(id).replace(/%2F/gi,"/");license=p.license;version=p.version;}
  if(!id||id.length>200||title.length>200||title.split("/").some(part=>part==="."||part===".."))return [];
  return [{id:source+":"+id,source,title,url,license:safeText(license,100)||"unknown",version:safeText(version,100)||"unknown"}];
 });
}
export async function discoverTools(source,query,fetcher=runtimeFetch){
 let u;
 if(source==="github"){u=new URL("https://api.github.com/search/repositories");u.searchParams.set("q",query+" in:name,description is:public archived:false");u.searchParams.set("per_page","3");}
 else if(source==="gitlab"){u=new URL("https://gitlab.com/api/v4/projects");u.searchParams.set("search",query);u.searchParams.set("visibility","public");u.searchParams.set("simple","true");u.searchParams.set("per_page","3");}
 else if(source==="npm"){u=new URL("https://registry.npmjs.org/-/v1/search");u.searchParams.set("text",query);u.searchParams.set("size","3");}
 else throw Error("unknown source");
 return toolCandidates(source,await researchResponse(u.href,{"accept":"application/json","user-agent":"KnightfallKnowledge/2.0 (https://ash-fall.com)"},fetcher));
}
// A peer lesson is an approved evidence reference, not a generated fact or neural weight update.
export const PEER_LESSONS_PER_ASSIGNMENT=16;
export async function sharePeerEvidence(env,a,now){
 // One atomic, bounded insert replaces the read-then-write race and avoids extra D1 round trips.
 const result=await env.DB.prepare("INSERT OR IGNORE INTO chaos_knowledge_lessons(learner_key,entity_id,teacher_key,received_at) SELECT ?,c.entity_id,c.agent_key,? FROM chaos_knowledge_candidates c WHERE c.review_status='approved' AND (c.agent_key LIKE 'mc-%' OR c.agent_key='manual-curation') AND c.agent_key<>? AND NOT EXISTS(SELECT 1 FROM chaos_knowledge_lessons l WHERE l.learner_key=? AND l.entity_id=c.entity_id) AND EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ORDER BY CASE WHEN c.division=? THEN 0 ELSE 1 END,c.reviewed_at DESC,c.entity_id LIMIT ?").bind(a.key,now,a.key,a.key,a.division,PEER_LESSONS_PER_ASSIGNMENT).run();
 return Number(result.meta?.changes||0);
}
export function failureCode(error){
 const code=Number(error?.sourceStatus);
 if(Number.isInteger(code)&&code>=400&&code<=599)return "http_"+code;
 if(error?.name==="TimeoutError"||error?.name==="AbortError")return "timeout";
 if(error?.name==="TypeError")return "fetch_or_runtime_type_error";
 if(error?.message==="source too large")return "response_limit";
 if(error?.message==="invalid source JSON"||error?.message==="invalid tool response"||error?.message==="source error")return "invalid_source";
 return "request_or_storage_error";
}
export async function collectAssignment(a,fetcher=runtimeFetch,{allowToolFallback=true}={}){
 let source=a.source,primaryFailure=null;
 try{return {source,records:source==="wikidata"?await discover(a.query,fetcher):await discoverTools(source,a.query,fetcher),primaryFailure};}
 catch(error){primaryFailure=failureCode(error);if(!allowToolFallback||source!=="wikidata"||["http_429","http_401","http_403"].includes(primaryFailure))return {source,records:[],primaryFailure,error:primaryFailure};}
 // A distinct public software catalog can provide useful coding references if the knowledge source is temporarily unavailable.
 source="npm";try{return {source,records:await discoverTools(source,a.query,fetcher),primaryFailure};}catch(error){return {source,records:[],primaryFailure,error:failureCode(error)};}
}
export async function runKnowledgeResearch(env,time,{fetcher=runtimeFetch,retryFailed=false,collector=collectAssignment}={}){
 if(!await enabled(env))return {reason:"paused",completed:0};
 let count=Number((await env.DB.prepare("SELECT COUNT(*) AS n FROM chaos_knowledge_candidates").first())?.n||0);
 let toolCount=Number((await env.DB.prepare("SELECT COUNT(*) AS n FROM chaos_knowledge_tools").first())?.n||0);
 let completed=0,failed=0,peerLessons=0,peerFailures=0,uniqueDiscoveries=0,returnedRecords=0,codingPractices=0,codingPracticeFailures=0;
 const pending=[];
 for(const a of assignments(time)){
  if(!await enabled(env))break;
  try{await recordLogicPractice(env,a);}catch{console.warn("order100_logic_practice_unavailable");}
  try{await recordDataPractice(env,a);}catch{console.warn("order100_data_practice_unavailable");}
  try{if(Math.floor(a.hour/20)%2===0)await recordJavaScriptPractice(env,a);else await recordControlSourcePractice(env,a);}catch{console.warn("order100_source_practice_unavailable");}
  // Local coding practice continues even when public source requests fail or the archive is full.
  try{const practice=await recordCodingPractice(env,a);codingPractices+=practice.recorded;codingPracticeFailures+=Number(!practice.verified);}catch{codingPracticeFailures++;console.warn("order100_coding_practice_unavailable");}
  // Learning from existing reviewed evidence does not depend on successful network discovery or archive capacity.
  try{peerLessons+=await sharePeerEvidence(env,a,new Date().toISOString());}catch{peerFailures++;}
  if(a.source==="wikidata"?count>=LIMIT-3:toolCount>=TOOL_LIMIT-3)continue;
  const now=new Date().toISOString();
  let claim=await env.DB.prepare("INSERT OR IGNORE INTO chaos_knowledge_runs(hour,agent_key,division,query,status,started_at) VALUES(?,?,?,?,'running',?)").bind(a.hour,a.key,a.division,a.query,now).run();
  if(claim.meta?.changes!==1&&retryFailed){
   const retryKey="order66_retry:"+a.hour+":"+a.key;
   const prior=await env.DB.prepare("SELECT primary_failure,error_code FROM chaos_knowledge_run_diagnostics WHERE hour=? AND agent_key=?").bind(a.hour,a.key).first();
   const reserved=await env.DB.prepare("INSERT OR IGNORE INTO site_settings(key,value,updated_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_runs WHERE hour=? AND agent_key=? AND status='failed')").bind(retryKey,JSON.stringify({previous:prior||null,attempt:"runner-fallback"}),now,a.hour,a.key).run();
   if(reserved.meta?.changes===1)claim=await env.DB.prepare("UPDATE chaos_knowledge_runs SET status='running',started_at=? WHERE hour=? AND agent_key=? AND status='failed'").bind(now,a.hour,a.key).run();
  }
  if(claim.meta?.changes!==1)continue;
  // Claim first; start bounded source requests immediately, while keeping archive writes serial.
  const collected=Promise.resolve().then(()=>collector(a,fetcher,{allowToolFallback:toolCount<TOOL_LIMIT-3})).then(data=>({data}),error=>({error}));
  pending.push({a,now,collected});
 }
 for(const {a,now,collected} of pending){
  let status="failed",found=0,source=a.source,primaryFailure=null,errorCode=null;
  try{
   const outcome=await collected;if(outcome.error)throw outcome.error;const data=outcome.data;source=data.source;primaryFailure=data.primaryFailure;errorCode=data.error||null;
   if(!await enabled(env)){status="paused";}
   else if(!errorCode){
    const records=data.records.slice(0,Math.max(0,Math.min(3,source==="wikidata"?LIMIT-count:TOOL_LIMIT-toolCount)));
    const writes=source!=="wikidata"?records.map(r=>env.DB.prepare("INSERT OR IGNORE INTO chaos_knowledge_tools(tool_id,source,title,source_url,declared_license,version_hint,agent_key,division,query,retrieved_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(r.id,r.source,r.title,r.url,r.license,r.version,a.key,a.division,a.query,now)):records.map(r=>env.DB.prepare("INSERT OR IGNORE INTO chaos_knowledge_candidates(entity_id,title,description,source_url,license,agent_key,division,query,retrieved_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(r.id,r.title,r.description,r.url,r.license,a.key,a.division,a.query,now));
    if(writes.length){const out=await env.DB.batch(writes);found=out.reduce((n,x)=>n+Number(x.meta?.changes||0),0);}
    returnedRecords+=data.records.length;uniqueDiscoveries+=found;if(source==="wikidata")count+=found;else toolCount+=found;
    status="complete";completed++;
    try{await recordPeerAssessment(env,RESEARCH_FLEET,a,{...data,records},new Date().toISOString());}catch{console.warn("order100_peer_assessment_unavailable");}

   }
  }catch(error){errorCode=failureCode(error);}
  if(status==="failed")failed++;
  await env.DB.prepare("UPDATE chaos_knowledge_runs SET status=?,found=?,finished_at=? WHERE hour=? AND agent_key=?").bind(status,found,new Date().toISOString(),a.hour,a.key).run();
  try{await env.DB.prepare("INSERT OR REPLACE INTO chaos_knowledge_run_diagnostics(hour,agent_key,source_requested,source_used,primary_failure,error_code) VALUES(?,?,?,?,?,?)").bind(a.hour,a.key,a.source,source,primaryFailure,errorCode).run();}catch{console.warn("chaos_knowledge_diagnostics_unavailable");}
 }
 let softwareBroadcasts=0;try{softwareBroadcasts=await shareSoftwareReferences(env);}catch{console.warn("order66_software_share_unavailable");}
 return {completed,failed,peerLessons,peerFailures,softwareBroadcasts,uniqueDiscoveries,returnedRecords,duplicates:returnedRecords-uniqueDiscoveries,codingPractices,codingPracticeFailures};
}
export async function knowledgeStatus(env){const active=await enabled(env);const totals=(await env.DB.prepare("SELECT review_status,count(*) AS count FROM chaos_knowledge_candidates GROUP BY review_status").all()).results||[];const latest=(await env.DB.prepare("SELECT r.agent_key,r.division,r.query,r.status,r.found,r.started_at,d.source_requested,d.source_used,d.primary_failure,d.error_code FROM chaos_knowledge_runs r LEFT JOIN chaos_knowledge_run_diagnostics d ON d.hour=r.hour AND d.agent_key=r.agent_key ORDER BY r.hour DESC,r.agent_key LIMIT 32").all()).results||[];const candidates=(await env.DB.prepare("SELECT entity_id,title,description,source_url,license,agent_key,retrieved_at FROM chaos_knowledge_candidates WHERE review_status='pending' ORDER BY retrieved_at DESC,entity_id LIMIT 30").all()).results||[];const tools=(await env.DB.prepare("SELECT tool_id,source,title,source_url,declared_license,version_hint,agent_key,review_status FROM chaos_knowledge_tools ORDER BY retrieved_at DESC,tool_id LIMIT 30").all()).results||[];const toolTotals=(await env.DB.prepare("SELECT review_status,count(*) AS count FROM chaos_knowledge_tools GROUP BY review_status").all()).results||[];const lessons=await env.DB.prepare("SELECT count(*) AS count FROM chaos_knowledge_lessons").first();return {active,roster:RESEARCH_FLEET.length,divisions:RESEARCH_FLEET,totals,latest,candidates,tools,toolTotals,lessons:lessons?.count||0,cron:KNOWLEDGE_CRON,slotMinutes:5,batchSize:RESEARCH_BATCH_SIZE,assignmentsPerHour:RESEARCH_BATCH_SIZE*12,rotationMinutes:RESEARCH_FLEET.length/RESEARCH_BATCH_SIZE*5,peerLessonsPerAssignment:PEER_LESSONS_PER_ASSIGNMENT,training:"five-minute coding research; every specialist rotates across public software catalogs; reviewed knowledge available to owner; no automatic weight update"};}
export async function reviewKnowledge(env,id,decision,actor){if(!/^Q[1-9][0-9]{0,14}$/.test(id)||!["approved","rejected"].includes(decision))throw Error("invalid review");const r=await env.DB.prepare("UPDATE chaos_knowledge_candidates SET review_status=?,reviewed_by=?,reviewed_at=? WHERE entity_id=? AND review_status='pending'").bind(decision,String(actor),new Date().toISOString(),id).run();return r.meta?.changes===1;}
export async function exportKnowledge(env){const rows=(await env.DB.prepare("SELECT entity_id,title,description,source_url,license,reviewed_at FROM chaos_knowledge_candidates WHERE review_status='approved' ORDER BY entity_id LIMIT 10000").all()).results||[];return {schema:"miss-chaos-reviewed-cc0-v1",rows};}

export async function searchReviewedKnowledge(env,query){
 const term=String(query||"").trim().slice(0,90);
 if(term.length<2||/[@%_\r\n]|\b\d{10,}\b/.test(term))return {source:"Miss Chaos reviewed public archive",results:[]};
 const rows=(await env.DB.prepare("SELECT entity_id,title,description,reviewed_at FROM chaos_knowledge_candidates WHERE review_status='approved' AND (lower(title) LIKE ? OR lower(description) LIKE ?) ORDER BY CASE WHEN lower(title)=? THEN 0 ELSE 1 END, reviewed_at DESC LIMIT 6").bind("%"+term.toLowerCase()+"%","%"+term.toLowerCase()+"%",term.toLowerCase()).all()).results||[];
 return {source:"Miss Chaos reviewed public archive",license:"CC0 structured metadata; corroborate facts",results:rows.filter(r=>/^Q[1-9][0-9]{0,14}$/.test(r.entity_id)).map(r=>({title:String(r.title).slice(0,150),description:String(r.description).slice(0,300),url:"https://www.wikidata.org/wiki/"+r.entity_id,reviewed_at:r.reviewed_at,license:"CC0-1.0"}))};
}
export async function reviewToolCandidate(env,id,decision,actor){
 if(typeof id!=="string"||id.length>210||! /^(github|gitlab|npm):[^\s]+$/.test(id)||!["approved","rejected"].includes(decision))throw Error("invalid tool review");
 const r=await env.DB.prepare("UPDATE chaos_knowledge_tools SET review_status=?,reviewed_by=?,reviewed_at=? WHERE tool_id=? AND review_status='pending'").bind(decision,String(actor),new Date().toISOString(),id).run();return r.meta?.changes===1;
}
