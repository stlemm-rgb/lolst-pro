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
const c=create();
const suite=function(){
 const checks=[];function check(ok,name){if(!ok)throw Error(name);checks.push(name);}
 check(HISTORICAL_NEWS.length===26&&new Set(HISTORICAL_NEWS.map(e=>e.id)).size===26,'26개 고유 기사');
 check(Array.from({length:15},(_,i)=>2012+i).every(y=>HISTORICAL_NEWS.some(e=>e.year===y&&e.week===1)),'2012~2026 모든 연초 포함');
 check(HISTORICAL_NEWS.every(e=>[1,29,49].includes(e.week)&&e.source.startsWith('https://')),'편성 주차·출처 누락 없음');
 check(state.newsState.articles.filter(a=>a.key==='historical').length===1&&!state.weekReport,'새 게임 첫 소식·가짜 주간 보고서 없음');
 const original=JSON.stringify(makeSaveData());
 for(const e of HISTORICAL_NEWS){
   state=stateFromSave(JSON.parse(original));state.year=e.year;state.week=e.week;
   state.league.season.historicalNewsSent=[];state.newsState={articles:[],notices:[]};
   state.weekReport={when:'이전 주',headlines:[]};
   const before=JSON.stringify([state.stats,state.money,state.fame,state.popularity,state.meta,state.mastery,state.contract,state.league.season.worlds]);
   historicalNewsForWeek();historicalNewsForWeek();
   const arts=state.newsState.articles;
   check(arts.length===1&&arts[0].body.includes(e.title)&&arts[0].year===e.year&&arts[0].week===e.week,e.id+' 날짜·반복 방지');
   if(before!==JSON.stringify([state.stats,state.money,state.fame,state.popularity,state.meta,state.mastery,state.contract,state.league.season.worlds]))throw Error('게임 효과 변경');
   state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));historicalNewsForWeek();
   if(state.newsState.articles.length!==1)throw Error('로드 중복');
   state.newsState.articles=[];historicalNewsForWeek();
   if(state.newsState.articles.length)throw Error('기사 보관 한도 후 중복');
 }
 check(true,'모든 기사 게임 효과 없음·저장 왕복·보관함 제거 후 중복 없음');
 state=stateFromSave(JSON.parse(original));state.year=2022;state.week=30;
 delete state.league.season.historicalNewsSent;state.newsState={articles:[],notices:[]};
 historicalNewsForWeek();check(!state.newsState.articles.length,'옛 저장 중간 주차 과거 뉴스 소급 없음');
 state.year=2027;state.week=1;historicalNewsForWeek();check(!state.newsState.articles.length,'2027 이후 허구 역사 없음');
 state.year=2024;state.week=1;state.weekReport={headlines:[]};
 newYearArticle(['기존 시즌 소식'].concat(historicalNewsLines()));historicalNewsForWeek();
 check(state.newsState.articles.length===1&&state.newsState.articles[0].key==='newyear'&&state.newsState.articles[0].body.includes('공허 유충'),'신년 기사 하나로 병합');
 check(!HISTORICAL_NEWS.find(e=>e.id==='2022-start').body.includes('내구도')&&!HISTORICAL_NEWS.find(e=>e.id==='2020-start').body.includes('취소'),'연초에 중간 소식 조기 공개 없음');
 return checks;
};
console.log(JSON.stringify(vm.runInContext('('+suite.toString()+')()',c),null,2));
for(const year of [2017,2022]){
 const ctx=create();
 vm.runInContext(`draft=newDraft();draft.name='시대검증';draft.startYear=${year};draft.teams=makeTeamDefs(${year});startCareer(true);state.settings.autoSave=false;`,ctx);
 assert(vm.runInContext(`state.newsState.articles.filter(a=>a.key==='historical').length===1&&state.newsState.articles.find(a=>a.key==='historical').year===${year}`,ctx));
}
console.log('2017/2022 새 시작 해당 연도 기사만 발행: 통과');
