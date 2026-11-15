/* Browser-local, read-only business snapshot export. No tracking or storage. */
(function(root){
"use strict";
const fields={
 members:["accounts","active_accounts","registrations_30d","seen_30d","member_role_accounts","active_member_role_accounts","member_role_seen_30d","member_role_registrations_30d","staff_role_accounts"],
 forum:["threads","authors","member_role_authors","threads_30d"],
 messaging:["messages","senders","member_role_senders"],
 arcade:["score_records","players","member_role_players","recorded_games","score_reported_runs"],
 commerce:["shops","shop_products","shop_order_records","active_premium_entitlements","creator_subscription_records"]
};
const cell=input=>{const raw=String(input);const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"';};
function toCsv(snapshot){
 if(!snapshot||!snapshot.metrics)throw Error("No verified metric snapshot to export.");
 const stamp=new Date(snapshot.generated_at);
 if(!Number.isFinite(stamp.getTime()))throw Error("Invalid source timestamp.");
 const time=stamp.toISOString(),source="Cloudflare D1 aggregate records";
 const caveat="Member-role records can include test accounts. These are not verified external customers, revenue, deposits or profit.";
 const rows=[["snapshot_utc","source","group","metric","value","unit","limitations"]];
 for(const [group,names] of Object.entries(fields)){
  const values=snapshot.metrics[group];
  if(!values||typeof values!=="object")throw Error("Missing verified group: "+group);
  for(const name of names){
   const value=values[name];
   if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0)
    throw Error("Missing or invalid verified metric: "+group+"."+name);
   rows.push([time,source,group,name,value,"records",caveat]);
  }
 }
 return rows.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
root.KnightfallBusinessReport=Object.freeze({toCsv});
})(typeof window==="object"?window:globalThis);
