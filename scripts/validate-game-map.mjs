#!/usr/bin/env node
// Validate exported Tiled JSON and LDtk JSON before importing into Knightfall games.
// Usage: node scripts/validate-game-map.mjs path/to/map.json
import {readFile} from 'node:fs/promises';
const files=process.argv.slice(2);
if(!files.length){console.error('Usage: node scripts/validate-game-map.mjs <map.json> [...]');process.exit(2)}
let failures=0;
for(const file of files){
 try{
  const map=JSON.parse(await readFile(file,'utf8'));
  if(map.__header__?.fileType==='LDtk Project'||Array.isArray(map.levels)&&map.defs){
   if(!Array.isArray(map.levels))throw Error('LDtk project missing levels');
   for(const level of map.levels){
    if(!(level.pxWid>0&&level.pxHei>0))throw Error('LDtk level '+level.identifier+' has invalid dimensions');
    if(!Array.isArray(level.layerInstances)&&level.layerInstances!==null)throw Error('LDtk layerInstances malformed');
   }
   console.log('PASS LDtk '+file+': '+map.levels.length+' levels');
  }else if(map.type==='map'&&Array.isArray(map.layers)){
   if(!(map.width>0&&map.height>0&&map.tilewidth>0&&map.tileheight>0))throw Error('Tiled map dimensions invalid');
   for(const layer of map.layers){
    if(layer.type==='tilelayer'&&Array.isArray(layer.data)&&!map.infinite&&layer.data.length!==map.width*map.height)throw Error('Tiled tile layer '+layer.name+' size mismatch');
   }
   console.log('PASS Tiled '+file+': '+map.layers.length+' layers');
  }else throw Error('Not a recognized Tiled or LDtk map export');
 }catch(e){failures++;console.error('FAIL '+file+': '+e.message)}
}
if(failures)process.exitCode=1;
