/** A group is safe only when no pair of its participants has blocked one another. */
export async function hasBlockedGroupPair(db,memberIds){
 const ids=[...new Set((memberIds||[]).map(Number).filter(id=>Number.isSafeInteger(id)&&id>0))];
 if(ids.length<2)return false;
 const marks=ids.map(()=>"?").join(",");
 const blocked=await db.prepare(
  "SELECT 1 FROM user_blocks WHERE blocker_id IN ("+marks+") AND blocked_id IN ("+marks+") LIMIT 1"
 ).bind(...ids,...ids).first();
 return !!blocked;
}
