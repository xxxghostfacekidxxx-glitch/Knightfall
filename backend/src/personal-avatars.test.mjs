import test from 'node:test';
import assert from 'node:assert/strict';
import {canViewPersonalAvatar} from './personal-avatars.js';

function envFor({blocked=false,friends=false}={}){
 const queries=[];
 return {queries,DB:{prepare(sql){return{bind(...values){return{async first(){queries.push({sql,values});return sql.includes('friend_requests')?(friends?{ok:1}:null):(blocked?{ok:1}:null)}}}}}}};
}
const owner={id:20,profile_visibility:'private'};
const adminViewer={id:10,role:'admin',status:'active'};

test('personal avatar privacy is honored for staff and members alike',async()=>{
 const env=envFor();
 assert.equal(await canViewPersonalAvatar(env,owner,adminViewer),false);
 assert.equal(await canViewPersonalAvatar(env,owner,{id:11,role:'member'}),false);
 assert.equal(env.queries.length,0,'private profiles need no friendship/block lookups');
});

test('self access is preserved while blocks override public visibility',async()=>{
 const env=envFor({blocked:true});
 assert.equal(await canViewPersonalAvatar(env,owner,{id:20,role:'member'}),true);
 assert.equal(await canViewPersonalAvatar(env,{...owner,profile_visibility:'public'},adminViewer),false);
});

test('friends-only avatars require a current accepted friendship',async()=>{
 const target={...owner,profile_visibility:'friends'};
 assert.equal(await canViewPersonalAvatar(envFor(),target,adminViewer),false);
 assert.equal(await canViewPersonalAvatar(envFor({friends:true}),target,adminViewer),true);
 assert.equal(await canViewPersonalAvatar(envFor({friends:true,blocked:true}),target,adminViewer),false);
});
