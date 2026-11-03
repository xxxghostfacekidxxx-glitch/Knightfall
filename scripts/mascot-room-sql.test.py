#!/usr/bin/env python3
"""Offline SQLite security test for the interactive Neon Nuisances rooms."""
import math
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.create_function("SQRT", 1, math.sqrt)
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT, role TEXT);
CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY, balance INTEGER NOT NULL CHECK(balance>=0), updated_at TEXT);
CREATE TABLE wallet_ledger(user_id INTEGER, amount INTEGER, reason TEXT, created_at TEXT);
INSERT INTO users VALUES(1,'one','member'),(2,'two','member');
INSERT INTO user_wallets VALUES(1,10000,''),(2,10000,'');
""")
for name in (
    "0103_mascot_pets.sql", "0104_mascot_economy.sql", "0105_mascot_adventures.sql",
    "0106_mascot_egg_reservations.sql", "0107_mascot_passport.sql",
    "0108_mascot_room_layouts.sql"
):
    db.executescript((root / "backend/migrations" / name).read_text())

db.execute("INSERT INTO mascot_pets(user_id,species,nickname) VALUES(1,'bloop','Gilly')")
db.execute("INSERT INTO mascot_pets(user_id,species,nickname) VALUES(2,'nib','Niblet')")
pet_1 = db.execute("SELECT id FROM mascot_pets WHERE user_id=1").fetchone()[0]
pet_2 = db.execute("SELECT id FROM mascot_pets WHERE user_id=2").fetchone()[0]
start_balance = db.execute("SELECT balance FROM user_wallets WHERE user_id=1").fetchone()[0]
db.execute("INSERT INTO mascot_room_layouts(pet_id,user_id,x_percent,y_percent,pose) VALUES(?,?,?,?,?)",
           (pet_1, 1, 50, 65, "idle"))

def blocked(sql, params):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Invalid room change succeeded: " + sql)

insert = "INSERT INTO mascot_room_layouts(pet_id,user_id,x_percent,y_percent,pose) VALUES(?,?,?,?,?)"
blocked(insert, (pet_2, 1, 50, 65, "idle"))
blocked(insert, (pet_1, 2, 50, 65, "idle"))
blocked("UPDATE mascot_room_layouts SET user_id=2 WHERE pet_id=?", (pet_1,))
blocked("UPDATE mascot_room_layouts SET pet_id=? WHERE pet_id=?", (pet_2, pet_1))
blocked("UPDATE mascot_room_layouts SET x_percent=2 WHERE pet_id=?", (pet_1,))
blocked("UPDATE mascot_room_layouts SET y_percent=100 WHERE pet_id=?", (pet_1,))
blocked("UPDATE mascot_room_layouts SET pose='attack' WHERE pet_id=?", (pet_1,))

db.execute("UPDATE mascot_room_layouts SET x_percent=82,y_percent=32,pose='mischief' WHERE pet_id=? AND user_id=?",
           (pet_1,1))
result = db.execute("SELECT x_percent,y_percent,pose FROM mascot_room_layouts WHERE pet_id=?", (pet_1,)).fetchone()
assert result == (82, 32, "mischief")
assert db.execute("SELECT balance FROM user_wallets WHERE user_id=1").fetchone()[0] == start_balance
assert db.execute("SELECT COUNT(*) FROM wallet_ledger").fetchone()[0] == 0
print("PASS: interactive rooms persist, enforce coordinate bounds and private ownership, and never change Cinders")
