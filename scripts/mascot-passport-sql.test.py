#!/usr/bin/env python3
"""Passport anti-abuse and one-time Cinders achievement rewards, isolated SQLite."""
from pathlib import Path
import sqlite3, math
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.create_function('SQRT',1,math.sqrt)
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,role TEXT);
CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY,balance INTEGER CHECK(balance>=0),updated_at TEXT);
CREATE TABLE wallet_ledger(user_id INTEGER,amount INTEGER,reason TEXT,created_at TEXT);
INSERT INTO users VALUES(1,'tester','member'),(2,'other','member');
INSERT INTO user_wallets VALUES(1,10000,''),(2,10000,'');
""")
for name in ['0103_mascot_pets.sql','0104_mascot_economy.sql','0105_mascot_adventures.sql',
             '0106_mascot_egg_reservations.sql','0107_mascot_passport.sql']:
    db.executescript((root/'backend/migrations'/name).read_text())
assert db.execute('SELECT COUNT(*) FROM mascot_passport_badges').fetchone()[0]==8
def total(sql,args=()):
    return db.execute(sql,args).fetchone()[0]
def balance(uid=1):return total('SELECT balance FROM user_wallets WHERE user_id=?',(uid,))
def fail(sql,params):
    before=balance(),total('SELECT COUNT(*) FROM wallet_ledger')
    try:db.execute(sql,params)
    except sqlite3.IntegrityError:pass
    else:raise AssertionError('Invalid passport claim accepted: '+str(params))
    assert (balance(),total('SELECT COUNT(*) FROM wallet_ledger'))==before,'Unexpected reward for failed claim'
claim='INSERT INTO mascot_passport_claims(user_id,badge_id) VALUES(?,?)'
fail(claim,(1,'first_friend'))
fail(claim,(1,'quest_scout'))
fail(claim,(1,'no_such_badge'))
adopt='INSERT INTO mascot_acquisitions(user_id,species,nickname,cost_cinders) VALUES(?,?,?,?)'
db.execute(adopt,(1,'bloop','Gilly',0))
db.execute(claim,(1,'first_friend'))
assert balance()==10100
assert total("SELECT amount FROM wallet_ledger WHERE reason='sanctuary passport: first_friend'")==100
fail(claim,(1,'first_friend'))
fail(claim,(2,'first_friend'))
fail(claim,(1,'misfit_trio'))
db.execute(adopt,(1,'nib','Night',350))
db.execute(adopt,(1,'moxie','Mothy',350))
db.execute(claim,(1,'misfit_trio'))
assert total("SELECT COUNT(*) FROM mascot_passport_claims WHERE user_id=1")==2
assert total("SELECT COUNT(*) FROM mascot_pets WHERE user_id=1")==3
fail(claim,(1,'madhouse_ten'))
fail(claim,(1,'fashion_fiend'))
pet=total("SELECT id FROM mascot_pets WHERE user_id=1 LIMIT 1")
db.execute("INSERT INTO mascot_item_purchases(user_id,sku,cost_cinders) VALUES(1,'scrap_crown',450)")
db.execute("INSERT INTO mascot_equipment(user_id,pet_id,slot,sku) VALUES(1,?,'head','scrap_crown')",(pet,))
db.execute(claim,(1,'fashion_fiend'))
assert total("SELECT COUNT(*) FROM mascot_passport_claims WHERE user_id=1")==3
fail(claim,(1,'fashion_fiend'))
fail(claim,(2,'fashion_fiend'))
assert total("SELECT COUNT(*) FROM mascot_passport_badges WHERE reward_cinders>0")==8
print('PASS: eight Passport badges, eligibility, owner isolation, duplicate claims, one-time atomic Cinders rewards')
