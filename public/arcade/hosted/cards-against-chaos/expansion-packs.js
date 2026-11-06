// Original Knightfall Cards Against Chaos pack. Adult-humor opt-in (18+).
// No third-party card text; preview access until production checkout and ownership are configured.
const SCENES=[
 "an awkward wedding toast",
 "a spectacularly bad first date",
 "the world's least romantic afterparty",
 "a doomed group chat",
 "a questionable late-night tattoo",
 "an ill-advised reunion",
 "the after-hours confession booth",
 "a disastrous karaoke duel",
 "a midnight therapy session",
 "a haunted hotel checkout",
 "a revenge outfit reveal",
 "a cursed dating profile",
 "the morning-after breakfast",
 "a terrible Vegas weekend",
 "a scandalous office holiday party",
 "a text that should never have been sent",
 "an unforgettable breakup speech",
 "a suspicious bachelor party",
 "a moonlit walk of shame",
 "a completely unhinged family dinner",
 "an embarrassing live-stream",
 "an overdramatic apology tour",
 "a disastrous couples costume",
 "a cursed wedding registry",
 "the last call at the vampire bar"
];
const PROMPTS=[
 "At {scene}, the one thing nobody expected was ___.",
 "Every witness to {scene} insists the real problem was ___."
];
const ANSWERS=[
 "A tattoo of my ex's Wi-Fi password",
 "A breakup text written by a haunted chatbot",
 "A bottle of expensive regret",
 "A dating app for emotionally unavailable vampires",
 "A midnight voice note that lasts forty-seven minutes",
 "A prenup written on a bar napkin",
 "An ex who still has the Netflix password",
 "A bouquet of very aggressive red flags",
 "A wedding DJ playing only breakup songs",
 "A secret second phone full of cat photos",
 "A six-hour argument about a single emoji",
 "A truly devastating autocorrect",
 "A vampire with commitment issues",
 "An emergency exit from my own love life",
 "A trust fall into a dumpster",
 "An awkwardly timed love confession",
 "A suspiciously detailed alibi",
 "A haunted engagement ring",
 "A regrettable matching tattoo",
 "A group chat named 'We Need to Talk'",
 "A walk of shame in platform boots",
 "A playlist called 'Definitely Over It'",
 "A cursed bottle of cheap perfume",
 "A revenge dress with enormous pockets",
 "A wedding cake shaped like a red flag",
 "An accidental voice memo to my landlord",
 "A ceremonial blocking of every ex",
 "A goth wedding with no surviving witnesses",
 "A three-page apology that never apologizes",
 "A relationship advice podcast hosted by ghosts",
 "A coffin built for two people who hate each other",
 "A receipt for a deeply unnecessary purchase",
 "A very public argument with a vending machine",
 "A surprise appearance by the ex's mother",
 "A dramatic breakup in the frozen-food aisle",
 "A midnight snack and terrible decisions",
 "A velvet blindfold from a haunted costume store",
 "A demon who insists we're 'just talking'",
 "A disastrous couples therapy puppet show",
 "A karaoke duet with my sworn enemy",
 "A suspiciously romantic restraining order joke",
 "A collection of unanswered 'you up?' texts",
 "A dating profile that lists arson as a hobby",
 "An emotionally unavailable skeleton",
 "A romantic dinner interrupted by three raccoons",
 "A lie detector hooked up to a disco ball",
 "A scented candle called 'Poor Judgment'",
 "A confession written on a pizza box",
 "A leather jacket full of stolen love letters",
 "A vampire's disastrous honeymoon itinerary"
];
const ANSWER_FRAMES=[
 "{thing} at 2:13 in the morning",
 "The overwhelming confidence of {thing}",
 "An unrequested presentation about {thing}"
];
export const MADHOUSE_BLACK=PROMPTS.flatMap(pattern=>SCENES.map(scene=>pattern.replaceAll("{scene}",scene)));
export const MADHOUSE_WHITE=ANSWERS.flatMap(answer=>ANSWER_FRAMES.map(pattern=>pattern.replaceAll("{thing}",answer.charAt(0).toLowerCase()+answer.slice(1))));
if(MADHOUSE_BLACK.length!==50||MADHOUSE_WHITE.length!==150)throw Error("Madhouse After Hours must contain 50 black and 150 white cards");
// Explicit catalog IDs let future owned packs be mixed together without rewriting the game.
export const EXPANSION_PACKS=Object.freeze({
 "madhouse-after-hours":Object.freeze({
  id:"madhouse-after-hours",title:"Madhouse After Hours",min_age:18,
  description:"Bad dates, cursed romance, regrettable nights, and outrageous after-hours jokes.",
  black:MADHOUSE_BLACK,white:MADHOUSE_WHITE
 })
});
