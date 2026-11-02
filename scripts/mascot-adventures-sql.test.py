#!/usr/bin/env python3
"""Sanctuary expedition anti-abuse regression tests using isolated in-memory SQLite."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import math
import sqlite3

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.create_function('SQRT',1,math.sqrt)
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,role TEXT);
CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY,balance INTEGER NOT NULL CHECK(balance>=0),updated_at TEXT);
CREATE TABLE wallet_ledger(user_id INTEGER NOT NULL,amount INTEGER NOT NULL,reason TEXT,created_at TEXT);
INSERT INTO users VALUES(1,'alpha','member'),(2,'beta','member');
INSERT INTO user_wallets VALUES(1,100000,''),(2,100000,'');
""")
for name in ['0103_mascot_pets.sql','0104_mascot_economy.sql','0105_mascot_adventures.sql']:
    db.executescript((root/'backend/migrations'/name).read_text())

now=datetime.now(timezone.utc)
today=now.date().isoformat()
def count(sql,args=()):
    return db.execute(sql,args).fetchone()[0]
def must_fail(sql,args=()):
    before=count('SELECT balance FROM user_wallets WHERE user_id=1'),count('SELECT COUNT(*) FROM wallet_ledger'),count('SELECT COALESCE(SUM(fragments),0) FROM mascot_shell_fragments')
    try:db.execute(sql,args)
    except sqlite3.IntegrityError:pass
    else:raise AssertionError('Unsafe operation allowed: '+sql[:90])
    after=count('SELECT balance FROM user_wallets WHERE user_id=1'),count('SELECT COUNT(*) FROM wallet_ledger'),count('SELECT COALESCE(SUM(fragments),0) FROM mascot_shell_fragments')
    assert before==after,('An invalid action changed currency or shells',before,after)
adopt='INSERT INTO mascot_acquisitions(user_id,species,nickname,cost_cinders) VALUES(?,?,?,?)'
db.execute(adopt,(1,'bloop','Gillz',0))
for s in ['moxie','nib','pippa']:db.execute(adopt,(1,s,s,350))
pets=db.execute("SELECT id,species FROM mascot_pets WHERE user_id=1 ORDER BY id").fetchall()
assert len(pets)==4
start='INSERT INTO mascot_quest_runs(user_id,pet_id,day,action,title) VALUES(?,?,?,?,?)'
claim='INSERT INTO mascot_quest_claims(user_id,quest_id,day) VALUES(?,?,?)'
for i,(pid,species) in enumerate(pets[:3]):
    db.execute(start,(1,pid,today,'feed','Rescue '+species))
    qid=count('SELECT id FROM mascot_quest_runs WHERE pet_id=?',(pid,))
    must_fail(claim,(1,qid,today))
    db.execute('UPDATE mascot_quest_runs SET progress=1 WHERE id=?',(qid,))
    db.execute(claim,(1,qid,today))
    must_fail(claim,(1,qid,today))
    assert count('SELECT fragments FROM mascot_shell_fragments WHERE user_id=1')==i+1
must_fail(start,(1,pets[3][0],today,'play','Fourth quest'))
assert count('SELECT COUNT(*) FROM mascot_quest_claims WHERE user_id=1')==3
assert count('SELECT COUNT(*) FROM wallet_ledger WHERE reason="sanctuary species quest"')==3
assert count('SELECT fragments FROM mascot_shell_fragments WHERE user_id=1')==3
ready=(now+timedelta(minutes=36)).isoformat()
craft="INSERT INTO mascot_rescue_eggs(user_id,species,nickname,started_at,ready_at) VALUES(?,?,?,?,?)"
must_fail(craft,(1,'bloop','duplicate',now.isoformat(),ready))
must_fail(craft,(1,'mini-eddie','locked',now.isoformat(),ready))
db.execute(craft,(1,'zuzu','Acid Egg',now.isoformat(),ready))
egg=count("SELECT id FROM mascot_rescue_eggs WHERE user_id=1 AND species='zuzu'")
assert count('SELECT fragments FROM mascot_shell_fragments WHERE user_id=1')==0
must_fail(craft,(1,'kiki','no shells',now.isoformat(),ready))
must_fail("UPDATE mascot_rescue_eggs SET status='hatched' WHERE id=?",(egg,))
assert count("SELECT COUNT(*) FROM mascot_pets WHERE user_id=1 AND species='zuzu'")==0
# Simulator fast-forward: only test code changes incubation timestamps, not public API.
db.execute("UPDATE mascot_rescue_eggs SET ready_at=? WHERE id=?",((now-timedelta(minutes=3)).isoformat(),egg))
db.execute("UPDATE mascot_rescue_eggs SET status='hatched',hatched_at=? WHERE id=?",(now.isoformat(),egg))
assert count("SELECT COUNT(*) FROM mascot_pets WHERE user_id=1 AND species='zuzu'")==1
must_fail("UPDATE mascot_rescue_eggs SET status='hatched' WHERE id=?",(egg,))
habitat='INSERT INTO mascot_habitats(user_id,pet_id,theme,decoration) VALUES(?,?,?,?)'
db.execute(habitat,(1,pets[0][0],'graveyard','lantern'))
must_fail(habitat,(2,pets[1][0],'cosmic-void','crystal'))
must_fail("UPDATE mascot_habitats SET user_id=2 WHERE pet_id=?",(pets[0][0],))
assert count("SELECT COUNT(*) FROM mascot_habitats WHERE user_id=1")==1
assert count("SELECT COUNT(*) FROM mascot_rescue_eggs WHERE status='hatched'")==1
print('PASS: three quests/day, single claims, atomic rewards, 3-shell craft, chosen-species hatch, incubation and habitat ownership')
