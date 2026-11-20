#!/usr/bin/env python3
"""Check Miss Chaos's D1 review migration without touching production."""
import sqlite3
from pathlib import Path

sql = (Path(__file__).resolve().parents[1] / "backend/migrations/0151_chaos_dev_reviews.sql").read_text()
conn = sqlite3.connect(":memory:")
conn.execute("PRAGMA foreign_keys=ON")
conn.executescript(sql)
conn.executescript(sql)  # idempotent setup
tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"chaos_dev_reviews", "chaos_dev_review_events"} <= tables
sha = "a" * 40
conn.execute(
    "INSERT INTO chaos_dev_reviews(id,author_id,source_sha,path,original,candidate,change_summary,syntax_status)"
    " VALUES(?,?,?,?,?,?,?,?)",
    ("p-one", 1, sha, "public/module.js", "const a=1;", "const a=2;",
     "Improve the example code.", "passed"),
)
row = conn.execute("SELECT status,revision,reviewer_id,syntax_status FROM chaos_dev_reviews WHERE id='p-one'").fetchone()
assert row == ("pending", 1, None, "passed"), row
conn.execute("INSERT INTO chaos_dev_review_events(proposal_id,actor_id,action,source_sha) VALUES(?,?,?,?)",
             ("p-one", 1, "submitted", sha))
try:
    conn.execute("INSERT INTO chaos_dev_review_events(proposal_id,actor_id,action,source_sha) VALUES(?,?,?,?)",
                 ("missing", 1, "submitted", sha))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Audit event foreign key not enforced")
try:
    conn.execute("UPDATE chaos_dev_reviews SET status='deployed' WHERE id='p-one'")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Code review cannot declare a deployment status")
try:
    conn.execute("INSERT INTO chaos_dev_reviews(id,author_id,source_sha,path,original,candidate,change_summary,syntax_status)"
                 " VALUES(?,?,?,?,?,?,?,?)",
                 ("p-two", 1, "main", "public/module.js", "x", "y", "Bad SHA", "passed"))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Malformed SHA was not rejected")
print("PASS: reviewed schema, immutable-source SHA constraint, status gates, audit FK and idempotence")
