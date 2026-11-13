/* Shared authenticated realtime signal for the full inbox and chat bubbles.
 * D1 remains authoritative. WebSockets carry message IDs only, never bodies. */
(() => {
  "use strict";
  if(window.KnightfallLive)return;
  const URL="wss://api.ash-fall.com/api/messages/live";
  const listeners=new Set();
  let socket=null,retry=null,attempt=0;
  let connected=false;
  const emit=event=>{for(const fn of listeners){try{fn(event);}catch(error){console.warn("message_live_listener_failed",String(error));}}};
  const status=value=>{if(connected===value)return;connected=value;emit({type:"status",connected:value});};
  const clearRetry=()=>{if(retry!==null){clearTimeout(retry);retry=null;}};
  function scheduleRetry(){
    if(document.hidden||!listeners.size||navigator.onLine===false)return;
    clearRetry();
    const delay=Math.min(30000,1000*Math.pow(2,Math.min(5,attempt++)));
    retry=setTimeout(()=>{retry=null;connect();},delay);
  }
  function connect(){
    if(!listeners.size||document.hidden||navigator.onLine===false)return;
    if(socket&&(socket.readyState===WebSocket.CONNECTING||socket.readyState===WebSocket.OPEN))return;
    clearRetry();
    let next;
    try{next=new WebSocket(URL);}catch(error){status(false);scheduleRetry();return;}
    socket=next;
    next.onopen=()=>{
      if(socket!==next)return;
      attempt=0;
      status(true);
    };
    next.onmessage=event=>{
      if(socket!==next)return;
      let data;
      try{data=JSON.parse(event.data);}catch{return;}
      if(data?.type!=="message-event"||!Number.isSafeInteger(Number(data.conversationId))||
        Number(data.conversationId)<1)return;
      if(!["message","typing","reaction","membership","read"].includes(data.kind))return;
      emit({type:"message-event",kind:data.kind,action:String(data.action||"changed"),
        conversationId:Number(data.conversationId),messageId:Number(data.messageId)||0});
    };
    next.onerror=()=>{if(socket===next)status(false);};
    next.onclose=()=>{
      if(socket!==next)return;
      socket=null;
      status(false);
      scheduleRetry();
    };
  }
  function disconnect(){
    clearRetry();
    if(socket){const old=socket;socket=null;try{old.close(1000,"Inactive");}catch{}}
    status(false);
  }
  document.addEventListener("visibilitychange",()=>{if(document.hidden)disconnect();else connect();});
  window.addEventListener("online",connect);
  window.addEventListener("offline",disconnect);
  window.addEventListener("pagehide",disconnect);
  window.addEventListener("pageshow",connect);
  window.KnightfallLive={
    subscribe(fn){
      if(typeof fn!=="function")return ()=>{};
      listeners.add(fn);
      connect();
      fn({type:"status",connected});
      return()=>{listeners.delete(fn);if(!listeners.size)disconnect();};
    },
    get connected(){return connected;}
  };
})();
