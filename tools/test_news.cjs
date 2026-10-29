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
const testBody = function () {
  const checks=[];function check(ok,name){if(!ok)throw Error(name);checks.push(name);}
  nextWeek();
  check(state.newsState.articles.some(a=>a.key==='eraIntro'),'2012 소개 등록');
  const art=state.newsState.articles.find(a=>a.key==='eraIntro');
  check(art.year===2012&&art.week===2,'보고서 날짜와 기사 발생 날짜 분리');
  const n=state.newsState.articles.length;
  publishHeadline({key:'eraIntro',headline:'다른 무작위 제목',body:'재시도'});
  check(state.newsState.articles.length===n,'같은 사건 다른 제목 중복 방지');
  addNews('검증','중복 단신');addNews('검증','중복 단신');
  check(state.inbox.filter(m=>m.text==='중복 단신').length===1,'단신 중복 방지');
  const ev={id:'news_test',tab:'news',title:'효과 검증',text:'효과',effects:{condition:-5}};
  const before=state.condition;fireEvent(ev,{});
  check(state.condition===before-5,'소식 생성 효과 보존');
  const after=state.condition;newsArchiveHTML();newsOverlayHTML(state.weekReport.headlines);
  check(state.condition===after,'재열기 효과 없음');
  const t=myTeam(),other=state.league.teams.find(t2=>t2.id!==t.id);
  state.league.titleStreaks={cup:{id:t.id,n:2,year:2011}};
  const f={winner:t.id,loser:other.id,score:[3,1],pogName:state.player.name};
  queueFinalNews('cup','LCK 컵',f,titleStreak('cup',f));
  const final=state.newsState.articles.find(a=>a.key==='cup_final');
  check(!final.body.includes('First Stand'),'2025 이전 출전권 문구 없음');
  const count=state.newsState.articles.length,moments=state.career.moments.length;
  queueFinalNews('cup','LCK 컵',f,titleStreak('cup',f));
  check(state.newsState.articles.length===count&&state.league.titleStreaks.cup.n===3&&state.career.moments.length===moments,'결승 재처리 기록 중복 없음');
  const loaded=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));state=loaded;migrateCurrentNews();
  check(state.newsState.articles.length===count,'뉴스 저장 왕복');
  nextWeek();
  check(newsArchiveHTML().includes(art.headline),'다음 주 원문 보관');
  const legacy=JSON.parse(JSON.stringify(makeSaveData()));delete legacy.state.newsState;
  legacy.state.weekReport.headlines=[{key:'old',headline:'과거 기사',body:'원문',mine:false}];
  legacy.state.weekReport.when='2012년 2주차';
  state=stateFromSave(legacy);migrateCurrentNews();migrateCurrentNews();
  check(state.newsState.articles.length===1&&newsDate(state.newsState.articles[0])==='2012년 2주차','구버전 저장 호환·중복 이관 없음');
  const pending={tab:'inbox',choices:[{}],answered:null};
  const many=Array.from({length:130},()=>({tab:'news'})).concat([pending]);
  check(trimMessages(many).includes(pending),'미응답 연락 보존');
  state.year=2025;state.week=9;state.weekReport.headlines=[];
  const f2={winner:myTeam().id,loser:other.id,score:[3,0],pogName:state.player.name};
  queueFinalNews('cup','LCK 컵',f2,titleStreak('cup',f2));
  check(state.weekReport.headlines[0].body.includes('First Stand'),'2025 이후 출전권 문구 유지');
  snsTab='news';state.currentMenu='sns';renderAll();
  check(pages.sns().includes('신문 기사 보관함'),'SNS 기사 보관함 표시');
  return checks;
};
const result=vm.runInContext('('+testBody.toString()+')()',c);
console.log(JSON.stringify({checks:result},null,2));
for(const year of [2012,2017,2022]){
 const ctx=create();
 vm.runInContext(`draft=newDraft();draft.name='시즌검증';draft.startYear=${year};draft.teams=makeTeamDefs(${year});startCareer(true);state.settings.autoSave=false;`,ctx);
 const r=vm.runInContext(`(function(){
   for(let i=0;i<53;i++){
     state.inbox.filter(m=>m.tab==='inbox'&&m.choices&&m.answered===null&&m.kind!=='offer'&&m.kind!=='retire').forEach(m=>answerMessage(m.id,0));
     nextWeek();
     if(state.retired)throw Error('Unexpected retirement');
     const arts=ensureNewsState().articles;
     if(new Set(arts.map(a=>a.id)).size!==arts.length)throw Error('Duplicate article');
     if(arts.some(a=>/\\{(?:firstStandNote|winner|mvp)\\}/.test(a.body)))throw Error('Unfilled article');
   }
   const save=JSON.parse(JSON.stringify(makeSaveData()));state=stateFromSave(save);renderAll();
   for(const event of HISTORICAL_NEWS.filter(e=>e.year===${year}||e.year===state.year&&e.week===1)){
     const matches=state.newsState.articles.filter(a=>a.body.includes(event.title));
     if(matches.length!==1)throw Error('Historical article missing/duplicated: '+event.id);
     if(event.year===state.year&&matches[0].key!=='newyear')throw Error('New year article not merged');
   }
   return {year:state.year,week:state.week,articles:state.newsState.articles.length,bytes:JSON.stringify(save).length};
 })()`,ctx,{timeout:120000});
 console.log('Season',year,r);
 assert.equal(r.year,year+1);assert.equal(r.week,2);
}


