/* Only negotiate protected retry with an upgraded API and database. */
(function(root){
"use strict";
let capabilityPromise=null,capabilityUntil=0;
function probe(api){if(!capabilityPromise||Date.now()>=capabilityUntil){capabilityUntil=Date.now()+60000;capabilityPromise=Promise.resolve().then(()=>api("/api/messages/send-capabilities")).then(data=>{const supported=data?.keyed_send===true;capabilityUntil=Date.now()+(supported?300000:30000);return supported;}).catch(()=>{capabilityUntil=Date.now()+5000;return false;});}return capabilityPromise;}
async function send(api,path,payload){
 if(!root.crypto?.randomUUID||!await probe(api))return api(path,{method:"POST",body:JSON.stringify(payload)});
 const body=JSON.stringify({...payload,client_message_id:root.crypto.randomUUID()});
 try{return await api(path,{method:"POST",body});}
 catch(error){if(error?.status&&error.status<500)throw error;return api(path,{method:"POST",body});}
}
root.ChaosphereSend=Object.freeze({send});
})(globalThis);
