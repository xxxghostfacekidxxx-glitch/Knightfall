-- Collapse legacy duplicates before making the unordered friendship pair unique.
-- Accepted friendships win; otherwise keep the newest request row so existing
-- clients retain a valid request id for accept, decline, or cancel actions.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY MIN(requester_id, addressee_id), MAX(requester_id, addressee_id)
           ORDER BY CASE status WHEN 'accepted' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
                    updated_at DESC,
                    id DESC
         ) AS position
  FROM friend_requests
)
DELETE FROM friend_requests
WHERE id IN (SELECT id FROM ranked WHERE position > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_requests_unordered_pair
  ON friend_requests (MIN(requester_id, addressee_id), MAX(requester_id, addressee_id));
