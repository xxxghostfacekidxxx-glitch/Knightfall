#!/usr/bin/env python3
"""In-memory D1-compatible migration regression for Knightfall homepage and bot tiers."""
from pathlib import Path
import sqlite3

connection = sqlite3.connect(":memory:")
connection.execute("PRAGMA foreign_keys=ON")
connection.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, role TEXT, status TEXT);
CREATE TABLE member_bot_creator_privileges (
 user_id INTEGER PRIMARY KEY REFERENCES users(id), title TEXT,
 unlimited_slots INTEGER NOT NULL DEFAULT 0, advanced_builder INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE member_shop_entitlements (user_id INTEGER PRIMARY KEY, extra_bot_slots INTEGER NOT NULL DEFAULT 0);
CREATE TABLE personal_bots (id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id));
INSERT INTO users VALUES
 (1,'member','member','active'),
 (2,'premium','member','active'),
 (3,'mod','moderator','active'),
 (4,'admin','admin','active'),
 (5,'god','god','active'),
 (6,'legacy','member','active'),
 (7,'creator','member','active'),
 (8,'member-extra','member','active'),
 (9,'expired','member','active');
INSERT INTO member_bot_creator_privileges VALUES (6,'Bot Creator',1,1),(7,'Digital Creator',0,0);
INSERT INTO member_shop_entitlements VALUES (8,2);
""")
migration = Path(__file__).resolve().parents[1] / "backend/migrations/0130_home_activity_and_bot_tiers.sql"
connection.executescript(migration.read_text())
assert connection.execute("SELECT title,unlimited_slots,advanced_builder FROM member_bot_creator_privileges WHERE user_id=6").fetchone()==("Digital Creator",1,1)
assert connection.execute("SELECT unlimited_slots,advanced_builder FROM member_bot_creator_privileges WHERE user_id=7").fetchone()==(1,1)

connection.execute("INSERT INTO member_premium_memberships (user_id,status,expires_at) VALUES (2,'active',NULL)")
connection.execute("INSERT INTO member_premium_memberships (user_id,status,expires_at) VALUES (9,'active','2020-01-01')")

def verify_slots(user_id, allowed):
    for number in range(allowed):
        connection.execute("INSERT INTO personal_bots VALUES (?,?)",(f"bot-{user_id}-{number}",user_id))
    try:
        connection.execute("INSERT INTO personal_bots VALUES (?,?)",(f"bot-{user_id}-extra",user_id))
    except sqlite3.IntegrityError as error:
        assert "personal_bot_limit_reached" in str(error), error
    else:
        raise AssertionError(f"User {user_id} improperly bypassed {allowed} bot limit")

for user_id,cap in [(1,5),(2,10),(8,7),(9,5)]:
    verify_slots(user_id,cap)

for user_id in [3,4,5,6,7]:
    for number in range(25):
        connection.execute("INSERT INTO personal_bots VALUES (?,?)",(f"bot-{user_id}-{number}",user_id))

for user_id,allowed in [(1,False),(2,False),(3,True),(4,True),(5,True),(6,True),(7,True)]:
    try:
        connection.execute("INSERT INTO site_activity_posts (user_id,title,body) VALUES (?,?,?)",(user_id,"Update","Staff post"))
    except sqlite3.IntegrityError as error:
        assert not allowed and "staff_only" in str(error), error
    else:
        assert allowed, f"User {user_id} incorrectly allowed to publish official activity"

connection.executescript(migration.read_text())
assert connection.execute("SELECT COUNT(*) FROM site_activity_posts").fetchone()==(5,)
print("PASS: migration idempotency; legacy Digital Creator migration; staff-only feed writes; member 5, Premium 10, extras and expired Premium; unlimited staff and creator bots")
