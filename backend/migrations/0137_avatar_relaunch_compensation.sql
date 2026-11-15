-- One-time 20,000 Cinders grant to every active Knightfall account at the 2026-11-15 avatar relaunch.
-- Existing balances are preserved. A unique recipient key plus a trigger makes re-execution safe.
CREATE TABLE IF NOT EXISTS avatar_relaunch_compensation (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 amount INTEGER NOT NULL DEFAULT 20000 CHECK(amount=20000),
 granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS avatar_relaunch_compensation_credit
 AFTER INSERT ON avatar_relaunch_compensation
BEGIN
 INSERT OR IGNORE INTO user_wallets(user_id,balance,created_at,updated_at)
 VALUES(NEW.user_id,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
 UPDATE user_wallets SET balance=balance+NEW.amount,updated_at=CURRENT_TIMESTAMP
 WHERE user_id=NEW.user_id;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
 VALUES(NEW.user_id,NEW.amount,'avatar studio relaunch apology 2026-11-15',CURRENT_TIMESTAMP);
END;
INSERT OR IGNORE INTO avatar_relaunch_compensation(user_id,amount)
 SELECT id,20000 FROM users WHERE status='active';
