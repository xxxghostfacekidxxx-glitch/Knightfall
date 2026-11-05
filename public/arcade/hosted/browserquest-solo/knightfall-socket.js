/* Knightfall solo transport: original BrowserQuest server runs in this tab's Worker. */
window.KnightfallLocalSocket=class {
 constructor(){this.readyState=0;this.worker=new Worker('knightfall-world.js');this.worker.onmessage=event=>{if(event.data?.type==='error'){this.onerror?.(new Error(event.data.message));return;}if(event.data?.type==='closed'){this.close();return;}this.onmessage?.({data:event.data})};this.worker.onerror=event=>this.onerror?.(event);setTimeout(()=>{this.readyState=1;this.onopen?.({});this.worker.postMessage({type:'connect'})},0)}
 send(data){this.worker.postMessage({type:'message',data})}
 close(){this.readyState=3;this.worker.terminate();this.onclose?.({})}
};
