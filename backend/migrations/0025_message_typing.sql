-- Short-lived typing presence for Messenger-style live feedback.
ALTER TABLE conversation_members ADD COLUMN typing_until TEXT;
CREATE INDEX IF NOT EXISTS idx_conversation_members_typing ON conversation_members(conversation_id, typing_until);
