import test from "node:test";
import assert from "node:assert/strict";
import {selectStudies} from "../public/force-study-retrieval.mjs";
const data={paths:[{id:"a",title:"History",classification:"legends",readings:[{title:"Revan",body:"Revan studies identity",status:"draft",source:"KOTOR"}]},{id:"b",title:"Philosophy",classification:"philosophy",readings:[{title:"Identity",body:"Identity and agency"}]}]};
test("specialty breaks relevance ties",()=>assert.equal(selectStudies(data,{specialties:["a"]},"identity")[0].title,"Revan"));
test("generic questions do not retrieve unrelated material",()=>assert.deepEqual(selectStudies(data,null,"what is the"),[]));
test("source and status survive retrieval",()=>{const [r]=selectStudies(data,null,"Revan");assert.equal(r.source,"KOTOR");assert.equal(r.status,"draft");assert.equal(r.classification,"legends")});
test("limit is enforced",()=>assert.equal(selectStudies(data,null,"identity",1).length,1));
test("empty corpus",()=>assert.deepEqual(selectStudies({},null,"Revan"),[]));
