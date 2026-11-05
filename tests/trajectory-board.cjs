/* Regression: Planner and Status share the same activity records. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web/status-board.js'),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const state={programs:[{id:'P1',name:'Testopleiding'}],buckets:[{id:0,name:'Zelfscan'}],cells:{P1:{0:{status:1,owner:'Olaf',title:'Bestaande activiteit',done:''}}}};
let saves=0,renders=0,allowed=true;
const context={state,document:{documentElement:{classList:{contains:()=>allowed}}},cell:(p,b)=>state.cells[p.id][b],save:()=>saves++,render:()=>renders++,today:()=>'2026-11-05',isOver:()=>false,toast:()=>{},bucketEntries:()=>[['Zelfscan',0]],$:()=>({value:'',checked:false})};
vm.createContext(context);
vm.runInContext(extract('function boardLane(','function boardCard(')+extract('function setBoardStatus(','function showPlannerTab('),context);
vm.runInContext("setBoardStatus('P1',0,3)",context);
assert.equal(state.cells.P1[0].status,3);assert.equal(state.cells.P1[0].done,'2026-11-05');assert.equal(state.cells.P1[0].owner,'Olaf');assert.equal(saves,1);assert.equal(renders,1);
state.cells.P1[0].status=2;
assert.equal(vm.runInContext('boardItems(state.programs)[0].c.status',context),2);
assert.strictEqual(vm.runInContext('boardItems(state.programs)[0].c',context),state.cells.P1[0]);
allowed=false;vm.runInContext("setBoardStatus('P1',0,1)",context);assert.equal(state.cells.P1[0].status,2);assert.equal(saves,1);
console.log('PASS: Status writes Planner records; Planner edits appear in Status; no duplicate records; authentication guard retained.');
