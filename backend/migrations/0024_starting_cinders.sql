-- Grant a minimum opening balance to every account without reducing earned Cinders.
-- Owner, admins, moderators, and any future god-role account receive the privileged balance.
INSERT OR IGNORE INTO user_wallets (user_id,balance)
SELECT id,
       CASE WHEN username='knightfall' OR role IN ('admin','moderator','god') THEN 1000000 ELSE 2000 END
FROM users;

-- Record only top-ups for wallets that already existed below their new minimum.
INSERT INTO wallet_ledger (user_id,amount,reason,created_at)
SELECT w.user_id,
       (CASE WHEN u.username='knightfall' OR u.role IN ('admin','moderator','god') THEN 1000000 ELSE 2000 END) - w.balance,
       'starting Cinders balance adjustment',
       CURRENT_TIMESTAMP
FROM user_wallets w
JOIN users u ON u.id=w.user_id
WHERE w.balance < CASE WHEN u.username='knightfall' OR u.role IN ('admin','moderator','god') THEN 1000000 ELSE 2000 END;

-- Top up existing balances, preserving any wallet already above its minimum.
UPDATE user_wallets
SET balance = MAX(balance, (
  SELECT CASE WHEN u.username='knightfall' OR u.role IN ('admin','moderator','god') THEN 1000000 ELSE 2000 END
  FROM users u WHERE u.id=user_wallets.user_id
)), updated_at=CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM users u
  WHERE u.id=user_wallets.user_id
    AND user_wallets.balance < CASE WHEN u.username='knightfall' OR u.role IN ('admin','moderator','god') THEN 1000000 ELSE 2000 END
);
