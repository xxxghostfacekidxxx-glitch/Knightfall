/**
 * Knightfall first-party PDF raster bridge.
 * Reconstructs bounded 8-bit DeviceGray/DeviceRGB PDF image samples as a BMP
 * that the browser can decode with createImageBitmap, without a PDF renderer,
 * a third-party package, network access or uploaded file bytes.
 * Unsupported color spaces, masks, bit depths and filters must stay explicit.
 */
export function pdfRasterToBmp(data,{width,height,colors,bitsPerComponent=8,predictor=1,columns=width}={}){
 if(!(data instanceof Uint8Array))throw Error("PDF raster data must be bytes.");
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||
  width*height>4000000)throw Error("PDF raster dimensions exceed safe limits.");
 if(![1,3].includes(colors)||bitsPerComponent!==8||columns!==width)
  throw Error("Unsupported PDF raster color or sample format.");
 if(![1,2,10,11,12,13,14,15].includes(predictor))
  throw Error("Unsupported PDF image predictor.");
 const rowBytes=width*colors,encodedRowBytes=rowBytes+(predictor>=10?1:0);
 if(data.length!==encodedRowBytes*height)throw Error("PDF raster row length does not match image metadata.");
 const stride=(width*3+3)&~3,length=54+stride*height;
 if(length>16000000)throw Error("PDF raster expands beyond safe bitmap limit.");
 const bmp=new Uint8Array(length),view=new DataView(bmp.buffer);
 bmp[0]=66;bmp[1]=77;
 view.setUint32(2,length,true);view.setUint32(10,54,true);
 view.setUint32(14,40,true);view.setInt32(18,width,true);view.setInt32(22,height,true);
 view.setUint16(26,1,true);view.setUint16(28,24,true);
 view.setUint32(34,length-54,true);
 let previous=new Uint8Array(rowBytes);
 for(let y=0;y<height;y++){
  const source=y*encodedRowBytes,filter=predictor>=10?data[source]:predictor===2?1:0;
  if(filter>4)throw Error("Unsupported PDF PNG row filter.");
  const start=source+(predictor>=10?1:0),row=new Uint8Array(rowBytes);
  for(let i=0;i<rowBytes;i++){
   const left=i>=colors?row[i-colors]:0,up=previous[i],upperLeft=i>=colors?previous[i-colors]:0;
   let delta=0;
   if(filter===1)delta=left;
   if(filter===2)delta=up;
   if(filter===3)delta=Math.floor((left+up)/2);
   if(filter===4){
    const p=left+up-upperLeft,da=Math.abs(p-left),db=Math.abs(p-up),dc=Math.abs(p-upperLeft);
    delta=da<=db&&da<=dc?left:db<=dc?up:upperLeft;
   }
   row[i]=(data[start+i]+delta)&255;
  }
  const destination=54+(height-y-1)*stride;
  for(let x=0;x<width;x++){
   const offset=x*colors,at=destination+x*3;
   if(colors===1)bmp[at]=bmp[at+1]=bmp[at+2]=row[offset];
   else{bmp[at]=row[offset+2];bmp[at+1]=row[offset+1];bmp[at+2]=row[offset];}
  }
  previous=row;
 }
 return bmp;
}
