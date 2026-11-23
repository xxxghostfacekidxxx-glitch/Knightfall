import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Sudoku includes an independent, non-destructive launch watchdog',()=>{
 const html=read('public/arcade/hosted/ash-sudoku/index.html');
 assert.match(html,/id="board"/);
 assert.match(html,/board\.children\.length===81/);
 assert.match(html,/Sudoku launch failed/);
 assert.match(html,/Retry Sudoku/);
 assert.match(html,/location\.reload\(\)/);
 assert.match(html,/saved progress has not been deleted/);
 assert.match(html,/href='\/chaos-cartridge\.html'/);
 assert.doesNotMatch(html,/localStorage\.clear\(\)/);
});
test('Chaos Sudoku catalog entry targets the shipped hosted game',()=>{
 const catalog=JSON.parse(read('public/arcade/catalog.json'));
 const sudoku=catalog.games.find(g=>g.id==='ash-sudoku');
 assert.ok(sudoku);
 assert.equal(sudoku.route,'/arcade/hosted/ash-sudoku/index.html');
});
