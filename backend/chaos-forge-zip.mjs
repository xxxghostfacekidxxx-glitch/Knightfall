// Standards-compatible uncompressed ZIP, bounded to the existing 32 KiB Forge artifact limit.
const enc=new TextEncoder();
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function zipProject(files){
 if(!Array.isArray(files)||files.length<1||files.length>20)throw Error("Project must contain 1–20 files.");
 const chunks=[],central=[],seen=new Set();let offset=0,centralSize=0;
 function header(size){const bytes=new Uint8Array(size),v=new DataView(bytes.buffer);return {bytes,u16:(p,x)=>v.setUint16(p,x,true),u32:(p,x)=>v.setUint32(p,x,true)};}
 for(const file of files){
  if(!file||typeof file.path!=="string"||file.path.length>100||!file.path.split("/").every(p=>/^[A-Za-z0-9][A-Za-z0-9._-]{0,50}$/.test(p)&&p!=="."&&p!=="..")||seen.has(file.path.toLowerCase())||typeof file.content!=="string")throw Error("Unsafe or duplicate project filename.");
  seen.add(file.path.toLowerCase());const name=enc.encode(file.path),data=enc.encode(file.content),crc=crc32(data);
  const h=header(30);h.u32(0,0x04034b50);h.u16(4,20);h.u16(6,0x800);h.u16(12,33);h.u32(14,crc);h.u32(18,data.length);h.u32(22,data.length);h.u16(26,name.length);
  const c=header(46);c.u32(0,0x02014b50);c.u16(4,20);c.u16(6,20);c.u16(8,0x800);c.u16(14,33);c.u32(16,crc);c.u32(20,data.length);c.u32(24,data.length);c.u16(28,name.length);c.u32(42,offset);
  chunks.push(h.bytes,name,data);central.push(c.bytes,name);offset+=30+name.length+data.length;centralSize+=46+name.length;
  if(offset+centralSize+22>32768)throw Error("Project archive exceeds 32 KiB.");
 }
 const end=header(22);end.u32(0,0x06054b50);end.u16(8,files.length);end.u16(10,files.length);end.u32(12,centralSize);end.u32(16,offset);
 const out=new Uint8Array(offset+centralSize+22);let pos=0;for(const part of [...chunks,...central,end.bytes]){out.set(part,pos);pos+=part.length;}return out;
}
