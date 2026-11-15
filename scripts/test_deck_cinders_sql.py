"""Regression tests for atomic, server-priced Deck Locker Cinders purchases."""
import pathlib
import sqlite3
import unittest

MIGRATION = pathlib.Path("backend/migrations/0142_deck_cinders_vip.sql").read_text()


class DeckCindersSqlTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript("""
        CREATE TABLE users(id INTEGER PRIMARY KEY);
        CREATE TABLE user_wallets(user_id INTEGER PRIMARY KEY REFERENCES users(id),balance INTEGER NOT NULL CHECK(balance>=0),updated_at TEXT);
        CREATE TABLE wallet_ledger(id INTEGER PRIMARY KEY,user_id INTEGER,amount INTEGER,reason TEXT,created_at TEXT);
        CREATE TABLE member_premium_memberships(user_id INTEGER PRIMARY KEY REFERENCES users(id),status TEXT,expires_at TEXT);
        """)
        self.db.executescript(MIGRATION)
        self.db.execute("INSERT INTO users(id) VALUES(1),(2)")
        self.db.execute("INSERT INTO user_wallets(user_id,balance) VALUES(1,2000),(2,2000)")

    def buy(self, user_id, skin, price):
        self.db.execute("INSERT INTO arcade_deck_cinder_purchases(user_id,skin_id,cost_cinders) VALUES(?,?,?)", (user_id, skin, price))

    def balance(self, user_id):
        return self.db.execute("SELECT balance FROM user_wallets WHERE user_id=?", (user_id,)).fetchone()[0]

    def test_12_public_6_vip_and_unique_prices(self):
        rows = self.db.execute("SELECT tier,COUNT(*) FROM arcade_deck_cinder_catalog GROUP BY tier").fetchall()
        self.assertEqual(dict(rows), {"cinders": 12, "vip": 6})
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM arcade_deck_cinder_catalog").fetchone()[0], 18)

    def test_exact_price_one_purchase_one_debit_one_ledger_entry(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "ashen-baroque", 1)
        self.assertEqual(self.balance(1), 2000)
        self.buy(1, "ashen-baroque", 300)
        self.assertEqual(self.balance(1), 1700)
        self.assertEqual(self.db.execute("SELECT SUM(amount),COUNT(*) FROM wallet_ledger WHERE user_id=1").fetchone(), (-300, 1))
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "ashen-baroque", 300)
        self.assertEqual(self.balance(1), 1700)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM wallet_ledger WHERE user_id=1").fetchone()[0], 1)

    def test_insufficient_funds_never_grants_or_spends(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "nocturne-arcade", 9000)
        self.db.execute("UPDATE user_wallets SET balance=10 WHERE user_id=1")
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "nocturne-arcade", 900)
        self.assertEqual(self.balance(1), 10)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM arcade_deck_cinder_purchases").fetchone()[0], 0)

    def test_vip_expiration_and_account_isolation(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "infernal-covenant", 1200)
        self.db.execute("INSERT INTO member_premium_memberships(user_id,status,expires_at) VALUES(1,'active','2020-01-01')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(1, "infernal-covenant", 1200)
        self.db.execute("UPDATE member_premium_memberships SET expires_at=NULL WHERE user_id=1")
        self.buy(1, "infernal-covenant", 1200)
        self.assertEqual(self.balance(1), 800)
        with self.assertRaises(sqlite3.IntegrityError):
            self.buy(2, "infernal-covenant", 1200)
        self.assertEqual(self.balance(2), 2000)


if __name__ == "__main__":
    unittest.main()
