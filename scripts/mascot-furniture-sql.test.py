#!/usr/bin/env python3
"""Owner-bound pet furniture, wallet atomicity and placement limits on SQLite."""
import math
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.create_function('SQRT',1,math.sqrt)
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,role TEXT);
CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY,balance INTEGER NOT NULL CHECK(balance>=0),updated_at TEXT);
CREATE TABLE wallet_ledger(user_id INTEGER,amount INTEGER,reason TEXT,created_at TEXT);
INSERT INTO users VALUES(1,'owner','member'),(2,'stranger','member');
INSERT INTO user_wallets VALUES(1,2500,''),(2,20,'');
""")
for name in ('0103_mascot_pets.sql','0104_mascot_economy.sql',
             '0105_mascot_adventures.sql','0106_mascot_egg_reservations.sql',
             '0107_mascot_passport.sql','0108_mascot_room_layouts.sql',
             '0109_mascot_furniture.sql'):
    db.executescript((root/'backend/migrations'/name).read_text())
one=db.execute("INSERT INTO mascot_pets(user_id,species,nickname,experience) VALUES(1,'bloop','Gilly',0) RETURNING id").fetchone()[0]
other=db.execute("INSERT INTO mascot_pets(user_id,species,nickname,experience) VALUES(2,'nib','Bat',0) RETURNING id").fetchone()[0]
def value(sql,*params):return db.execute(sql,params).fetchone()[0]
def balance():return value('SELECT balance FROM user_wallets WHERE user_id=1')
def fails(sql,params):
    before=(balance(),value('SELECT COUNT(*) FROM wallet_ledger'))
    try:db.execute(sql,params)
    except sqlite3.IntegrityError:pass
    else:raise AssertionError('Invalid furniture action accepted: '+sql[:100])
    assert (balance(),value('SELECT COUNT(*) FROM wallet_ledger'))==before, 'Failed purchase changed money'
assert value('SELECT COUNT(*) FROM mascot_room_furniture_catalog')==8
buy='INSERT INTO mascot_room_furniture_purchases(user_id,item_key,cost_cinders) VALUES(?,?,?)'
place='INSERT INTO mascot_room_furniture_placements(user_id,pet_id,item_key,x_pct,y_pct,flipped) VALUES(?,?,?,?,?,?)'
fails(buy,(1,'glitch_console',2))
fails(buy,(1,'lantern',1))
fails(place,(1,other,'lantern',50,64,0))
fails(place,(1,one,'glitch_console',50,64,0))
fails(place,(1,one,'lantern',5,64,0))
db.execute(place,(1,one,'lantern',50,64,0))
assert value("SELECT COUNT(*) FROM mascot_room_furniture_placements WHERE pet_id=?",one)==1
fails(place,(1,one,'bone_tree',60,64,0))
db.execute("UPDATE mascot_pets SET experience=1500 WHERE id=?",(one,))
db.execute(place,(1,one,'bone_tree',60,64,0))
db.execute(buy,(1,'glitch_console',500))
assert balance()==2000
assert value("SELECT COUNT(*) FROM mascot_room_furniture_inventory WHERE user_id=1 AND item_key='glitch_console'")==1
fails(buy,(1,'glitch_console',500))
fails(buy,(2,'glitch_console',500))
db.execute(place,(1,one,'glitch_console',35,67,0))
fails(place,(2,other,'glitch_console',35,67,0))
fails('UPDATE mascot_room_furniture_placements SET user_id=? WHERE pet_id=? AND item_key=?',(2,one,'glitch_console'))
db.execute("UPDATE mascot_room_furniture_placements SET x_pct=72,y_pct=70,flipped=1 WHERE pet_id=? AND item_key='glitch_console'",(one,))
assert value("SELECT x_pct FROM mascot_room_furniture_placements WHERE pet_id=? AND item_key='glitch_console'",one)==72
assert value('SELECT COUNT(*) FROM wallet_ledger WHERE reason LIKE "sanctuary room furniture:%"')==1
print('PASS: eight catalog items, one-time Cinders debits, free furniture, owner-only placements and level gates')
