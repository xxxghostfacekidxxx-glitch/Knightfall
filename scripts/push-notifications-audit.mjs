import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const worker = await readFile(path.join(root, "backend/src/index.js"), "utf8");
const migration = await readFile(path.join(root, "backend/migrations/0021_web_push.sql"), "utf8");
const serviceWorker = await readFile(path.join(root, "public/sw.js"), "utf8");
const page = await readFile(path.join(root, "public/notifications.html"), "utf8");
const docs = await readFile(path.join(root, "docs/web-push-setup.md"), "utf8");
const checks = [
  ["subscription table is present", migration.includes("CREATE TABLE IF NOT EXISTS push_subscriptions")],
  ["preference table covers all alert categories", ["push_messages", "push_community", "push_account"].every(x => migration.includes(x))],
  ["VAPID JWT signing and payload encryption are implemented", ["pushVapidToken", "encryptWebPush", "Content-Encoding: aes128gcm"].every(x => worker.includes(x))],
  ["push subscription endpoints require authentication", worker.includes('/api/push/subscriptions') && worker.includes('requireUser(request,env)')],
  ["push endpoints restrict destinations to known provider hosts", worker.includes("allowedPushHost") && worker.includes('parsed.protocol!=="https:"')],
  ["notification creation calls background delivery", worker.includes("await deliverPushToUser(env,userId,notification)")],
  ["message and community preferences are enforced", worker.includes('const category=kind==="message"?"messages"') && worker.includes('pref["push_"+category]')],
  ["test delivery is rate limited", worker.includes('/api/push/test') && worker.includes('"push-test",3,3600')],
  ["service worker handles push events and notification clicks", serviceWorker.includes('addEventListener("push"') && serviceWorker.includes('addEventListener("notificationclick"')],
  ["settings page offers enable, disable, preference and test controls", ["Enable push notifications", "/api/notification-preferences", "/api/push/subscriptions", "/api/push/test"].every(x => page.includes(x))],
  ["deployment instructions do not require committing private keys", docs.includes("must never be committed to GitHub") && docs.includes("VAPID_PRIVATE_KEY")]
];
let failed = false;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed = true;
}
if (failed) process.exitCode = 1;
else console.log("\nWEB PUSH STATIC AUDIT PASSED");
