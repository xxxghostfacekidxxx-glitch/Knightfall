"""Regression tests for the additive account-deletion D1 migration.

Uses a temporary in-memory SQLite database; never accesses production data.
"""
import sqlite3
import unittest
from pathlib import Path

MIGRATION = Path(__file__).resolve().parents[1] / "backend/migrations/0128_account_deletion_requests_unique.sql"


class AccountDeletionMigrationTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript("CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users(id) VALUES (1),(2);")
        self.db.executescript(MIGRATION.read_text(encoding="utf-8"))

    def tearDown(self):
        self.db.close()

    def add(self, user, status):
        self.db.execute(
            "INSERT INTO account_deletion_requests "
            "(user_id, username_snapshot, email_snapshot, status, requested_at, scheduled_for) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (user, f"user{user}", f"user{user}@example.com", status, "2026-11-11", "2026-12-11"),
        )

    def test_only_one_active_request_per_user(self):
        self.add(1, "pending")
        with self.assertRaises(sqlite3.IntegrityError):
            self.add(1, "pending")
        with self.assertRaises(sqlite3.IntegrityError):
            self.add(1, "in_progress")
        self.add(2, "pending")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM account_deletion_requests").fetchone()[0], 2)

    def test_pending_to_in_progress_keeps_unique_reservation(self):
        self.add(1, "pending")
        self.db.execute("UPDATE account_deletion_requests SET status='in_progress' WHERE user_id=1")
        with self.assertRaises(sqlite3.IntegrityError):
            self.add(1, "pending")

    def test_terminal_requests_allow_new_request(self):
        for terminal in ("rejected", "completed"):
            self.add(1, terminal)
        self.add(1, "pending")
        with self.assertRaises(sqlite3.IntegrityError):
            self.add(1, "pending")

    def test_migration_can_be_replayed_safely(self):
        self.db.executescript(MIGRATION.read_text(encoding="utf-8"))
        self.add(1, "pending")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM account_deletion_requests").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main()
