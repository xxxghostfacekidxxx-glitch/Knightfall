import test from 'node:test';
import assert from 'node:assert/strict';
import {forumBotProvenance} from './forum-bot-provenance.mjs';
const identity={serviceAccount:true,username:'news'};
const bot={username:'news',automated:true,enabled:true,source_url:'https://publisher.example/',source_name:'Publisher',category_slug:'news'};
const registry={bots:[bot]};
test('canonical source and disclosure',()=>{
 const result=forumBotProvenance(identity,registry,'https://publisher.example/story?utm_source=x&b=2&a=1#top');
 assert.equal(result.source_url,'https://publisher.example/story?a=1&b=2');
 assert.equal(result.disclosure,'AI Bot');
 assert.equal(result.automated,true);
});
test('rejects unverified or disabled identities',()=>{
 for(const i of [null,{username:'news'},{...identity,username:'other'}])assert.throws(()=>forumBotProvenance(i,registry,'https://publisher.example/story'));
 assert.throws(()=>forumBotProvenance(identity,{bots:[{...bot,enabled:false}]},'https://publisher.example/story'));
});
test('rejects unsafe or nonarticle URLs',()=>{
 for(const url of ['http://publisher.example/story','https://publisher.example.evil.test/story','https://user@publisher.example/story','https://publisher.example/','javascript:alert(1)'])assert.throws(()=>forumBotProvenance(identity,registry,url));
});
