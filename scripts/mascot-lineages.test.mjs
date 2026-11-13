import test from 'node:test';
import assert from 'node:assert/strict';
import {PET_AFFINITIES,SPECIES_AFFINITY,affinityFor,stagesFor,growthFor,GROWTH_FORM_NAMES} from '../backend/src/mascot-lineages.js';
import {PET_MARKET} from '../backend/src/mascot-collectibles.js';
test('all 32 sanctuary species have exactly one affinity and three named forms',()=>{
 const ids=Object.keys(PET_MARKET);
 assert.equal(ids.length,32);
 assert.deepEqual(Object.keys(SPECIES_AFFINITY).sort(),ids.sort());
 for(const id of ids){
  assert.ok(PET_AFFINITIES[affinityFor(id).id]);
  assert.equal(GROWTH_FORM_NAMES[id].length,2);
  const chain=stagesFor(id,id);
  assert.equal(chain.length,3);assert.equal(new Set(chain.map(f=>f.name)).size,3);
  assert.ok(chain[0].level<chain[1].level&&chain[1].level<chain[2].level);
 }
 assert.equal(affinityFor('gravebyte').id,'neon');
 assert.notEqual(affinityFor('crush').id,'neon');
});
test('form unlock requires BOTH earned level and bond, including legacy Starborn levels',()=>{
 const signature={name:'Lydibloom',level:9,bond:500};
 assert.equal(growthFor('lydibug','Lydibug',9,499,signature).stage,2);
 assert.equal(growthFor('lydibug','Lydibug',8,900,signature).stage,2);
 assert.equal(growthFor('lydibug','Lydibug',9,500,signature).stage,3);
 assert.equal(growthFor('crush','Crush',4,99).stage,1);
 assert.equal(growthFor('crush','Crush',4,100).stage,2);
 assert.equal(growthFor('crush','Crush',9,500).stage,3);
 assert.equal(growthFor('crush','Crush',2,0).next.progress,0);
 assert.equal(growthFor('crush','Crush',9,500).next,null);
});
