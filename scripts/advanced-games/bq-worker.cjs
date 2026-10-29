var log={info:function(){},debug:function(){},error:function(){},warn:function(){}};
globalThis.log=log;
const WorldServer=require('./server/js/worldserver');
const PlayerClass=require('./server/js/player');
let listener,closed=false;
const connection={id:1,listen(fn){listener=fn},onClose(fn){this.closed=fn},send(data){postMessage(JSON.stringify(data))},sendUTF8(data){postMessage(data)},close(){if(closed)return;closed=true;this.closed?.();postMessage({type:'closed'})}};
const server={getConnection(){return connection}};
const world=new WorldServer('knightfall-solo',1,server);
world.setUpdatesPerSecond(20);
world.run('world_server.json');
onmessage=function(e){
 if(e.data.type==='connect'){
  const connect=function(){if(!world.zoneGroupsReady){setTimeout(connect,10);return;}world.connect_callback(new PlayerClass(connection,world));};connect();
 }else if(e.data.type==='message'&&!closed){try{listener?.(JSON.parse(e.data.data))}catch(error){postMessage({type:'error',message:error.message})}}
};
