// Explicitly entered own-account inventory; no account probing, credentials or network.
export const providers=Object.freeze({
 google:{name:"Google / Gmail",recover:"https://accounts.google.com/signin/usernamerecovery",security:"https://myaccount.google.com/security-checkup"},
 proton:{name:"Proton",recover:"https://proton.me/support/common-login-problems",security:"https://account.proton.me/"},
 other:{name:"Other",recover:null,security:null}
});
export function normalizeEntry(x){
 if(!x||!Object.hasOwn(providers,x.provider))throw Error("Choose a provider");
 const account=String(x.account||"").trim();
 if(!/^[a-z0-9][a-z0-9._+@-]{0,159}$/i.test(account))throw Error("Enter an account username or address, never a password");
 if(x.owned!==true)throw Error("Confirm this is your own account");
 const checks=Object.fromEntries(["access","recovery","mfa","sessions","apps"].map(k=>[k,x.checks?.[k]===true]));
 const reviewed=typeof x.reviewed==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.reviewed)&&Number.isFinite(Date.parse(x.reviewed))?x.reviewed:"";
 return {provider:x.provider,account,owned:true,checks,reviewed};
}
export function mergeEntries(rows,incoming){const map=new Map(rows.map(x=>[x.provider+":"+x.account.toLowerCase(),x]));for(const row of incoming){const x=normalizeEntry(row);map.set(x.provider+":"+x.account.toLowerCase(),x);}if(map.size>250)throw Error("Maximum 250 entries");return [...map.values()];}
export function reviewDue(row,now=Date.now()){return !row.reviewed||now-Date.parse(row.reviewed)>=30*86400000;}
export function readInventory(raw){if(typeof raw!=="string"||raw.length>150000)throw Error("Inventory too large");const data=JSON.parse(raw);if(data.schema!=="knightfall-own-account-inventory-v1"||!Array.isArray(data.accounts)||data.accounts.length>250)throw Error("Invalid inventory");return mergeEntries([],data.accounts);}
export function exportInventory(rows){return JSON.stringify({schema:"knightfall-own-account-inventory-v1",accounts:rows.map(normalizeEntry)},null,2);}
