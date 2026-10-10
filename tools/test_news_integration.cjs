// 7단계: 실제 주간 진행 + 반복 가능한 로스터/난수. 브라우저 UI 검사가 아니다.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const harness=fs.readFileSync(__dirname+'/test_news.cjs','utf8').split('const c=create();')[0]
 .replace('function create(){','function create(seed=166){ const Math=Object.create(globalThis.Math); Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};');
const create=Function('require','__dirname',harness+';return create;')(require,__dirname);
const scenarios=[['top',2012,260],['jungle',2017,104],['mid',2022,260],['adc',2022,104],['support',2012,104]];
for(const [pos,year,weeks] of scenarios){
 const c=create(166+year);
 const result=vm.runInContext(`(function(){
  draft=newDraft();draft.name='통합검증';draft.position=${JSON.stringify(pos)};draft.startYear=${year};draft.teams=makeTeamDefs(${year});startCareer(true);state.settings.autoSave=false;
  const seen=new Set(),history=new Set();let reloads=0;
  function audit(){
   const arts=ensureNewsState().articles;
   if(arts.length>NEWS_KEEP||new Set(arts.map(a=>a.id)).size!==arts.length)throw Error('기사 한도/중복');
   for(const a of arts){
    if(/undefined|NaN|\\{(?:winner|mvp|year|city|firstStandNote)\\}/.test(a.body))throw Error('미완성 기사 '+a.id);
    seen.add(a.id);
    for(const e of HISTORICAL_NEWS)if(a.body.includes(e.title))history.add(e.id);
   }
   for(const e of HISTORICAL_NEWS.filter(e=>e.year===state.year&&e.week===state.week))if(!history.has(e.id))throw Error('역사 기사 누락 '+e.id);
   if(state.week===41&&!seen.has('worlds_preview:'+state.year))throw Error('월즈 예고 누락');
   if(state.week===42&&!state.league.season.worldsFeature.openingSent)throw Error('월즈 개막 누락');
  }
  audit();
  for(let i=0;i<${weeks};i++){
   state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0));
   const before=state.year*52+state.week;nextWeek();
   if(state.year*52+state.week!==before+1)throw Error('진행 중단 '+state.year+'/'+state.week);
   audit();
   if([1,29,41,42,49].includes(state.week)){
    const ids=JSON.stringify(state.newsState.articles.map(a=>a.id)),money=state.money,fans=JSON.stringify(state.fame),rule=JSON.stringify(eraMatchRule());
    state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));renderAll();renderAll();reloads++;
    if(ids!==JSON.stringify(state.newsState.articles.map(a=>a.id))||money!==state.money||fans!==JSON.stringify(state.fame)||rule!==JSON.stringify(eraMatchRule()))throw Error('재로드 부작용');
   }
  }
  return {position:state.player.position,start:${year},weeks:${weeks},end:[state.year,state.week],reloads,uniqueArticles:seen.size,historical:history.size,archive:state.newsState.articles.length};
 })()`,c,{timeout:300000});
 assert.equal(result.position,pos);
 console.log(JSON.stringify(result));
}
