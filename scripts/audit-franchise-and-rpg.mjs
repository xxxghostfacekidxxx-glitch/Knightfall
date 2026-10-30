import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','public');
const errors=[];
const read=path=>{const file=resolve(root,path);if(!existsSync(file)){errors.push('Missing '+path);return ''}return readFileSync(file,'utf8')};
const catalog=JSON.parse(read('arcade/catalog.json')||'{"games":[]}');
const expected=['browserquest-solo','sanctuary-original-sanctuary'];
for(const id of expected){const game=catalog.games.find(g=>g.id===id);if(!game)errors.push('Catalog missing '+id);else if(!existsSync(resolve(root,'.'+game.route)))errors.push('Launcher missing '+game.route)}
for(const edition of ['sanctuary-original','sanctuary-end']){
 const base='arcade/hosted/'+edition+'/';const html=read(base+'sanctuary.html');
 const scripts=[...html.matchAll(/<script[^>]+src=["'](js\/[^"']+)["']/g)].map(x=>x[1]);
 if(scripts.length<20)errors.push(edition+': missing expected modular scripts');
 for(const src of scripts)if(!existsSync(resolve(root,base,src)))errors.push(edition+': missing '+src);
 if(!read(base+'js/26-boot.js').includes('Retry loading'))errors.push(edition+': no renderer recovery');
}
const browser=read('arcade/hosted/browserquest-solo/index.html');
for(const asset of ['knightfall-socket.js','knightfall-world.js','js/lib/require-jquery.js'])if(!existsSync(resolve(root,'arcade/hosted/browserquest-solo',asset)))errors.push('BrowserQuest missing '+asset);
if(!browser.includes('knightfall-socket.js'))errors.push('BrowserQuest missing local transport');
const franchise=read('arcade/franchise-imports.html');
for(const project of ['dragon_ball_z_saiyan_cephas','super-saiya-densetsu-2','DRAGON-BALL-GAME','dbz-js','DragonBall-Z-game','7balls','dbzfe_open','jka-web','Star-Wars-Browser-Game','star-wars-rebellion','StarWarsRPG'])if(!franchise.includes(project))errors.push('Franchise directory missing '+project);
console.log(JSON.stringify({checks:'Franchise + BrowserQuest + Sanctuary',sanctuaryEditions:2,franchiseProjects:11,errors},null,2));
if(errors.length)process.exitCode=1;
