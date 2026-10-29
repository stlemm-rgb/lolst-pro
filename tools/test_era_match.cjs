// Node 내장 VM 기반 회귀 검사. DOM은 대체 객체이므로 실제 화면 배치를 검증하지 않는다.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..')+'/';
const scripts=[...fs.readFileSync(root+'Challenger_Road.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]).filter(x=>x!=='js/start.js');
function create(){
 const element={innerHTML:'',hidden:false,value:'',style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){},remove(){},focus(){},scrollIntoView(){},setAttribute(){},getAttribute(){return '';},querySelectorAll(){return [];},querySelector(){return element;}};
 const ctx=vm.createContext({console,Math,Date,setTimeout(){},clearTimeout(){},document:{getElementById(){return element;},querySelectorAll(){return [];},querySelector(){return element;},createElement(){return {...element};},addEventListener(){},removeEventListener(){},body:{appendChild(){}}},window:{scrollTo(){},addEventListener(){},scrollY:0},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},URL,Blob});
 for(const s of scripts)vm.runInContext(fs.readFileSync(root+s,'utf8'),ctx,{filename:s});
 vm.runInContext('linkifyNames=function(){}; state=createNewState(); draft=newDraft(); draft.name="뉴스검증"; draft.startYear=2012; startCareer(true); state.settings.autoSave=false;',ctx);
 return ctx;
}
const c=create();
console.log(vm.runInContext(`(function(){
 const check=(v,m)=>{if(!v)throw Error(m);};
 check(eraMatchRule(2016,28).macro===1&&eraMatchRule(2016,29).macro===1.1,'2016 경계');
 check(eraMatchRule(2022,28).fight===1&&eraMatchRule(2022,29).fight===1.1,'2022 경계');
 check(eraMatchRule(2023,52).macro===1.1&&eraMatchRule(2024,1).macro===1.15,'2024 교체');
 check(eraMatchRule(2099,1).macro===1.15&&eraPhaseMultiplier('lane')===1,'미래 고정·라인전 불변');
 const teams=state.league.teams.filter(t=>t.id!==myTeam().id);
 const saved=JSON.stringify(makeSaveData());
 state.year=2024;state.week=1;
 const rule=eraMatchRule();
 const actual=eraPhaseMultiplier;
 const rows=[];
 const nativeMath=Math;Math=Object.create(nativeMath);
 function seed(n){Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 for(const date of [[2016,29],[2022,29],[2024,1]]){
   let baseline=0,changed=0,flips=0,maxDelta=0;
   for(let i=1;i<=500;i++){
     const ids=[teams[i%teams.length].id,teams[(i+1)%teams.length].id];
     const results=[];
     for(const on of [false,true]){
       state=stateFromSave(JSON.parse(saved));state.year=date[0];state.week=date[1];
       eraPhaseMultiplier=on?actual:()=>1;seed(i);
       results.push(playSet(ids[0],ids[1],null,{}));
     }
     const a=results[0],b=results[1];baseline+=a.winner===ids[0];changed+=b.winner===ids[0];flips+=a.winner!==b.winner;
     check(a.teamA.avg===b.teamA.avg&&a.teamA.lane===b.teamA.lane&&a.teamA.ev===b.teamA.ev,'영향 범위·동일 난수');
     const r=eraMatchRule();
     check(Math.abs(b.teamA.macro-a.teamA.macro*r.macro)<1e-9&&Math.abs(b.teamB.fight-a.teamB.fight*r.fight)<1e-9,'양 팀 보정');
     maxDelta=Math.max(maxDelta,Math.abs(b.teamA.play-a.teamA.play),Math.abs(b.teamB.play-a.teamB.play));
   }
   rows.push({date,sets:500,baseline,changed,flips,maxDelta});
 }
 eraPhaseMultiplier=actual;Math=nativeMath;
 state.year=2024;state.week=1;const before=JSON.stringify([state.stats,state.fame,state.money]);
 historicalNewsForWeek();historicalNewsForWeek();
 check(before===JSON.stringify([state.stats,state.fame,state.money]),'뉴스 보상 없음');
 const mult=eraPhaseMultiplier('macro');state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));
 check(eraPhaseMultiplier('macro')===mult,'저장 왕복');
 check(pages.howto().includes(eraMatchRule().label),'현재 환경 안내');
 return {checks:'연도 경계·양 팀 보정·범위·저장·뉴스·화면 문구 통과',measurement:rows};
})()`,c,{timeout:120000}));
