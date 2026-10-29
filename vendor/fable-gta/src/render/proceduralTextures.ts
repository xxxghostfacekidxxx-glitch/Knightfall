import * as THREE from 'three';
import type { TileType } from '../types';

const SIZE = 128;

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  return [c, c.getContext('2d')!];
}

function noise(ctx: CanvasRenderingContext2D, amount: number, alpha: number) {
  // deterministic speckle
  let seed = 1234;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.globalAlpha = alpha;
  for (let i = 0; i < amount; i++) {
    const v = Math.floor(rand() * 60);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * SIZE, rand() * SIZE, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function asphalt(ctx: CanvasRenderingContext2D, base: string) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  noise(ctx, 650, 0.28);
  ctx.strokeStyle = 'rgba(255,78,191,.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4,4,SIZE-8,SIZE-8);
}

function dashedLine(ctx: CanvasRenderingContext2D, vertical: boolean) {
  ctx.strokeStyle = '#b8ff40';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE);
  } else {
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

export function generateTileTexture(tile: TileType): THREE.Texture {
  const [canvas, ctx] = makeCanvas();
  switch (tile.texture) {
    case 'asphalt_h':
      asphalt(ctx, tile.color);
      dashedLine(ctx, false);
      break;
    case 'asphalt_v':
      asphalt(ctx, tile.color);
      dashedLine(ctx, true);
      break;
    case 'asphalt_x':
      asphalt(ctx, tile.color);
      break;
    case 'pavement': {
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = 'rgba(255,78,191,0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 2; i++) {
        ctx.strokeRect((i * SIZE) / 2, 0, SIZE / 2, SIZE / 2);
        ctx.strokeRect((i * SIZE) / 2, SIZE / 2, SIZE / 2, SIZE / 2);
      }
      noise(ctx, 180, 0.2);
      ctx.fillStyle = 'rgba(184,255,64,.45)';
      ctx.fillRect(0,0,SIZE,3);
      break;
    }
    case 'grass':
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, SIZE, SIZE);
      noise(ctx, 650, 0.25);
      ctx.fillStyle='rgba(184,255,64,.18)';
      for(let i=0;i<12;i++)ctx.fillRect((i*37)%SIZE,(i*59)%SIZE,7,3);
      break;
    case 'water': {
      const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      grad.addColorStop(0, tile.color);
      grad.addColorStop(1, '#3e2078');
      ctx.strokeStyle='rgba(88,245,239,.4)';
      for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,10+i*27);ctx.bezierCurveTo(30,25+i*27,90,0+i*27,SIZE,10+i*27);ctx.stroke()}
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
      break;
    }
    case 'facade': {
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = 'rgba(11,10,30,0.93)';
      for (let y = 12; y < SIZE - 12; y += 28) {
        for (let x = 10; x < SIZE - 10; x += 24) {
          ctx.fillRect(x, y, 14, 18);
          ctx.fillStyle=((x+y)%3===0)?'#b8ff40':'#ff4ebf';
          ctx.fillRect(x+2,y+2,10,2);
          ctx.fillStyle='rgba(11,10,30,.93)';
        }
      }
      break;
    }
    case 'none':
    default:
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, SIZE, SIZE);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function textureFromImageUrl(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}
