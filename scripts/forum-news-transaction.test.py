import sqlite3
import unittest

class NewsTransactionTest(unittest.TestCase):
    def test_claim_deduplication_and_rollback(self):
        db = sqlite3.connect(":memory:")
        self.addCleanup(db.close)
        db.executescript("CREATE TABLE log(bot TEXT, slot TEXT, url TEXT, PRIMARY KEY(bot,slot)); CREATE TABLE threads(slug TEXT UNIQUE);")
        def publish(slot, url, slug):
            with db:
                db.execute("INSERT OR IGNORE INTO log SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM log WHERE bot=? AND url=?)", ("bot",slot,url,"bot",url))
                db.execute("INSERT INTO threads SELECT ? WHERE changes()=1", (slug,))
        publish("1","a","first")
        publish("2","a","duplicate")
        publish("1","b","duplicate-slot")
        self.assertEqual(db.execute("SELECT count(*) FROM threads").fetchone()[0],1)
        with self.assertRaises(sqlite3.IntegrityError):
            publish("3","c","first")
        self.assertEqual(db.execute("SELECT count(*) FROM log").fetchone()[0],1)
        publish("3","c","second")
        self.assertEqual(db.execute("SELECT count(*) FROM threads").fetchone()[0],2)

if __name__ == "__main__":
    unittest.main()
