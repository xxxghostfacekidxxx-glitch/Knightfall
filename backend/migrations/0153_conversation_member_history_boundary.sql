-- Record the last message visible when a member joins. Using an ID boundary
-- avoids timestamp ties when a message and group invite land in one millisecond.
ALTER TABLE conversation_members
  ADD COLUMN joined_after_message_id INTEGER NOT NULL DEFAULT 0;

UPDATE conversation_members AS cm
SET joined_after_message_id=COALESCE((
  SELECT MAX(m.id)
  FROM messages AS m
  WHERE m.conversation_id=cm.conversation_id
    AND m.created_at<=cm.joined_at
),0);
