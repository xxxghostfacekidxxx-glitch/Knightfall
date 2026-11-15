"""Validate Eye of Chaos D1 schema without accessing any real member database."""
import sqlite3
from pathlib import Path

sql = Path("backend/migrations/0142_eye_of_chaos.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE users(id INTEGER PRIMARY KEY, role TEXT NOT NULL)")
db.execute("INSERT INTO users(id,role) VALUES(1,'god')")
db.executescript(sql)
db.executescript(sql)  # migration must be idempotent
tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"eye_chaos_missions","eye_chaos_drafts","eye_chaos_events"} <= tables

db.execute("""INSERT INTO eye_chaos_missions
 (id,created_by,agent_key,division,kind,instructions)
 VALUES('mission-1',1,'chaos-18','agents','research','Find sourced entertainment stories')""")
db.execute("""INSERT INTO eye_chaos_drafts
 (id,mission_id,author_key,title,body)
 VALUES('draft-1','mission-1','chaos-18','Untested title','Unpublished content')""")
db.execute("""UPDATE eye_chaos_drafts SET status='approved',approved_by=1,
 approved_at=CURRENT_TIMESTAMP,approved_version=version WHERE id='draft-1'""")
assert db.execute("SELECT status,approved_version FROM eye_chaos_drafts WHERE id='draft-1'").fetchone()==("approved",1)
for statement in [
 "UPDATE eye_chaos_drafts SET version=2 WHERE id='draft-1'",  # stale approval rejected
 "UPDATE eye_chaos_drafts SET approved_by=NULL WHERE id='draft-1'",
 "UPDATE eye_chaos_missions SET division='unknown' WHERE id='mission-1'",
 "UPDATE eye_chaos_missions SET cadence='hourly' WHERE id='mission-1'",
 "UPDATE eye_chaos_drafts SET status='published',approved_version=999 WHERE id='draft-1'",
]:
 try:
  db.execute(statement)
  raise AssertionError("Unsafe mutation unexpectedly accepted: "+statement)
 except sqlite3.IntegrityError:
  pass
db.execute("""UPDATE eye_chaos_drafts SET title='Revised',body='New draft',version=version+1,
 status='pending',approved_by=NULL,approved_at=NULL,approved_version=NULL WHERE id='draft-1'""")
assert db.execute("SELECT status,version,approved_by FROM eye_chaos_drafts WHERE id='draft-1'").fetchone()==("pending",2,None)
print("Eye of Chaos schema: idempotent, FK constraints intact, versions and approvals guarded.")
