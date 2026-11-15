#!/usr/bin/env python3
"""Validate that Eye of Horus access events cannot be edited/deleted in app SQL."""
from pathlib import Path
import sqlite3

db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY,role TEXT NOT NULL); INSERT INTO users VALUES(1,'god'),(2,'admin');")
migration=Path(__file__).resolve().parents[1]/"backend/migrations/0131_eye_of_horus_audit.sql"
db.executescript(migration.read_text())
db.executescript(migration.read_text())
params=(1,"review","direct_messages","Investigation of a verified safety report",2,None,10)
db.execute("INSERT INTO eye_of_horus_access_log(god_user_id,action,category,reason,target_user_id,object_id,result_count) VALUES(?,?,?,?,?,?,?)",params)
for statement in ("UPDATE eye_of_horus_access_log SET reason='rewritten' WHERE id=1",
                  "DELETE FROM eye_of_horus_access_log WHERE id=1"):
    try: db.execute(statement)
    except sqlite3.IntegrityError as error:
        assert "eye_audit_append_only" in str(error),str(error)
    else: raise AssertionError("Eye audit ledger was mutable: "+statement)
for bad in [(1,"review","direct_messages","too short",None,None,1),
            (1,"review","unapproved_dataset","A sufficiently long review reason",None,None,1)]:
    try:
        db.execute("INSERT INTO eye_of_horus_access_log(god_user_id,action,category,reason,target_user_id,object_id,result_count) VALUES(?,?,?,?,?,?,?)",bad)
    except sqlite3.IntegrityError: pass
    else: raise AssertionError("Invalid access record was allowed")
assert db.execute("SELECT COUNT(*) FROM eye_of_horus_access_log").fetchone()[0]==1
print("PASS: Eye of Horus migration is idempotent, append-only, and validates review purposes and datasets")
