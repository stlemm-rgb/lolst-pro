const fs=require('fs'),vm=require('vm'),assert=require('assert');
const prefix=fs.readFileSync(__dirname+'/test_news.cjs','utf8').split('const c=create();')[0];
const create=Function('require','__dirname',prefix+';return create;')(require,__dirname);
const c=create();
console.log(vm.runInContext(String.raw`(function(){
 const checks=[];function check(v,m){if(!v)throw Error(m);checks.push(m);}
 nextWeek();hideNewsPopup();state=stateFromSave(JSON.parse(JSON.stringify(makeSaveData())));renderAll();
 check(state.weekReport.headlinesSeen,'신문 읽음 저장 유지');
 const before=JSON.stringify([state.money,state.stats,state.fame]);(newsEdition=null,newsPaperHTML(state.inbox.filter(m=>m.tab==='news')));newsOverlayHTML(state.weekReport.headlines);
 check(before===JSON.stringify([state.money,state.stats,state.fame]),'다시 읽기 무보상');
 const pending=postMessage('inbox','검증 연락','답변 대기',{choices:[{label:'확인'}]});
 for(let i=0;i<200;i++)publishNotice('포화 검사',String(i));
 check(state.inbox.some(m=>m.id===pending.id),'소식 포화 후 미응답 연락 보존');
 state.weekReport=null;
 for(let i=0;i<200;i++)publishHeadline({key:'overflow',headline:'기사'+i,body:'본문'},{id:'overflow:'+i});
 check(state.newsState.articles.length===160&&state.newsState.articles[0].id==='overflow:40','기사 보관 상한·오래된 순 제거');
 publishHeadline({key:'escape',headline:'<img src=x onerror=evil()>',body:'<script>evil()</script>\n둘째 줄'});
 check(!(newsEdition=null,newsPaperHTML(state.inbox.filter(m=>m.tab==='news'))).includes('<script>evil()')&&(newsEdition=null,newsPaperHTML(state.inbox.filter(m=>m.tab==='news'))).includes('&lt;script&gt;'),'기사 문자열 HTML 이스케이프');
 state.year=2024;state.week=1;
 const old=statsOfId;let value;
 statsOfId=()=>value;
 const list=POSITION_IDS.map(pos=>({id:'synthetic',pos,power:60}));
 function shape(m,f){value={laning:60,reaction:60,accuracy:60,macro:m,vision:m,shotcall:m,teamfight:f,spacing:f,focus:f};}
 shape(60,60);check(phaseTeamScore(list,'macro')===0&&phaseTeamScore(list,'fight')===0,'균형형 스타일 보정0');
 shape(80,40);const plus=phaseTeamScore(list,'macro'),minus=phaseTeamScore(list,'fight');
 shape(40,80);check(Math.abs(phaseTeamScore(list,'macro')+plus)<1e-9&&Math.abs(phaseTeamScore(list,'fight')+minus)<1e-9,'강점·약점 대칭');
 check(phaseTeamScore(list.map(p=>({...p,id:null})),'macro')===0,'옛 해외 가상 라인업 보정0');
 statsOfId=old;
 return checks;
})()`,c));
