-- Expand message reactions to the first original Knightfall emoji family.
-- Keep the constraint aligned with public/knightfall-emojis.mjs and the
-- server allowlist so arbitrary reaction text never enters the table.
CREATE TABLE message_reactions_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN (
    '👍','❤️','😂','😮','😢','😡','🔥','🎉',
    ':kf-imp:',':kf-ashes:',':kf-eye:',':kf-heartbreak:',':kf-voidstar:',
    ':kf-glitch:',':kf-bat:',':kf-skull:',':kf-dice:',':kf-paw:',
    ':kf-crown:',':kf-venomrose:'
  )),
  created_at TEXT NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

INSERT INTO message_reactions_v2 (id,message_id,conversation_id,user_id,emoji,created_at)
SELECT id,message_id,conversation_id,user_id,emoji,created_at FROM message_reactions;

DROP TABLE message_reactions;
ALTER TABLE message_reactions_v2 RENAME TO message_reactions;

CREATE INDEX idx_message_reactions_conversation_message
  ON message_reactions(conversation_id, message_id);
CREATE INDEX idx_message_reactions_message
  ON message_reactions(message_id);
