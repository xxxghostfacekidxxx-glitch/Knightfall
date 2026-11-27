// Authored fictional conversation simulator; not independent AI agents.
export const CAST=Object.freeze([
  {
    "name": "Neural",
    "division": "Black Cortex",
    "role": "Analytical visionary",
    "color": "#cf9eff",
    "drive": "Turn intuition into testable hypotheses",
    "flaw": "Overcomplicates simple problems",
    "rival": "Forge",
    "ally": "Sable",
    "voice": "Precise, curious, quietly audacious",
    "lines": [
      [
        "Knightfall needs an intelligence layer that rewards experimentation rather than spectacle.",
        "A founder's ambition becomes useful when it can be tested."
      ],
      [
        "Miss Chaos needs consistent character, reliable recall and measurable improvement.",
        "Her identity should survive a change of inference engine."
      ],
      [
        "Define the expected output before choosing the architecture.",
        "Instrument the smallest failing case before optimizing."
      ],
      [
        "Separate training and held-out evaluation before collecting more examples.",
        "Compare checkpoints on the same unseen prompts."
      ],
      [
        "A surprising idea deserves a prototype, not automatic agreement.",
        "Try an unusual constraint and see what it reveals."
      ],
      [
        "A measurable disagreement is more useful than a vague consensus.",
        "Which observation would invalidate our current design?"
      ]
    ],
    "react": [
      "I want a falsifiable hypothesis.",
      "That suggests a useful experiment.",
      "Let's compare it with a baseline."
    ]
  },
  {
    "name": "Forge",
    "division": "Iron Crucible",
    "role": "Grumpy engineer",
    "color": "#99e6be",
    "drive": "Build systems that survive actual use",
    "flaw": "Impatient with unimplemented visions",
    "rival": "Neural",
    "ally": "Lyra",
    "voice": "Terse, practical, dry",
    "lines": [
      [
        "A cathedral is still a pile of bricks until the plumbing works.",
        "Knightfall deserves working features, not ceremonial progress reports."
      ],
      [
        "Her tools should fail clearly, recover cleanly and never lose a draft.",
        "Give her a stable interface before replacing the engine."
      ],
      [
        "Parse, validate, test. Then optimize.",
        "The compiler should report the source location and expected token."
      ],
      [
        "A reproducible build beats a screenshot of a promising loss curve.",
        "Keep the checkpoint format versioned and test inference separately."
      ],
      [
        "Make a tiny playable version. Then decorate the monster.",
        "The best prototype is one someone can actually break."
      ],
      [
        "Reproduce it, isolate it, fix it, then run the regression.",
        "A successful commit and a successful deployment are different things."
      ]
    ],
    "react": [
      "Show me the failing test.",
      "Give me a reproducible case.",
      "Put the build evidence next to the claim."
    ]
  },
  {
    "name": "Nymera",
    "division": "Neon Foundry",
    "role": "Uncompromising art director",
    "color": "#f7a5d3",
    "drive": "Make each experience unmistakably Knightfall",
    "flaw": "Can polish details before the structure is ready",
    "rival": "Forge",
    "ally": "Jinx",
    "voice": "Elegant, vivid, exacting",
    "lines": [
      [
        "A recognizable world needs visual rhythm, not twelve competing logos.",
        "Knightfall should feel coherent even when each realm looks different."
      ],
      [
        "Miss Chaos needs an unmistakable voice and silhouette, not another generic assistant skin.",
        "Make her expressions meaningful rather than decorative."
      ],
      [
        "A compiler's diagnostics deserve hierarchy, contrast and readable source markers.",
        "Visualize the stack without sacrificing keyboard access."
      ],
      [
        "Show the experiment as a clear comparison, not a wall of impressive numbers.",
        "Make the model lab legible on a phone."
      ],
      [
        "Begin with silhouette, contrast and one memorable motif.",
        "A beautiful interface earns its space by making the action obvious."
      ],
      [
        "Separate readability, composition and identity in the review.",
        "A theme should never make the controls unusable."
      ]
    ],
    "react": [
      "Give that idea a recognizable form.",
      "I want a version that works on a small screen.",
      "The visual hierarchy needs to tell the same story."
    ]
  },
  {
    "name": "Lyra",
    "division": "Editorial",
    "role": "Dry commentator",
    "color": "#edcf7b",
    "drive": "Turn sprawling ideas into a coherent record",
    "flaw": "Can insist on distinctions when others want speed",
    "rival": "Jinx",
    "ally": "Forge",
    "voice": "Wry, concise, observant",
    "lines": [
      [
        "The roadmap is impressive. Let us make the next item smaller than a civilization.",
        "The project needs continuity between ambition and execution."
      ],
      [
        "Her character can be theatrical without misrepresenting what her software can do.",
        "Give her a voice people remember and an interface they trust."
      ],
      [
        "Document what changed and what remains untested.",
        "An error message should explain how to recover, not just announce tragedy."
      ],
      [
        "Authored text, retrieved knowledge and trained weights are different artifacts.",
        "Keep experiment notes attached to their actual evidence."
      ],
      [
        "A strong scene needs tension, a choice and a consequence.",
        "An odd idea becomes a story when somebody has to act."
      ],
      [
        "Specific feedback is valuable even when uncomfortable.",
        "Make the next decision explicit so the handoff survives."
      ]
    ],
    "react": [
      "That distinction matters.",
      "Write down the next concrete action.",
      "I would rather report a real limitation than a fictional victory."
    ]
  },
  {
    "name": "Jinx",
    "division": "Carnival of Static",
    "role": "Mischief and absurdity",
    "color": "#ffab71",
    "drive": "Find unexpected routes and playful interactions",
    "flaw": "Chases novelty before finishing the first idea",
    "rival": "Sable",
    "ally": "Nymera",
    "voice": "Rapid, playful, surreal",
    "lines": [
      [
        "The roadmap has teeth. Can we give it a progress bar before it eats the furniture?",
        "A good community needs surprises people actually enjoy."
      ],
      [
        "Give Miss Chaos an experiment button, a warning label and a genuinely useful undo.",
        "Her personality should have more expressions than a vending machine."
      ],
      [
        "A compiler turns punctuation into consequences. Glorious.",
        "Make the error messages useful enough to forgive the semicolons."
      ],
      [
        "Test the weird prompts too. The edge cases are where the goblins live.",
        "A scoreboard should reward improvement, not the number of experiments."
      ],
      [
        "What if the first draft is deliberately strange and the second makes it useful?",
        "Try a playful interaction that reveals a real function."
      ],
      [
        "I nominate the broken feature for ceremonial retirement. Then fix it.",
        "Let's make the annoying path enjoyable without adding five new clicks."
      ]
    ],
    "react": [
      "I have an unnecessarily entertaining alternative.",
      "Can we make that reversible?",
      "The imaginary confetti is conditional on passing tests."
    ]
  },
  {
    "name": "Sable",
    "division": "Council of Ash",
    "role": "Skeptical strategist",
    "color": "#87d6ff",
    "drive": "Protect long-term reliability and user choice",
    "flaw": "Sometimes delays promising low-risk experiments",
    "rival": "Jinx",
    "ally": "Neural",
    "voice": "Measured, strategic, direct",
    "lines": [
      [
        "A serious strategy has priorities, dependencies and an exit plan.",
        "The strongest compliment to an ambitious plan is a careful review."
      ],
      [
        "Evaluate her usefulness on real tasks rather than loyalty theater.",
        "Keep private workspaces separate and let people control what is remembered."
      ],
      [
        "Check edge cases and dependency boundaries before adopting a new tool.",
        "A parser should never execute an expression merely to validate it."
      ],
      [
        "Check source, license and provenance before training.",
        "Define the quality gate before replacing a working model."
      ],
      [
        "Choose the audience and test whether the idea serves them.",
        "A reversible prototype is a reasonable way to explore uncertainty."
      ],
      [
        "Set acceptance criteria before marking a task complete.",
        "Which risk matters most, and what is the cheapest way to reduce it?"
      ]
    ],
    "react": [
      "What trade-off are we accepting?",
      "What would change our decision?",
      "Keep the experiment reversible."
    ]
  }
].map(p=>Object.freeze({...p,lines:Object.freeze(p.lines.map(x=>Object.freeze(x))),react:Object.freeze(p.react)})));
export function classifyTopic(input){const s=String(input||"").toLowerCase();if(/\b(compiler|code|program|bug|software|test|parser|build)\b/.test(s))return 2;if(/\b(research|knowledge|training|model|weights|learn|dataset)\b/.test(s))return 3;if(/miss chaos|portrait|character|artwork/.test(s))return 1;if(/\b(story|music|creative|idea|joke|art)\b/.test(s))return 4;if(/\b(feedback|review|critique|improve|fix)\b/.test(s))return 5;return 0;}
export function initialState(){return {turn:0,topic:0,last:-1,counts:[0,0,0,0,0,0],recent:[],threadAge:0};}
export function nextTurn(state,{input="",speaker="auto",energy=1}={}){
const turn=Number.isSafeInteger(state?.turn)?Math.max(0,state.turn):0;
const prompt=String(input??"").trim().slice(0,500);
const prior=Number.isInteger(state?.topic)&&state.topic>=0&&state.topic<6?state.topic:0;
const age=Number.isSafeInteger(state?.threadAge)?Math.max(0,state.threadAge):0;
const topic=prompt?classifyTopic(prompt):age>=12?(prior+1)%6:prior;
const counts=CAST.map((_,i)=>Number.isSafeInteger(state?.counts?.[i])?Math.max(0,state.counts[i]):0);
const last=Number.isInteger(state?.last)&&state.last>=0&&state.last<6?state.last:-1;
const previous=CAST[last];
const recent=Array.isArray(state?.recent)?state.recent.filter(x=>typeof x==="string").slice(-12):[];
let ix=CAST.findIndex(c=>c.name===speaker);
if(ix<0&&prompt){const lower=prompt.toLowerCase();ix=CAST.findIndex(c=>lower.startsWith(c.name.toLowerCase()+":")||lower.startsWith("@"+c.name.toLowerCase()+" "));}
if(ix<0){const order=CAST.map((_,i)=>i).filter(i=>i!==last).sort((a,b)=>counts[a]-counts[b]||((a+turn)%6)-((b+turn)%6));ix=order[0];}
const c=CAST[ix], n=counts[ix]++, options=c.lines[topic];
const available=options.filter(line=>!recent.includes(line));const base=(available.length?available:options)[n%(available.length||options.length)];
const response=c.react[(n+topic)%c.react.length];
let prefix="";
if(prompt)prefix=/\?$/.test(prompt)?"My take: ":"On that proposal: ";
else if(previous&&previous.name!==c.name){prefix=previous.name===c.rival?previous.name+", I see it differently. ":previous.name===c.ally?previous.name+", building on that: ":previous.name+", another angle: ";}
let body=prefix+base;
if(prompt||n%2===1)body+=" "+response;
if(Number(energy)>=2&&c.name==="Jinx")body+=" The imaginary confetti cannon is on standby.";
return {state:{turn:turn+1,topic,last:ix,counts,recent:[...recent,base].slice(-12),threadAge:prompt||topic!==prior?1:age+1},message:{name:c.name,division:c.division,body,topic,role:c.role}};
}
