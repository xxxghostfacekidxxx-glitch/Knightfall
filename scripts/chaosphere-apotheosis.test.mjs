import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../public/chaosphere-format.js",import.meta.url),"utf8");
const context=vm.createContext({});vm.runInContext(source,context);const fmt=context.ChaosphereFormat;
test("formatting escapes hostile markup and spoilers are collapsed",()=>{const output=fmt.render("**bold** *italic* ||<img onerror=evil>|| `<script>`");assert.match(output,/<strong>bold<\/strong>/);assert.match(output,/<em>italic<\/em>/);assert.match(output,/<span hidden>&lt;img onerror=evil&gt;/);assert.match(output,/<code>&lt;script&gt;<\/code>/);assert.doesNotMatch(output,/<img onerror/);});
test("composer wrapping preserves selection and enforces size",()=>{assert.equal(fmt.wrap("hello",0,5,"**","text").value,"**hello**");assert.equal(fmt.wrap("x".repeat(4000),0,1,"**","text"),null);assert.equal(fmt.command("/spoiler hello"),"||hello||");assert.equal(fmt.command("/unknown"),"/unknown");});

test("formatting and spoiler controls are available in floating chat",()=>{const floating=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");assert.match(floating,/window\.ChaosphereFormat\.render/);assert.match(floating,/data-kf-format="spoiler"/);assert.match(floating,/data-quote-message/);assert.match(floating,/cs-spoiler-toggle/);});
