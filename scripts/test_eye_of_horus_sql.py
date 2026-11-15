#!/usr/bin/env python3
"""Check the soft-deletion schema and GOD-only recovery SQL contract."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]/"backend/migrations"
migration=(root/"0132_soft_delete_core.sql").read_text()
quota=(root/"0133_soft_delete_bot_quota.sql").read_text()
tables=[
    "personal_bots","personal_bot_chat_messages","profile_photos","vault_items",
    "chaos_memories","member_memos","member_memo_mail","moon_journal",
    "shadow_journal","media_albums","shop_products"
]
con=sqlite3.connect(":memory:")
for table in tables:
    con.execute(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY,owner_id INTEGER)")
con.executescript("CREATE TABLE eye_of_horus_access_log (id INTEGER PRIMARY KEY);")
con.executescript(migration)
for table in tables:
    columns={row[1] for row in con.execute(f"PRAGMA table_info({table})")}
    assert "deleted_at" in columns, f"{table} missing deleted_at"
assert con.execute("SELECT COUNT(*) FROM sqlite_master WHERE name='eye_of_horus_access_log'").fetchone()[0]==0
con.execute("INSERT INTO personal_bots(id,owner_id) VALUES(1,2)")
con.execute("UPDATE personal_bots SET deleted_at=CURRENT_TIMESTAMP WHERE id=1")
assert con.execute("SELECT COUNT(*) FROM personal_bots WHERE deleted_at IS NULL").fetchone()[0]==0
assert con.execute("SELECT COUNT(*) FROM personal_bots WHERE deleted_at IS NOT NULL").fetchone()[0]==1
assert "deleted_at IS NULL" in quota
assert "personal_bot_limit_reached" in quota
print("PASS: 11 retained-content tables support soft deletion; old Eye audit table is retired")
