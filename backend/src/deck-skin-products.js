/* Prices and ownership are server-authoritative. Existing twelve finishes stay free. */
export const PREMIUM_DECK_PRODUCTS=Object.freeze({
  "obsidian-cathedral":Object.freeze({sku:"deck_obsidian_cathedral",skin_id:"obsidian-cathedral",name:"Obsidian Cathedral",price_cents:100,symbol:"♜",description:"Gothic arches, etched windows and black-gold foil."}),
  "mourning-rose":Object.freeze({sku:"deck_mourning_rose",skin_id:"mourning-rose",name:"Mourning Rose",price_cents:125,symbol:"✿",description:"Pressed black roses and antique blush engraving."}),
  "serpent-crown":Object.freeze({sku:"deck_serpent_crown",skin_id:"serpent-crown",name:"Serpent Crown",price_cents:149,symbol:"♛",description:"Emerald scales wrapped around a burnished crown."}),
  "arcane-tarot":Object.freeze({sku:"deck_arcane_tarot",skin_id:"arcane-tarot",name:"Arcane Tarot",price_cents:175,symbol:"☽",description:"Midnight celestial engraving and intricate constellations."}),
  "blood-moon":Object.freeze({sku:"deck_blood_moon",skin_id:"blood-moon",name:"Blood Moon",price_cents:199,symbol:"◉",description:"Lunar eclipse lacquer with crimson halo foil."}),
  "rusted-relic":Object.freeze({sku:"deck_rusted_relic",skin_id:"rusted-relic",name:"Rusted Relic",price_cents:100,symbol:"⚙",description:"Weathered copper plates and distressed industrial geometry."}),
  "phantom-masquerade":Object.freeze({sku:"deck_phantom_masquerade",skin_id:"phantom-masquerade",name:"Phantom Masquerade",price_cents:125,symbol:"◈",description:"Ornate ivory masquerade masks on plum velvet."}),
  "starfall":Object.freeze({sku:"deck_starfall",skin_id:"starfall",name:"Starfall",price_cents:149,symbol:"✶",description:"Meteor streaks and deep indigo starlight."}),
  "witching-hour":Object.freeze({sku:"deck_witching_hour",skin_id:"witching-hour",name:"Witching Hour",price_cents:175,symbol:"⌛",description:"Moonlit clockwork, blue smoke and silver ink."}),
  "thornbound":Object.freeze({sku:"deck_thornbound",skin_id:"thornbound",name:"Thornbound",price_cents:199,symbol:"❦",description:"Entwined thorns with antique bronze edging."}),
  "sacred-static":Object.freeze({sku:"deck_sacred_static",skin_id:"sacred-static",name:"Sacred Static",price_cents:149,symbol:"⌁",description:"Glitched stained glass and holographic fragments."}),
  "cinder-emperor":Object.freeze({sku:"deck_cinder_emperor",skin_id:"cinder-emperor",name:"Cinder Emperor",price_cents:199,symbol:"♚",description:"Regal ember filigree and molten volcanic enamel."})
});
export const PREMIUM_DECK_SKUS=Object.freeze(Object.fromEntries(Object.values(PREMIUM_DECK_PRODUCTS).map(p=>[p.sku,p])));
