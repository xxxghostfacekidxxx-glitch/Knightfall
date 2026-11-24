-- Add the second first-party emoji family to the reaction constraint.
-- Shortcodes remain allowlisted in public/knightfall-emojis.mjs and are
-- rendered only from local SVG assets.
CREATE TABLE message_reactions_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN (
    '👍','❤️','😂','😮','😢','😡','🔥','🎉',
    ':kf-imp:',':kf-ashes:',':kf-eye:',':kf-heartbreak:',':kf-voidstar:',
    ':kf-glitch:',':kf-bat:',':kf-skull:',':kf-dice:',':kf-paw:',
    ':kf-crown:',':kf-venomrose:',':kf-screambean:',':kf-moltenhalo:',
    ':kf-brokenhalo:',':kf-nightbite:',':kf-littlemenace:'
  )),
  created_at TEXT NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

INSERT INTO message_reactions_v3 (id,message_id,conversation_id,user_id,emoji,created_at)
SELECT id,message_id,conversation_id,user_id,emoji,created_at FROM message_reactions;

DROP TABLE message_reactions;
ALTER TABLE message_reactions_v3 RENAME TO message_reactions;

CREATE INDEX idx_message_reactions_conversation_message
  ON message_reactions(conversation_id, message_id);
CREATE INDEX idx_message_reactions_message
  ON message_reactions(message_id);
