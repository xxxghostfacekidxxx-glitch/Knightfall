/* Only negotiate protected retry with an upgraded API and database. */
(function(root){
"use strict";
let capabilityPromise=null;
function probe(api){if(!capabilityPromise)capabilityPromise=Promise.resolve().then(()=>api("/api/messages/send-capabilities")).then(data=>data?.keyed_send===true).catch(()=>false);return capabilityPromise;}
async function send(api,path,payload){
 if(!root.crypto?.randomUUID||!await probe(api))return api(path,{method:"POST",body:JSON.stringify(payload)});
 const body=JSON.stringify({...payload,client_message_id:root.crypto.randomUUID()});
 try{return await api(path,{method:"POST",body});}
 catch(error){if(error?.status&&error.status<500)throw error;return api(path,{method:"POST",body});}
}
root.ChaosphereSend=Object.freeze({send});
})(globalThis);
