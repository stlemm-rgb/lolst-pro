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

const context=create();
function run(fn){return vm.runInContext('('+fn.toString()+')()',context,{timeout:120000});}
const result=run(function(){
 const checks=[];function check(ok,label){if(!ok)throw Error(label);checks.push(label);}
 function step(){state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0));nextWeek();}
 while(state.week<40)step();
 check(!state.newsState.articles.some(a=>a.key==='worlds_preview'),'40주에는 특집 없음');
 step();
 const f=state.league.season.worldsFeature;
 const article=state.newsState.articles.find(a=>a.key==='worlds_preview');
 check(state.week===41&&article&&article.week===41,'41주 진입 때 특집 등록');
 check(f.host.country==='미국'&&f.host.city==='로스앤젤레스','2012 개최지 고정');
 check(!state.league.season.worlds,'41주 기사 생성이 조 편성을 앞당기지 않음');
 check(!article.body.includes('전년도 챔피언'),'2012 전년도 우승팀 생성 안 함');
 const mvp=state.league.awards.find(a=>a.year===2012&&a.key==='mvp');
 check(mvp&&article.body.includes(mvp.name),'국내 실제 MVP');
 check(activeRegions().every(r=>article.body.includes(r.name+':')),'활성 지역 MVP 모두 소개');
 check(article.body.includes('올해 주요 경기 재구성'),'실제 시즌 경기 영상 소개');
 const count=state.newsState.articles.length;
 const host=JSON.stringify(f.host),body=f.body;
 worldsNewsForWeek();renderAll();
 check(state.newsState.articles.length===count,'화면 재방문 중복 없음');
 state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));renderAll();
 check(JSON.stringify(state.league.season.worldsFeature.host)===host&&state.league.season.worldsFeature.body===body,'저장 왕복 개최지·음악·본문 유지');
 step();
 check(state.week===42&&state.league.season.worlds.groups.flat().length===16,'기존 시점 16팀 편성');
 const notices=state.inbox.filter(m=>m.title&&m.title.indexOf('[월즈 개막]')===0);
 check(notices.length===1&&notices[0].week===42,'42주 개막 단신 한 번');
 const matchCount=state.league.season.matches.length;
 worldsNewsForWeek();renderAll();
 check(state.league.season.matches.length===matchCount,'뉴스 재방문 경기 추가 없음');
 while(state.year===2012)step();
 const h=state.league.history.find(h=>h.year===2012);
 check(h.worldsRecap.scenes.length>0&&h.champions.worlds,'전년도 월즈 요약 보관');
 while(state.week<41)step();
 const f2=state.league.season.worldsFeature;
 check(f2.song!==h.worldsRecap.song,'전년도 주제곡 연속 재사용 방지');
 check(worldsHostCandidates().some(h=>h.city===f2.host.city&&h.country===f2.host.country),'활성 리그 수도 후보에서 개최지 선정');
 check(f2.body.includes(h.champions.worlds)&&f2.body.includes(h.worldsRecap.scenes[0]),'2013 우승팀 리스펙·전년도 실제 장면');
 check(!f2.body.includes('undefined')&&!f2.body.includes('null')&&!/\{\w+\}/.test(f2.body),'기사 빈칸 없음');
 const before=JSON.stringify({money:state.money,popularity:state.popularity,fans:state.fame.fans,stats:state.stats});
 worldsNewsForWeek();(newsEdition=null,newsPaperHTML(state.inbox.filter(m=>m.tab==='news')));
 check(before===JSON.stringify({money:state.money,popularity:state.popularity,fans:state.fame.fans,stats:state.stats}),'뉴스 열람 경제·능력치 영향 없음');
 return {checks,example:f2.body};
});
console.log(JSON.stringify(result,null,2));
for(const year of [2017,2022]){
 const ctx=create();
 const result=vm.runInContext(`(function(){
  draft=newDraft();draft.name='이전저장';draft.startYear=${year};draft.teams=makeTeamDefs(${year});startCareer(true);state.settings.autoSave=false;
  state.week=41;delete state.league.season.worldsFeature;renderAll();
  const f=state.league.season.worldsFeature;
  if(!f.body.includes('기록이 남아 있지 않아'))throw Error('Missing prior history fallback');
  if(!f.body.includes('수상 기록 없음'))throw Error('Missing MVP fallback');
  if(!worldsHostCandidates().some(h=>h.city===f.host.city))throw Error('Invalid host');
  const n=state.newsState.articles.length;renderAll();if(state.newsState.articles.length!==n)throw Error('Duplicate migrated preview');
  return {year:state.year,legacyPreview:true,noInventedHistory:true};
 })()`,ctx);
 console.log(result);
}
