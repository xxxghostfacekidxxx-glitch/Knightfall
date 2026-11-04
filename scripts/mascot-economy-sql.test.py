#!/usr/bin/env python3
"""Isolated SQLite tests for Sanctuary spending and fulfillment triggers.
Does not connect to or modify production D1.
"""
import math
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
conn=sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.create_function('SQRT',1,math.sqrt)
conn.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,role TEXT);
CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY,balance INTEGER NOT NULL CHECK(balance>=0),updated_at TEXT);
CREATE TABLE wallet_ledger(user_id INTEGER NOT NULL,amount INTEGER NOT NULL,reason TEXT,created_at TEXT);
INSERT INTO users VALUES(1,'alice','member'),(2,'bob','member');
INSERT INTO user_wallets VALUES(1,200000,''),(2,400,'');
""")
for file in ['0103_mascot_pets.sql','0104_mascot_economy.sql']:
    conn.executescript((root/'backend/migrations'/file).read_text())
assert conn.execute("SELECT COUNT(*) FROM mascot_species_market").fetchone()[0]==22
assert conn.execute("SELECT COUNT(*) FROM mascot_items").fetchone()[0]==12

def balance(user=1):
    return conn.execute("SELECT balance FROM user_wallets WHERE user_id=?",(user,)).fetchone()[0]
def fails(query,params):
    before=(balance(1),conn.execute("SELECT COUNT(*) FROM mascot_pets").fetchone()[0],
        conn.execute("SELECT COUNT(*) FROM wallet_ledger").fetchone()[0])
    try:conn.execute(query,params)
    except sqlite3.IntegrityError: pass
    else:raise AssertionError(f"Unsafe SQL was permitted: {query}")
    after=(balance(1),conn.execute("SELECT COUNT(*) FROM mascot_pets").fetchone()[0],
        conn.execute("SELECT COUNT(*) FROM wallet_ledger").fetchone()[0])
    assert before==after,("Failed operation unexpectedly changed money or pets",before,after)

rescue="INSERT INTO mascot_acquisitions(user_id,species,nickname,cost_cinders) VALUES(?,?,?,?)"
conn.execute(rescue,(1,'bloop','Gillz',0))
assert conn.execute("SELECT species,featured FROM mascot_pets WHERE user_id=1").fetchone()==('bloop',1)
assert balance()==200000
fails(rescue,(1,'bloop','Duplicate',350))
fails(rescue,(1,'nib','Price Hack',0))
fails(rescue,(1,'mini-eddie','Level Skipper',2500))
conn.execute(rescue,(1,'nib','Nightmare',350))
assert balance()==199650
assert conn.execute("SELECT amount FROM wallet_ledger ORDER BY rowid DESC LIMIT 1").fetchone()[0]==-350
conn.execute("UPDATE mascot_pets SET experience=640 WHERE user_id=1 AND species='bloop'")
conn.execute(rescue,(1,'mini-eddie','Eddie',2500))
assert balance()==197150

buy="INSERT INTO mascot_item_purchases(user_id,sku,cost_cinders) VALUES(?,?,?)"
conn.execute(buy,(1,'scrap_crown',450))
assert balance()==196700
assert conn.execute("SELECT COUNT(*) FROM mascot_wardrobe WHERE user_id=1 AND sku='scrap_crown'").fetchone()[0]==1
fails(buy,(1,'scrap_crown',450))
fails(buy,(1,'witch_hat',1))
fails(buy,(1,'glitch_horns',299))

pet=conn.execute("SELECT id FROM mascot_pets WHERE user_id=1 AND species='bloop'").fetchone()[0]
conn.execute("INSERT INTO mascot_equipment(user_id,pet_id,slot,sku) VALUES(?,?,?,?)",(1,pet,'head','scrap_crown'))
assert conn.execute("SELECT sku FROM mascot_equipment WHERE user_id=1 AND pet_id=?",(pet,)).fetchone()[0]=='scrap_crown'
try:conn.execute("INSERT INTO mascot_equipment(user_id,pet_id,slot,sku) VALUES(?,?,?,?)",(2,pet,'head','scrap_crown'))
except sqlite3.IntegrityError:pass
else:raise AssertionError("Could equip someone else's pet")
try:conn.execute("INSERT INTO mascot_equipment(user_id,pet_id,slot,sku) VALUES(?,?,?,?)",(1,pet,'eyes','scrap_crown'))
except sqlite3.IntegrityError:pass
else:raise AssertionError("Could put a crown in the eyes slot")

# Any species can eventually be rescued, one per account.
for species,price in conn.execute("SELECT species,cost_cinders FROM mascot_species_market").fetchall():
    if species in ('bloop','nib','mini-eddie'):continue
    conn.execute(rescue,(1,species,species,price))
assert conn.execute("SELECT COUNT(*) FROM mascot_pets WHERE user_id=1").fetchone()[0]==22
fails(rescue,(1,'bloop','Extra',350))
# A user with insufficient Cinders cannot create money or claim a pet.
conn.execute(rescue,(2,'moxie','Star',0))
fails(rescue,(2,'nib','Nope',350)) if balance(2)<350 else None
conn.execute("UPDATE user_wallets SET balance=10 WHERE user_id=2")
try:conn.execute(rescue,(2,'nib','Still Nope',350))
except sqlite3.IntegrityError:pass
else:raise AssertionError('Insufficient wallet was allowed')
assert balance(2)==10
print('PASS: 22 species, free first rescue, price and level enforcement, Cinders rollback, cosmetics and ownership')
