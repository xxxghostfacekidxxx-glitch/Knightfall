// Admin-only aggregate business health. No private content or individual member details.
const ROUTE = "/api/admin/business-metrics";
const QUERY = {
  members: `SELECT COUNT(*) AS accounts,
    COALESCE(SUM(CASE WHEN status='active' THEN 1 ELSE 0 END),0) AS active_accounts,
    COALESCE(SUM(CASE WHEN datetime(created_at)>=datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS registrations_30d,
    COALESCE(SUM(CASE WHEN datetime(last_seen_at)>=datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS seen_30d,
    COALESCE(SUM(CASE WHEN role='member' THEN 1 ELSE 0 END),0) AS member_role_accounts,
    COALESCE(SUM(CASE WHEN role='member' AND status='active' THEN 1 ELSE 0 END),0) AS active_member_role_accounts,
    COALESCE(SUM(CASE WHEN role='member' AND datetime(last_seen_at)>=datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS member_role_seen_30d,
    COALESCE(SUM(CASE WHEN role='member' AND datetime(created_at)>=datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS member_role_registrations_30d,
    COALESCE(SUM(CASE WHEN role IN ('god','admin','moderator') THEN 1 ELSE 0 END),0) AS staff_role_accounts
    FROM users`,
  forum: `SELECT COUNT(*) AS threads, COUNT(DISTINCT t.user_id) AS authors,
    COUNT(DISTINCT CASE WHEN u.role='member' THEN t.user_id END) AS member_role_authors,
    COALESCE(SUM(CASE WHEN datetime(t.created_at)>=datetime('now','-30 days') THEN 1 ELSE 0 END),0) AS threads_30d
    FROM threads t JOIN users u ON u.id=t.user_id WHERE t.deleted_at IS NULL`,
  messaging: `SELECT COUNT(*) AS messages, COUNT(DISTINCT m.sender_id) AS senders,
    COUNT(DISTINCT CASE WHEN u.role='member' THEN m.sender_id END) AS member_role_senders
    FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.deleted_at IS NULL`,
  arcade: `SELECT COUNT(*) AS score_records, COUNT(DISTINCT a.user_id) AS players,
    COUNT(DISTINCT CASE WHEN u.role='member' THEN a.user_id END) AS member_role_players,
    COUNT(DISTINCT a.game_key) AS recorded_games, COALESCE(SUM(a.runs),0) AS score_reported_runs
    FROM arcade_high_scores a JOIN users u ON u.id=a.user_id`,
  commerce: `SELECT
    (SELECT COUNT(*) FROM shops) AS shops,
    (SELECT COUNT(*) FROM shop_products) AS shop_products,
    (SELECT COUNT(*) FROM member_shop_orders) AS shop_order_records,
    (SELECT COUNT(*) FROM member_premium_memberships
       WHERE status='active' AND (expires_at IS NULL OR datetime(expires_at)>CURRENT_TIMESTAMP)) AS active_premium_entitlements,
    (SELECT COUNT(*) FROM creator_subscriptions) AS creator_subscription_records`
};

export async function handleBusinessMetrics(request,env,url,{requireUser,json,origin}) {
  if(url.pathname!==ROUTE)return null;
  const respond=(data,status=200)=>json(data,status,origin);
  const user=await requireUser(request,env);
  if(!user)return respond({error:"Sign in to view business metrics."},401);
  if(!["admin","god"].includes(String(user.role||"").toLowerCase()))
    return respond({error:"Administrator access required."},403);
  if(request.method!=="GET")return respond({error:"Method not allowed."},405);
  if(!env.DB)return respond({error:"Business metrics are unavailable."},503);

  const metrics={};
  try{
    for(const [group,sql] of Object.entries(QUERY)){
      const row=await env.DB.prepare(sql).first();
      if(!row)throw new Error("Missing metric row");
      metrics[group]={};
      for(const [name,value] of Object.entries(row)){
        if(value===null||value===undefined||!Number.isFinite(Number(value)))
          throw new Error("Unexpected metric value");
        metrics[group][name]=Number(value);
      }
    }
  }catch(error){
    console.error("admin_business_metrics_failed",error?.message||"query error");
    return respond({error:"Business metrics are unavailable. No figures were substituted."},503);
  }
  return respond({
    generated_at:new Date().toISOString(),
    source:"Cloudflare D1 aggregate records",
    metrics,
    limitations:"Member-role excludes admin, GOD and moderator roles but can still include test accounts. Last-seen is not verified retention. Orders, entitlements and scores are not proof of collected revenue or distinct customers."
  });
}
