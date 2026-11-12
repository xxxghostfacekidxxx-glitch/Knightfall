import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const backend = read("../backend/src/index.js");
const migration = read("../backend/migrations/0033_account_deletion_requests.sql");
const uniqueMigration = read("../backend/migrations/0128_account_deletion_requests_unique.sql");
const account = read("../public/account.html");
const homepage = read("../public/homepage.html");
const publicPage = read("../public/account-deletion.html");
const adminPage = read("../public/admin-deletion-requests.html");
const privacy = read("../public/privacy.html");
const manifest = JSON.parse(read("../public/manifest.webmanifest"));

assert.match(migration, /CREATE TABLE IF NOT EXISTS account_deletion_requests/);
assert.match(migration, /user_id INTEGER REFERENCES users\(id\) ON DELETE SET NULL/);
assert.match(migration, /scheduled_for TEXT NOT NULL/);
assert.match(uniqueMigration, /CREATE TABLE IF NOT EXISTS account_deletion_requests/, "additive migration must install missing request table");
assert.match(uniqueMigration, /CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_requests_one_active_user/);
assert.match(uniqueMigration, /WHERE status IN \('pending','in_progress'\) AND user_id IS NOT NULL/, "only active deletion requests should be unique");
assert.match(backend, /if\(url\.pathname==="\/api\/account\/deletion-request"&&request\.method==="POST"\)/);
assert.match(backend, /requireUser\(request,env\)/);
assert.match(backend, /verifyPassword\(password,credential\.password_hash\)/);
assert.match(backend, /confirmation!==String\(user\.username\)\.toLowerCase\(\)/);
assert.match(backend, /status IN \(\x27pending\x27,\x27in_progress\x27\)/, "duplicate active requests must be prevented");
assert.match(backend, /INSERT OR IGNORE INTO account_deletion_requests/, "duplicate submission must not throw after unique-index contention");
assert.match(backend, /Number\(inserted\.meta\?\.changes\|\|0\)!==1/, "only the winning insert should notify staff");
assert.match(backend, /if\(current\)return json\(\{ok:true,already_pending:true/, "duplicate must return the existing active request");
assert.match(backend, /request\.method==="DELETE"/);
assert.match(backend, /rateLimit\(env,request,"account-deletion-request"/);
assert.match(backend, /account\.deletion\.request/);
assert.match(backend, /kind:"account_deletion_request"/);
assert.match(backend, /url:"\/admin-deletion-requests\.html"/);
assert.match(backend, /if\(url\.pathname==="\/api\/admin\/account-deletion-requests"&&request\.method==="GET"\)/);
assert.match(backend, /if\(deletionRequestMatch&&request\.method==="PATCH"\)/);
assert.match(backend, /\["in_progress","rejected"\]\.includes\(status\)/);

const cancellation=backend.split('if(url.pathname==="/api/account/deletion-request"&&request.method==="DELETE"){')[1]?.split('const deletionRequestMatch=')[0];
const adminTransition=backend.split('if(deletionRequestMatch&&request.method==="PATCH"){')[1]?.split('if(url.pathname.startsWith("/api/admin/safety-reports/")')[0];
assert.ok(cancellation && adminTransition, "deletion request handlers must exist");
assert.match(cancellation, /WHERE id=\? AND user_id=\? AND status='pending'/, "cancellation must update only its owner's pending request");
assert.match(cancellation, /Number\(cancelled\.meta\?\.changes\|\|0\)!==1/, "cancellation must not report success if a concurrent status change won");
assert.match(cancellation, /409,origin/, "stale cancellation returns conflict");
assert.match(adminTransition, /!\["pending","in_progress"\]\.includes\(row\.status\)/, "terminal deletion requests cannot reopen");
assert.match(adminTransition, /status==="rejected"&&!\(typeof body\.operator_note==="string"&&body\.operator_note\.trim\(\)\)/, "rejecting a request requires an explicitly supplied new reason, not a stale note");
assert.match(adminTransition, /WHERE id=\? AND status=\? AND operator_note=\?/, "admin writes must compare original status and note to prevent lost updates");
assert.match(adminTransition, /\.bind\(status,user\.id,note,id,row\.status,String\(row\.operator_note\|\|""\)\)/, "conditional write must bind values read from the ticket");
assert.match(adminTransition, /Number\(updated\.meta\?\.changes\|\|0\)!==1/, "concurrent admin status updates must fail closed");
assert.match(adminTransition, /from:row\.status,to:status/, "audit must retain the transition's previous state");

assert.match(adminTransition, /SELECT id,status,user_id,operator_note FROM account_deletion_requests/, "staff updates must load the previous note");
assert.match(adminTransition, /typeof body\.operator_note==="string"\?body\.operator_note\.trim\(\)\.slice\(0,1000\):String\(row\.operator_note\|\|""\)/, "status-only updates must preserve prior staff notes");


assert.match(homepage, /rel="manifest" href="\/manifest\.webmanifest"/);
assert.match(account, /id="delete-account-form"/);
assert.match(account, /id="delete-account-confirm"/);
assert.match(account, /autocomplete="current-password"/);
assert.match(account, /id="delete-account-username"/);

assert.match(account, /request deletion assistance<\/a> instead/);
assert.match(account, /href="\/account-deletion\.html#deletion-assistance"/);
assert.match(publicPage, /id="deletion-assistance"/);
assert.match(publicPage, /Social-login users who have no Ash-Fall password/);
assert.match(backend, /if\(!credential\?\.password_hash\|\|!password\|\|!\(await verifyPassword\(password,credential\.password_hash\)\)\)/, "signed-in deletion requests must retain password verification");

assert.match(account, /cancel-deletion-request/);
assert.match(publicPage, /account-deletion\.html|Account deletion/i);
assert.match(publicPage, /does not immediately erase/i);
assert.match(adminPage, /does not erase account data/i);
assert.doesNotMatch(adminPage, /data-action="completed"/);
assert.match(adminPage, /JSON\.stringify\(note\?\{status:button\.dataset\.action,operator_note:note\}:\{status:button\.dataset\.action\}\)/, "admin frontend must omit blank notes rather than clearing existing evidence");
assert.match(privacy, /does not itself erase the account/i);
assert.ok(manifest.shortcuts.length >= 3, "PWA must retain its three core shortcuts");
for (const url of ["/homepage.html", "/chaos-cartridge.html", "/messages.html"]) assert.ok(manifest.shortcuts.some(item => item.url.startsWith(url)), `Missing core shortcut: ${url}`);
assert.ok(manifest.icons.some(icon => icon.src === "/icons/chaos-cartridge-maskable.svg"));
assert.ok(existsSync(new URL("../public/icons/chaos-cartridge-maskable.svg", import.meta.url)));

console.log("Account deletion request static audit passed. Full data deletion remains an explicit release blocker.");
