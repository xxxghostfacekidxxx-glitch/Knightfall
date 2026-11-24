export function petLevel(experience){return 1+Math.floor(Math.sqrt(Math.max(0,Number(experience)||0)/40));}
