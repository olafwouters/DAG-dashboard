const assert=require('node:assert/strict');
require('../web/start-trajectory.js');
const M=globalThis.DAGTrajectoryStarter,blank=()=>({status:0,owner:'',start:'',due:'',done:'',participants:'',title:'',notes:'',link:'',updated:''});
const s={programs:[{id:'P1'}],buckets:[{id:0},{id:1}],cells:{P1:{0:{...blank(),status:2,owner:'Vincent',title:'Bestaand',productSteps:[1,2,3,4]}}}},before=JSON.stringify(s);
const v={programmeId:'P1',request:'Curriculumvraag',owner:'Olaf',action:'Bespreek uitkomsten',actionDue:'2026-11-12',bucketIds:[0,1,1]};
const plan=M.prepare(s,v,blank,'2026-11-05T13:00:00Z');assert.equal(JSON.stringify(s),before);assert.deepEqual(plan.created,[1]);assert.strictEqual(plan.cells[0],s.cells.P1[0]);assert.equal(plan.cells[1].status,1);assert.equal(plan.cells[1].owner,'Olaf');assert.equal(plan.metadata.actionOwner,'Olaf');assert.equal(plan.metadata.phase,'0');
assert.throws(()=>M.prepare(s,{...v,bucketIds:[]},blank));assert.throws(()=>M.prepare(s,{...v,bucketIds:[99]},blank));assert.throws(()=>M.prepare(s,{...v,programmeId:'missing'},blank));assert.throws(()=>M.prepare(s,{...v,actionDue:'2026-02-30'},blank));assert.throws(()=>M.prepare(s,{...v,activityStart:'2026-11-20',activityDue:'2026-11-10'},blank));assert.equal(JSON.stringify(s),before);
s.programmeTrajectories={P1:plan.metadata};assert.throws(()=>M.prepare(s,v,blank));assert(M.validDate('2028-02-29'));assert(!M.validDate('2026-02-29'));
console.log('PASS: pure preparation; shared Planner records; deduplicated activities; existing fields and steps preserved; required fields and dates; duplicate trajectory rejected.');
