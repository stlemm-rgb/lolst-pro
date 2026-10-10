// 현재 날짜로만 계산하므로 뉴스 열람·저장·연도 진행으로 중첩되지 않는다.
function eraMatchRule(year, week) {
  const y = year === undefined ? state.year : year;
  const w = week === undefined ? state.week : week;
  let rule = ERA_MATCH[0];
  ERA_MATCH.forEach(function (r) {
    if (y > r.year || y === r.year && w >= r.week) rule = r;
  });
  return rule;
}
function eraPhaseMultiplier(phase) {
  return eraMatchRule()[phase] || 1;
}
