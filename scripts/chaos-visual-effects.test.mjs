import test from "node:test";
import assert from "node:assert/strict";
import {applyChaosArtworkEffects,stencilPaperConfig,buildChaosPrintSheet} from "../public/chaos-visual-effects.mjs";
const pixels=(width,height,rgba)=>({width,height,data:new Uint8ClampedArray(rgba)});
const get=(data,x)=>Array.from(data.data.slice(x*4,x*4+4));
test("mirror transfers keep left/right pixels correct without altering source alpha",()=>{
 const art=pixels(3,1,[0,0,0,255,255,255,255,255,255,0,0,128]);
 applyChaosArtworkEffects(art,{mirror:true});
 assert.deepEqual(get(art,0),[255,0,0,128]);
 assert.deepEqual(get(art,1),[255,255,255,255]);
 assert.deepEqual(get(art,2),[0,0,0,255]);
});
test("threshold and transparent white are deterministic for tattoo stencils",()=>{
 const art=pixels(3,1,[10,10,10,255,148,148,148,255,255,255,255,255]);
 applyChaosArtworkEffects(art,{mode:"ink",threshold:145,transparentWhite:true,mirror:true});
 assert.deepEqual(get(art,0),[255,255,255,0]);
 assert.deepEqual(get(art,1),[255,255,255,0]);
 assert.deepEqual(get(art,2),[0,0,0,255]);
});
test("grayscale and optional invert use channel-aware luminance",()=>{
 const gray=pixels(1,1,[255,0,0,255]);
 applyChaosArtworkEffects(gray,{mode:"grayscale"});
 assert.deepEqual(get(gray,0),[54,54,54,255]);
 const reversed=pixels(1,1,[255,0,0,255]);
 applyChaosArtworkEffects(reversed,{mode:"grayscale",invert:true});
 assert.deepEqual(get(reversed,0),[201,201,201,255]);
});
test("outline mode creates narrow dark boundary rather than a solid fill",()=>{
 const w=9,h=9,a=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,black=x>=3&&x<=5&&y>=3&&y<=5;
  a[i]=a[i+1]=a[i+2]=black?0:255;a[i+3]=255;
 }
 const art={width:w,height:h,data:a};
 applyChaosArtworkEffects(art,{mode:"outline",threshold:100});
 const dark=[];for(let i=0;i<a.length;i+=4)if(a[i]===0)dark.push(i/4);
 assert.ok(dark.length>=8,"edges exist");
 assert.ok(dark.length<60,"white areas remain");
 assert.deepEqual(Array.from(a.slice(4*(4*w+4),4*(4*w+4)+3)),[255,255,255],"solid center cleared");
});
test("image processing rejects over-large and malformed input without side effects",()=>{
 assert.throws(()=>applyChaosArtworkEffects(pixels(2,2,[0,0,0,255]),{mode:"normal"}),/Provide image/);
 assert.throws(()=>applyChaosArtworkEffects(pixels(1,1,[0,0,0,255]),{threshold:-1}),/Threshold/);
 assert.throws(()=>applyChaosArtworkEffects(pixels(1,1,[0,0,0,255]),{mode:"execute"}),/Unsupported/);
 assert.throws(()=>applyChaosArtworkEffects({width:4000,height:4000,data:[]}),/up to 1024/);
});
test("physical letter/A4 measurements retain aspect and printable page margins",()=>{
 const config=stencilPaperConfig({paper:"a4",widthMm:100,widthPx:200,heightPx:100});
 assert.equal(config.pageWidthMm,210);assert.equal(config.pageHeightMm,297);
 assert.equal(config.artWidthMm,100);assert.equal(config.artHeightMm,50);
 assert.equal(config.xMm,55);assert.equal(config.yMm,123.5);
 assert.match(config.note,/100%/);
 const letter=stencilPaperConfig({paper:"letter",widthMm:100,widthPx:100,heightPx:200});
 assert.equal(letter.pageWidthMm,215.9);assert.equal(letter.artHeightMm,200);
 assert.throws(()=>stencilPaperConfig({paper:"a4",widthMm:195,widthPx:20,heightPx:20}),/does not fit/);
 assert.throws(()=>stencilPaperConfig({paper:"letter",widthMm:190,widthPx:10,heightPx:100}),/does not fit/);
 assert.throws(()=>stencilPaperConfig({paper:"invalid",widthMm:100,widthPx:10,heightPx:10}),/Choose/);
 assert.throws(()=>stencilPaperConfig({paper:"letter",widthMm:5,widthPx:10,heightPx:10}),/15–195/);
});
test("calibrated printable SVG embeds local raster only and includes exact 50 mm ruler",()=>{
 const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=";
 const printed=buildChaosPrintSheet({paper:"a4",widthMm:100,widthPx:200,heightPx:100,pngDataUrl:png});
 assert.equal(printed.layout.artWidthMm,100);
 assert.match(printed.svg,/width="210mm" height="297mm"/);
 assert.match(printed.svg,/x="55" y="123\.5" width="100" height="50"/);
 assert.ok(printed.svg.includes('href="'+png+'"'));
 assert.match(printed.svg,/M 15 285 h 50/);
 assert.doesNotMatch(printed.svg,/https?:\/\//);
 assert.throws(()=>buildChaosPrintSheet({paper:"a4",widthMm:100,widthPx:50,heightPx:50,pngDataUrl:'data:image/svg+xml,<script/>'}),/locally encoded PNG/);
 assert.throws(()=>buildChaosPrintSheet({paper:"a4",widthMm:100,widthPx:50,heightPx:50,pngDataUrl:png+'<foreignObject/>'}),/locally encoded PNG/);
});
