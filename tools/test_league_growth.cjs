// Node 내장 VM 기반 회귀 검사. DOM은 대체 객체이므로 실제 화면 배치를 검증하지 않는다.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..')+'/';
const scripts=[...fs.readFileSync(root+'index.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]).filter(x=>x!=='js/start.js');
function create(){
 const element={innerHTML:'',hidden:false,value:'',style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){},remove(){},focus(){},scrollIntoView(){},setAttribute(){},getAttribute(){return '';},querySelectorAll(){return [];},querySelector(){return element;}};
 const ctx=vm.createContext({console,Math,Date,setTimeout(){},clearTimeout(){},document:{getElementById(){return element;},querySelectorAll(){return [];},querySelector(){return element;},createElement(){return {...element};},addEventListener(){},removeEventListener(){},body:{appendChild(){}}},window:{scrollTo(){},addEventListener(){},scrollY:0},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},URL,Blob});
 for(const s of scripts)vm.runInContext(fs.readFileSync(root+s,'utf8'),ctx,{filename:s});
 vm.runInContext('linkifyNames=function(){}; state=createNewState(); draft=newDraft(); draft.name="뉴스검증"; draft.startYear=2012; startCareer(true); state.settings.autoSave=false;',ctx);
 return ctx;
}

const ctx=create();
const result=vm.runInContext(`(function(){
 const checks=[],measured=[];function check(ok,text){if(!ok)throw Error(text);checks.push(text);}
 check([2012,2013,2014,2015,2016,2017,2022,2030].map(leagueFanMultiplier).join(',')==='1,1,1.1,1.1,1.2,1.2,1.2,1.2','규모 단계 배율·미래 연도 안정');
 for(const year of [2012,2014,2016]){
   state.year=year;state.popularity=100;state.fame.fans=3100000;
   const old=state.fame.fans;addPopularity(1);const gain=state.fame.fans-old;
   check(Math.abs(gain-61000*leagueFanMultiplier())<0.001,year+' 인기도 팬 배율 한 번');
   check(state.popularity===100,year+' 인기도 상한 유지');
   state.fame.fans=3100000;const titleGain=titleFans('worlds');
   check(Math.abs(titleGain-1830000*leagueFanMultiplier())<1,year+' 우승 팬 배율 한 번');
   measured.push({year,multiplier:leagueFanMultiplier(),popularityPointFans:Math.round(gain),worldTitleFans:titleGain});
 }
 state.year=2016;state.popularity=100;state.fame.fans=10000000;
 addPopularity(-1);
 check(Math.abs(10000000-state.fame.fans-60400*FAME.lossShare)<0.01,'팬 감소량 확대 안 함');
 state.popularity=100;state.fame.fans=200000000;
 addPopularity(1);check(Math.abs(state.fame.fans-200120000)<1,'1억 이후 완화 유지');
 state.year=2014;
 const before=JSON.stringify({fans:state.fame.fans,money:state.money,teams:state.league.teams});
 const lines=leagueGrowthNews();leagueGrowthNews();
 check(lines.length===2&&lines[0].includes('1.1배')&&lines[1].includes('중동'),'인기·투자 기사 구성');
 check(before===JSON.stringify({fans:state.fame.fans,money:state.money,teams:state.league.teams}),'기사 생성에 입금·팬 지급 없음');
 state.year=2015;check(leagueGrowthNews().length===0,'확장 없는 해 기사 없음');
 state.year=2022;state.fame.fans=12345678;
 state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));renderAll();
 check(state.fame.fans===12345678&&leagueFanMultiplier()===1.2,'이전 저장 팬 수 유지·현재 배율 계산');
 return {checks,measured};
})()`,ctx);
console.log(JSON.stringify(result,null,2));
for(const year of [2013,2015]){
 const c=create();
 const result=vm.runInContext(`(function(){
  draft=newDraft();draft.name='리그확장';draft.startYear=2012;startCareer(true);state.settings.autoSave=false;
  while(state.year<${year+1}){
   state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0));nextWeek();
  }
  const news=state.newsState.articles.filter(a=>a.key==='newyear'&&a.year===${year+1});
  if(news.length!==1||!news[0].body.includes('신규 팬 유입 배율')||!news[0].body.includes('방송사'))throw Error('Expansion article missing');
  const count=state.newsState.articles.length;renderAll();renderAll();if(count!==state.newsState.articles.length)throw Error('Duplicate article');
  return {year:state.year,week:state.week,tier1:tierTeams(1).length,tier2:tierTeams(2).length,multiplier:leagueFanMultiplier(),articles:news.length};
 })()`,c,{timeout:120000});console.log(result);
}
