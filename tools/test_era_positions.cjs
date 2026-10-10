// 고정 로스터 씨앗 + 같은 경기 난수로 5개 포지션의 2024 시대 효과 전후 비교.
const fs=require('fs'),vm=require('vm');
const prefix=fs.readFileSync(__dirname+'/test_news.cjs','utf8').split('const c=create();')[0]
 .replace('function create(){','function create(){let seed=7166;const Math=Object.create(globalThis.Math);Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};');
const create=Function('require','__dirname',prefix+';return create;')(require,__dirname);
for(const pos of ['top','jungle','mid','adc','support']){
 const c=create();
 console.log(vm.runInContext(`(function(){
 draft=newDraft();draft.name='비교선수';draft.position=${JSON.stringify(pos)};draft.startYear=2022;draft.teams=makeTeamDefs(2022);startCareer(true);state.settings.autoSave=false;
 state.year=2024;state.week=29;
 const a=myTeam().id,others=state.league.teams.filter(t=>t.id!==a&&t.tier===myTeam().tier).map(t=>t.id),snapshot=JSON.stringify(makeSaveData());
 const original=eraPhaseMultiplier;let baseline=0,changed=0,flips=0,maxDelta=0;
 for(let i=1;i<=200;i++){
   const b=others[i%others.length],m={a,b,comp:'split2',label:'비교',score:[0,0],bo:3};const results=[];
   for(const on of [false,true]){
     state=stateFromSave(JSON.parse(snapshot));let seed=i;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
     eraPhaseMultiplier=on?original:()=>1;
     const ctx=userMatchContext(m,null,[]),set=playSet(a,b,ctx,{match:m});
     if(!set.la.concat(set.lb).some(p=>p.id===USER_ID))throw Error('내 선수 미참가');
     results.push(set);
   }
   baseline+=results[0].winner===a;changed+=results[1].winner===a;flips+=results[0].winner!==results[1].winner;
   maxDelta=Math.max(maxDelta,Math.abs(results[1].teamA.play-results[0].teamA.play));
 }
 eraPhaseMultiplier=original;
 return {position:${JSON.stringify(pos)},sets:200,baseline,changed,flips,maxDelta};
 })()`,c,{timeout:120000}));
}
