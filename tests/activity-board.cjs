'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {test}=require('node:test');
function setup(){
 const context={};vm.createContext(context);
 for(const name of ['status-columns.js','status-containers.js','activity-board.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../web',name),'utf8'),context);
 const s={programs:[{id:'P',name:'Opleiding A'}],buckets:[{id:0,name:'Gesprek'},{id:1,name:'Advies'}],cells:{P:{0:{status:1,notes:'Bewaren'},1:{status:1}}},programmeTrajectories:{P:{phase:'1',closure:''}}};
 let saved=0,rendered=0,warnings=0;const h={allowed:()=>true,editing:()=>false,date:()=> '2026-11-25',timestamp:()=> '2026-11-25T09:00:00Z',save:()=>saved++,render:()=>rendered++,warn:()=>warnings++};
 const entry=b=>({id:'P',b,before:JSON.stringify(s.cells.P[b])});
 return {context,s,h,entry,api:context.DAGActivityBoard,counts:()=>({saved,rendered,warnings})};
}
const lane=(v,id)=>v.find(l=>l.column.id===id);
test('moving activities creates/merges destination and removes only empty source containers',()=>{
 const {s,h,entry,api,counts}=setup(),trajectory=JSON.stringify(s.programmeTrajectories),other=s.cells.P[1];
 assert(api.move(s,entry(0),'delivery',h));let v=api.view(s,['P']);
 assert.equal(lane(v,'agreement').containers[0].items.length,1);assert.equal(lane(v,'delivery').containers[0].items.length,1);
 assert.strictEqual(s.cells.P[1],other);assert(api.move(s,entry(1),'delivery',h));v=api.view(s,['P']);
 assert.equal(lane(v,'agreement').containers.length,0);assert.equal(lane(v,'delivery').containers.length,1);assert.equal(lane(v,'delivery').containers[0].items.length,2);
 assert.equal(JSON.stringify(s.programmeTrajectories),trajectory);assert.equal(s.cells.P[0].notes,'Bewaren');assert.deepEqual(Object.keys(s.cells.P),['0','1']);assert.equal(counts().saved,2);
});
test('rights and open editor block writes',()=>{for(const guard of ['allowed','editing']){const t=setup();t.h[guard]=()=>guard==='editing';assert.equal(t.api.move(t.s,t.entry(0),'delivery',t.h),false);assert.equal(t.counts().saved,0);}});
test('changed or deleted records cannot be overwritten/recreated',()=>{for(const deleted of [false,true]){const t=setup(),e=t.entry(0);if(deleted)delete t.s.cells.P[0];else t.s.cells.P[0].notes='Nieuw';assert.equal(t.api.move(t.s,e,'delivery',t.h),false);assert.equal(t.counts().saved,0);assert.equal(t.counts().warnings,1);}});
test('invalid targets and same-column moves do not save',()=>{const t=setup();for(const target of ['bad','agreement'])assert.equal(t.api.move(t.s,t.entry(0),target,t.h),false);assert.equal(t.counts().saved,0);});
test('follow-up defaults open, explicit close/reopen moves the same activity',()=>{const t=setup();t.s.cells.P[0].status=3;assert.equal(lane(t.api.view(t.s,['P']),'followup').containers.length,1);assert(t.api.move(t.s,t.entry(0),'closed',t.h));assert.equal(lane(t.api.view(t.s,['P']),'closed').containers.length,1);assert(t.api.move(t.s,t.entry(0),'delivery',t.h));assert.equal(t.s.cells.P[0].followUpDone,false);});
test('filters remove empty containers and N.v.t. is separately visible',()=>{const t=setup();t.s.cells.P[0].status=4;assert(!t.api.view(t.s,['P']).some(l=>l.column.id==='not-applicable'));assert.equal(lane(t.api.view(t.s,['P'],{na:true}),'not-applicable').containers.length,1);assert(t.api.view(t.s,['P'],{bucket:99}).every(l=>!l.containers.length));assert(t.api.view(t.s,['P'],{owner:'Onbekend'}).every(l=>!l.containers.length));});

test('board renders and drag/drop moves only the selected activity',()=>{
 const t=setup(),handlers={},parent={style:{},lastChild:{}};
 const host={innerHTML:'',addEventListener:(name,fn)=>handlers[name]=fn};
 const node=(value='',checked=false)=>({value,checked,closest:()=>parent});
 const nodes={statusBoard:host,boardEmpty:node(),boardNA:node(),boardBucket:node(),ownerFilter:node(),boardAttention:node(),boardCount:{},statusboard:{querySelector:()=>({})}};
 Object.assign(t.context,{state:t.s,today:()=> '2026-11-25',isOver:()=>false,visible:()=>t.s.programs,save:t.h.save,render:()=>t.api.render(t.s.programs),toast:()=>{},document:{getElementById:id=>nodes[id],querySelector:()=>null,documentElement:{classList:{contains:()=>true}}}});
 t.api.render(t.s.programs);assert(host.innerHTML.includes('data-activity-column="agreement"'));assert(!host.innerHTML.includes('data-trajectory-id'));assert(nodes.boardCount.textContent.includes('1 unieke'));
 const item={dataset:{activityKey:JSON.stringify(['P',0])}},transfer={setData:()=>{}};
 handlers.dragstart({target:{closest:s=>s==='[data-activity-key]'?item:null},dataTransfer:transfer,preventDefault:()=>{}});
 handlers.drop({target:{closest:()=>({dataset:{activityColumn:'delivery'}})},preventDefault:()=>{}});
 assert.equal(t.s.cells.P[0].status,2);assert.equal(t.s.cells.P[1].status,1);
 assert.equal(t.counts().saved,1);assert(host.innerHTML.includes('data-activity-column="delivery"'));
});
