/* Cinderwild account backups use Knightfall's existing authenticated arcade save service.
   Single-player saves are client-controlled; never treat these as authoritative PvP assets. */
(()=>{
"use strict";
const GAME="cinderwild",SLOT="autosave",BACKUP_PREFIX="knightfall:cinderwild:pre-cloud:";
const api=window.AshFallArcade,game=window.CinderwildGame;
const $=id=>document.getElementById(id);
const ui={status:$("cloud-status"),upload:$("cloud-upload"),restore:$("cloud-restore"),backup:$("cloud-backup"),pause:$("cloud-pause"),signin:$("cloud-signin")};
if(!api||!game||!ui.status)return;
let user=null,remote=null,ready=false,enabled=false,busy=false,dirty=false,muted=false,timer=null;
const getBackupKey=()=>BACKUP_PREFIX+String(user?.id??"guest");
function message(value){ui.status.textContent=value;}
function updateUI(){
 const signed=Boolean(user),available=ready&&signed&&!busy&&!game.isBusy();
 ui.upload.hidden=!signed;ui.restore.hidden=!signed||!remote;ui.pause.hidden=!signed||!enabled;
 ui.signin.hidden=signed;
 ui.upload.disabled=!available;
 ui.restore.disabled=!available||!remote;
 ui.pause.disabled=!signed||busy;
 ui.backup.hidden=!signed||!localStorage.getItem(getBackupKey());
 ui.backup.disabled=!available;
}
function halt(text){
 enabled=false;dirty=false;if(timer!==null)clearTimeout(timer);timer=null;
 if(text)message(text);
 updateUI();
}
async function verifyAccount(){
 const identity=await api.request("/api/auth/me");
 if(!identity.user||String(identity.user.id)!==String(user?.id)){
  halt("Your signed-in account changed. Cloud saves paused; reload the page to reconnect safely.");
  throw new Error("Account identity changed.");
 }
}
function schedule(){
 if(!enabled||busy||!dirty)return;
 if(timer!==null)clearTimeout(timer);
 timer=setTimeout(()=>{timer=null;void autoUpload();},4500);
}
async function autoUpload(){
 if(!enabled||busy||!dirty)return;
 if(game.isBusy()){schedule();return;}
 const snapshot=game.snapshot();
 if(JSON.stringify(snapshot)===JSON.stringify(remote)){dirty=false;return;}
 busy=true;updateUI();
 try{
  await verifyAccount();
  await api.saveProgress(GAME,snapshot,SLOT,1);
  remote=snapshot;
  dirty=JSON.stringify(game.snapshot())!==JSON.stringify(snapshot);
  message("✓ Saved to your Knightfall account. Automatic syncing is active.");
 }catch(error){
  halt(error.status===409
   ?"Cloud progress changed on another device. Autosave is paused. Choose which version to keep."
   :"Cloud save failed: "+error.message+". Local progress remains on this device; autosave is paused.");
  if(error.status===409){try{remote=await api.loadProgress(GAME,SLOT);}catch{}}
 }finally{busy=false;updateUI();if(enabled&&dirty)schedule();}
}
async function upload(){
 if(!ready||busy||!user||game.isBusy())return;
 const snapshot=game.snapshot();
 if(!snapshot.party.length){message("Choose a starter before uploading an account save.");return;}
 if(remote&&JSON.stringify(remote)!==JSON.stringify(snapshot)
   &&!confirm("Replace this account's Cinderwild save with this device's progress? The account version will be overwritten."))return;
 busy=true;updateUI();message("Saving this device's progress to your account…");
 try{
  await verifyAccount();
  await api.saveProgress(GAME,snapshot,SLOT,1);
  remote=snapshot;enabled=true;
  dirty=JSON.stringify(game.snapshot())!==JSON.stringify(snapshot);
  message("✓ Account backup saved. Future progress will sync automatically while this page is open.");
 }catch(error){
  halt(error.status===409
   ?"A newer account save was detected. Your local save is untouched. Reload the account copy before replacing it."
   :"Account save failed: "+error.message+". Local progress is untouched.");
  if(error.status===409){try{remote=await api.loadProgress(GAME,SLOT);}catch{}}
 }finally{busy=false;updateUI();if(enabled&&dirty)schedule();}
}
async function restore(){
 if(!ready||busy||!remote||!user||game.isBusy())return;
 if(!confirm("Use your Knightfall account's saved game on this device? A backup of this device's current progress will be kept locally."))return;
 busy=true;updateUI();
 try{
  await verifyAccount();
  const latest=await api.loadProgress(GAME,SLOT);
  if(!latest||!Array.isArray(latest.party))throw new Error("The account save is invalid.");
  const backup=JSON.stringify(game.snapshot());
  try{localStorage.setItem(getBackupKey(),backup);}
  catch{throw new Error("Could not back up the local game. No progress was replaced.");}
  muted=true;
  try{if(!game.restore(latest))throw new Error("Finish the current interaction before restoring a save.");}
  finally{muted=false;}
  remote=latest;enabled=true;dirty=false;
  message("✓ Account progress loaded. A copy of the previous local save is kept for recovery.");
 }catch(error){halt("Could not restore account progress: "+error.message);}
 finally{busy=false;updateUI();}
}
function restoreBackup(){
 if(!ready||busy||!user||game.isBusy())return;
 const json=localStorage.getItem(getBackupKey());if(!json)return;
 if(!confirm("Restore the previous device backup? This replaces current local progress and pauses cloud syncing."))return;
 let data;try{data=JSON.parse(json);}catch{message("The local backup could not be read.");return;}
 muted=true;
 try{
  if(!game.restore(data)){message("Local backup is invalid. No progress was replaced.");return;}
  halt("Previous device save restored. Cloud sync is paused until you choose to upload or reload.");
 }finally{muted=false;updateUI();}
}
async function initialize(){
 ui.signin.href="/auth.html?next="+encodeURIComponent(location.pathname+location.search);
 message("Checking your Knightfall account…");
 updateUI();
 try{
  await api.ready;
  user=api.user;
  if(!user){ready=true;message("Playing offline. Sign in to back up Cinderwild across devices.");updateUI();return;}
  remote=await api.loadProgress(GAME,SLOT);
  ready=true;
  if(remote&&JSON.stringify(remote)===JSON.stringify(game.snapshot())){
   enabled=true;
   message("✓ Your device matches your account save. Automatic cloud syncing is ready.");
  }else if(remote){
   message("An account save exists. Choose 'Use account save' or 'Upload this device' to resolve the difference. Neither version has been overwritten.");
  }else{
   message("No Cinderwild account save yet. Upload this device to begin automatic syncing.");
  }
 }catch(error){
  ready=false;
  message("Cloud saves unavailable: "+error.message+". Your local game still works.");
 }
 updateUI();
}
document.addEventListener("cinderwild:local-save",()=>{
 if(muted||!enabled)return;
 dirty=true;schedule();
});
ui.upload?.addEventListener("click",()=>{void upload();});
ui.restore?.addEventListener("click",()=>{void restore();});
ui.backup?.addEventListener("click",restoreBackup);
ui.pause?.addEventListener("click",()=>halt("Cloud syncing paused. Your local save remains available."));
void initialize();
})();