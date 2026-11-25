-- Additive migration. Existing messages retain NULL identifiers.
ALTER TABLE messages ADD COLUMN client_message_id TEXT;
ALTER TABLE messages ADD COLUMN client_payload_hash TEXT;
CREATE UNIQUE INDEX messages_client_message_unique ON messages(conversation_id,sender_id,client_message_id);
