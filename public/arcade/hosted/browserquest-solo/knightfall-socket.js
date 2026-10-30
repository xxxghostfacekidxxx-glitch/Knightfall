/* Knightfall solo transport: original BrowserQuest server runs in this tab's Worker. */
window.KnightfallLocalSocket=class {
 constructor(){
  this.readyState=0;this._queue=[];this._closed=false;
  try{this.worker=new Worker('knightfall-world.js')}catch(error){this.readyState=3;queueMicrotask(()=>this.onerror?.(error));return}
  this.worker.onmessage=event=>{
   if(this._closed)return;
   if(event.data?.type==='error'){this.onerror?.(new Error(event.data.message));return}
   if(event.data?.type==='closed'){this.close();return}
   this.onmessage?.({data:event.data});
  };
  this.worker.onerror=event=>{if(!this._closed)this.onerror?.(event)};
  queueMicrotask(()=>{
   if(this._closed)return;
   this.readyState=1;this.onopen?.({});this.worker.postMessage({type:'connect'});
   for(const data of this._queue)this.worker.postMessage({type:'message',data});
   this._queue.length=0;
  });
 }
 send(data){
  if(this.readyState===3)throw new Error('BrowserQuest solo connection is closed');
  if(this.readyState!==1){this._queue.push(data);return}
  this.worker.postMessage({type:'message',data});
 }
 close(){if(this._closed)return;this._closed=true;this.readyState=3;this._queue.length=0;this.worker?.terminate();this.onclose?.({})}
};
