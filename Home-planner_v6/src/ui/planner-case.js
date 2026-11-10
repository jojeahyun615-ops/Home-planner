/*
 * 사례 보고서(가상 고객 B안)의 6단계 내용을 설계사 화면에 붙인다.
 *  1 상담: 관계 정립(표 3)   2 정보: 목표 우선순위·확인 질문(표 4·5)   3 진단: 보고서 지표(표 7)
 *  4 설계: 설계 근거 — 상환 대안(표 8)·생활비 조정(표 9)·상품 배치(표 13·14)·정책 적합성(표 16)
 *  5 실행: 실행 일정(표 18)   6 점검: 점검 주기·경보 기준(표 20)
 * 숫자는 가능한 한 고객정보와 계획에서 다시 계산한다(엔진은 건드리지 않는다).
 * 글로만 된 내용(범위·질문·일정)은 설계 예시 고객일 때만 보여 준다.
 */
(function (root) {
  'use strict';

  var P = root.Planner;
  var ui = P.ui;
  var fmt = P.format;
  var pages = (ui.plannerPages = ui.plannerPages || {});

  function num(x) { var n = Number(x); return Number.isFinite(n) ? n : 0; }
  function isCase(c) { return !!(c.state.customer && c.state.customer.isExample); }
  function n1(x) { return ui.n1(x); }
  function plain(rows, heads, cap) { return ui.table(heads, rows, { caption: cap }); }
  function notCase(what) {
    return '<section class="card"><p class="small muted">' + what + '은(는) 사례 보고서(설계 예시)에 맞춘 내용이에요. 새 고객은 상담에서 확인한 내용으로 설계사가 따로 정리합니다.</p></section>';
  }
  function src(t) { return '<p class="small muted">출처: 재무설계 사례 보고서 ' + t + ' · 가상 사례이며 실제 상담·동의·가입은 이루어지지 않았습니다.</p>'; }

  /* ---------- 1. 관계 정립(표 3) — 상담 범위 화면을 보고서 내용으로 ---------- */
  var baseScope = pages.scope;
  pages.scope = function (c) {
    if (!isCase(c)) return baseScope(c);
    return ui.pageHead('상담 범위(관계 정립)', '1단계 — 무엇을 다루고, 누가 무엇을 책임지는지') +
      '<section class="cols-2"><div class="card"><h2>' + ui.badge('이번 범위', 'ok') + '</h2><ul class="rows">' +
      '<li>36개월 현금흐름</li><li>신용대출 상환</li><li>비상금</li><li>신혼주거 자금</li><li>정책상품 적합성</li><li>보험·연금 점검(해지·신규 가입 판단은 자료 확인 뒤)</li></ul></div>' +
      '<div class="card"><h2>' + ui.badge('범위 밖', 'muted') + '</h2><ul class="rows">' +
      '<li>금융상품 판매·계약 대행</li><li>세무·법률 사항의 확정 판단(전문가 확인 권고)</li><li>은퇴 충분성 판단(국민연금·퇴직연금 자료 없음)</li></ul>' +
      '<p class="small muted">결혼·이직·주거조건이 바뀌면 범위를 다시 합의합니다.</p></div></section>' +
      '<section class="card"><h2>관계 정립 항목</h2>' + plain([
        ['비용', '가상 사례의 고객에게 상담료·판매수수료를 부과하지 않는 것으로 가정'],
        ['역할과 책임', '고객: 자료 제공, 선호와 제약 설명, 최종 선택 / 설계 담당자: 분석·설명·실행 지원·점검 / 실제 계약·거래: 금융기관 등 해당 주체'],
        ['정보 수집·관리', '수집 목적, 접근 범위, 보관 기간, 폐기 방법을 안내하고 동의를 받음. 별도 동의 없이 제3자에게 제공하지 않음'],
        ['이해상충', '특정 금융회사와의 제휴나 판매 보상이 생기면 사전에 설명하고, 고객이 이해한 뒤 진행 여부를 결정'],
        ['점검·종료', '월별·분기별 점검이 기본. 신혼주거 이전 후 재설계로 전환하거나 고객 요청 시 종료']
      ], ['항목', '내용'], '관계 정립 항목') + src('표 3') + '</section>' +
      '<section class="card"><h2>진행 방식</h2><p>설계사가 계획을 세워 제시하고, 고객이 선택한 계획만 실행 기준이 됩니다. 이후 고객이 매달 실행을 기록하고, 앱이 계획과 비교해 경보와 수정안을 만듭니다.</p>' +
      '<p class="small muted">모든 계산은 결정론적 월별 계산이며 확률(성공 확률 등)로 표현하지 않습니다. 충격 시나리오는 "이 충격이 오면"의 조건부 결과입니다.</p></section>';
  };

  /* ---------- 2. 목표 우선순위·확인 질문(표 4·5) ---------- */
  pages.goals = function (c) {
    var k = c.state.customer;
    var g = k.goal || {};
    var cur = c.d.current;
    var ev = function (t) { var e = (cur.events || []).filter(function (x) { return x.type === t; })[0]; return e ? e.month : '—'; };
    var need = num(g.depositTarget) + num(g.movingCost);
    var plan = c.d.plan || {};
    var rows = [
      ['1', '이자 높은 대출 상환', '잔액 0', cur.payoff && cur.payoff.high ? cur.payoff.high : '—', '결혼 직전까지 신규 신용대출 추가 없음'],
      ['2', '비상금 확보', fmt.short(num(g.emergencyTarget)), ev('emergencyReached'), plan.essential ? '필수생활비 ' + fmt.short(plan.essential) + ' × ' + fmt.num1(num(g.emergencyTarget) / plan.essential) + '개월' : ''],
      ['3', '신혼주거 본인 부담금', fmt.short(need), plan.targetMonth || '—', '보증금 ' + fmt.short(num(g.depositTarget)) + ' + 이사·중개 등 부대비용 ' + fmt.short(num(g.movingCost))]
    ];
    if (num(plan.pensionMonthly) > 0) rows.push(['4', '장기 준비 습관', '연금저축 월 ' + fmt.short(plan.pensionMonthly), '설계 기간', '납입 습관 유지. 은퇴 충분성은 별도 산정']);
    var head = ui.pageHead('목표·확인 질문', '2단계 — 목표의 금액·기한·우선순위와, 면담에서 확인할 것') +
      '<section class="card"><h2>재무목표와 우선순위</h2>' + plain(rows, ['순위', '목표', '금액(만원)', '기한(계획상 달성월)', '성공 기준·비고'], '재무목표') +
      '<p class="small muted">기한은 실행 기준 계획의 계산 결과입니다. 순서는 대출 → 비상금 → 주거이며 같은 돈을 두 목표에 겹쳐 세지 않습니다.</p></section>';
    if (!isCase(c)) return head + notCase('정보의 구분과 확인 질문');
    return head +
      '<section class="card"><h2>목표의 한계</h2><ul class="rows">' +
      '<li>비상금 6개월분은 단일 근로소득·부모 지원 유지를 고려한 설계상 선택이며 법정 기준이 아닙니다.</li>' +
      '<li>보증금 4,000은 고객이 부담하려는 목표액이며, 그 금액으로 원하는 주택을 구할 수 있는지 확인한 값이 아닙니다.</li>' +
      '<li>결혼식·혼수 비용은 4,150에 들어 있지 않습니다. 이사 후 월세·관리비도 정해지지 않아 재설계 대상으로 남깁니다.</li></ul></section>' +
      '<section class="card"><h2>정보의 구분</h2>' + plain([
        ['① 사례 입력값', '연령·직업, 소득(총급여 4,500, 실수령 320), 자산(총 2,300), 부채(신용대출 1,000), 지출(월 235), 목표'],
        ['② 계산 가정', '기본안 소득 유지, 생활비 200으로 조정, 월말 납입, 공통 비교모형 세후 연 2%, 현재 보증금 1,000 전액 반환'],
        ['③ 실행 전 확인', '최근 3개월 급여·카드·자동이체 내역, 대출 약정과 수수료, 실제 ETF 순매도대금, 보험증권, 연금자료, 결혼비용, 희망 주택, 보증금 반환일, 계약금·잔금일, 정책 가입이력·가구소득·회사 참여 여부']
      ], ['구분', '내용'], '정보의 구분') + src('표 4') + '</section>' +
      '<section class="card"><h2>면담에서 확인할 질문</h2><ol>' +
      ['부모 지원과 건강·자기계발비를 유지하려는 이유는 무엇인가?', '월 35만원 절감 중 지속하기 어려운 항목은 무엇인가?', '결혼일과 이사일은 반드시 일치해야 하는가?',
        '자금이 부족하면 지역·면적·보증금·이사 시점 중 무엇을 조정할 수 있는가?', '결혼식·혼수 비용은 별도 재원으로 충당 가능한가?', '현재 보증금이 늦게 반환될 때 어떤 선택이 가능한가?']
        .map(function (q) { return '<li>' + ui.esc(q) + '</li>'; }).join('') + '</ol>' +
      '<p class="small muted">이 사례에서는 질문에 대한 고객의 답변을 가정하지 않습니다(보고서 3장).</p></section>';
  };

  /* ---------- 3. 보고서 기준 초기 지표(표 7) — 진단 화면 아래에 붙인다 ---------- */
  function reportMetrics(c) {
    var k = c.state.customer;
    var g = k.goal || {};
    var after = c.d.plan || {};
    var ess = num(after.essential) || num((c.d.beforePlan || {}).essential);
    var cash = num(k.cash);
    var assets = cash + num(k.savings) + num(k.emergency) + num(k.housing) + num(k.investment) + num(k.pension) + num(k.depositReturn && k.depositReturn.amount);
    var debt = (k.debts || []).reduce(function (s, d) { return s + num(d.balance); }, 0);
    var sav = num(k.existingSaving && k.existingSaving.monthly);
    var need = num(g.depositTarget) + num(g.movingCost);
    var dep = num(k.depositReturn && k.depositReturn.amount);
    var rows = [
      ['즉시 현금 보유기간', '입출금 현금 ' + fmt.short(cash) + ' ÷ 필수생활비 ' + fmt.short(ess), ess ? fmt.num1(cash / ess) + '개월' : '—', '소득이 끊겼을 때 버틸 수 있는 기간'],
      ['부채/총자산', fmt.short(debt) + ' ÷ ' + fmt.short(assets), assets ? fmt.num1((debt / assets) * 100) + '%' : '—', '총자산 대비 부채 부담'],
      ['정기 저축·투자율', fmt.short(sav) + ' ÷ ' + fmt.short(num(k.netMonthly)), num(k.netMonthly) ? fmt.num1((sav / num(k.netMonthly)) * 100) + '%' : '—', '지금 매달 저축·투자하는 비율'],
      ['주거 추가 필요액', fmt.short(need) + ' − 돌려받을 보증금 ' + fmt.short(dep), fmt.num1(need - dep), '반환 보증금을 전부 다시 쓴다는 전제'],
      ['현재 비상금 부족액', fmt.short(num(g.emergencyTarget)) + ' − ' + fmt.short(cash), fmt.num1(Math.max(0, num(g.emergencyTarget) - cash)), '주거자금보다 먼저 채울 금액']
    ];
    return '<section class="card"><h2>상담 시작 시점의 지표(보고서 기준)</h2>' + plain(rows, ['지표', '산식', '결과', '해석'], '보고서 기준 지표') +
      '<p class="small muted">위 「진단 지표」 표는 용도를 정한 돈만 비상금·주거자금으로 세기 때문에 설계 전 비상자금이 0개월로 나옵니다. 이 표는 보고서 표 7과 같은 방식으로, 입출금 현금 전체를 조정 후 필수생활비로 나눈 값입니다. 두 표는 정의가 다를 뿐 같은 자료입니다.</p></section>';
  }
  var baseDiag = pages.diagnosis;
  pages.diagnosis = function (c) {
    var html = baseDiag(c);
    return c.d.beforePlan ? html + reportMetrics(c) : html;
  };

  /* ---------- 4. 설계 근거(표 8·9·13·14·16) ---------- */
  function debtOptions(c) {
    var k = c.state.customer;
    var d = (k.debts || []).slice().sort(function (a, b) { return num(b.rate) - num(a.rate); })[0];
    if (!d || num(d.balance) <= 0) return '';
    var plan = c.d.plan || {};
    var pool = num(k.cash) + num(k.savings) + num(k.investment);
    var ess = num(plan.essential);
    var bal = num(d.balance), r = num(d.rate);
    var baseP = num(d.monthlyPrincipal) || (num(d.remainingMonths) ? bal / num(d.remainingMonths) : 0);
    var ov = (plan.debtOverrides || {})[d.name] || {};
    // 원금균등 가정의 남은 이자 합계
    var interest = function (b, p) { var s = 0, guard = 0; while (b > 1e-9 && p > 0 && guard++ < 1200) { s += b * r / 12; b -= Math.min(p, b); } return s; };
    var chosen = Math.min(num((plan.initial || {}).repayFromCash), bal, pool);
    var opts = [
      ['대출 유지', 0, baseP],
      ['전액 상환', Math.min(bal, pool), baseP],
      ['부분 상환', chosen, num(ov.monthlyPrincipal) || baseP]
    ];
    var rows = opts.map(function (o) {
      var left = bal - o[1];
      return [{ html: ui.esc(o[0]) + (o[0] === '부분 상환' && chosen > 0 && chosen < bal ? ' ' + ui.badge('채택', 'ok') : '') }, n1(o[1]), n1(pool - o[1]), n1(left), n1(interest(left, o[2])), ess ? fmt.num1((pool - o[1]) / ess) + '개월' : '—'];
    });
    return '<section class="card"><h2>대출 상환 대안 비교 — ' + ui.esc(d.name) + ' 연 ' + fmt.num1(r * 100) + '%</h2>' +
      '<p>바로 쓸 수 있는 돈은 현금 ' + fmt.short(num(k.cash)) + ' + 예·적금 ' + fmt.short(num(k.savings)) + ' + 투자자산 ' + fmt.short(num(k.investment)) + ' = <strong>' + fmt.short(pool) + '만원</strong>입니다. 이 돈으로 대출을 얼마나 갚느냐에 따라 남는 현금과 이자가 달라집니다.</p>' +
      plain(rows, ['대안', '즉시 상환', '남는 현금', '남는 대출', '이후 이자 합계', '남는 현금 ÷ 필수생활비'], '상환 대안 비교') +
      '<p class="small muted">이자는 원금균등 상환이 그대로 이어진다는 조건의 계산이며 중도상환수수료·미수이자는 넣지 않았습니다. 필수생활비는 설계안 기준 ' + fmt.short(ess) + '만원입니다.</p>' +
      (isCase(c) ? '<p>부분 상환을 채택한 이유: 전액 상환보다 현금 300을 더 들고 시작하면서 남은 대출 300을 3개월 안에 갚습니다. 추가로 내는 이자 3.6은 초기 유동성을 확보하는 비용입니다. ETF 처분은 시장 하락 예상 때문이 아니라, 약 3년 뒤 쓸 주거자금이라는 기간·원금손실을 피하려는 고객 선호·연 7.2% 이자 부담을 함께 본 적합성 판단입니다.</p>' + src('표 8') : '') + '</section>';
  }

  function livingTable(c) {
    var k = c.state.customer;
    var plan = c.d.plan || {};
    var items = k.livingItems || [];
    if (!items.length) return '';
    var adj = {};
    (plan.livingAdjust || []).forEach(function (a) { adj[a[0]] = a[2]; });
    var how = { '월세·관리비': '현재 계약 유지', '교통비': '통근 유지', '식비·생필품': '배달·외식 상한 설정, 장보기 계획', '통신·구독': '미사용 구독 정리', '보험료': '보장 내용 확인 전 유지', '부모 지원': '고객이 유지하려는 가치 지출', '건강·자기계발': '고객이 유지하려는 가치 지출', '여가·쇼핑': '주간 여가예산 관리', '비정기 적립': '경조사·수리 등 대비' };
    var tb = 0, ta = 0;
    var rows = items.filter(function (i) { return num(i.amount) > 0 || adj[i.label] !== undefined; }).map(function (i) {
      var b = num(i.amount), a = adj[i.label] !== undefined ? num(adj[i.label]) : b;
      tb += b; ta += a;
      return [i.label, n1(b), n1(a), a === b ? '0' : { html: '<strong class="num">' + fmt.num1(b - a) + '</strong>' }, isCase(c) ? (how[i.label] || '') : (a === b ? '유지' : '조정')];
    });
    rows.push([{ html: '<strong>합계</strong>' }, n1(tb), n1(ta), { html: '<strong class="num">' + fmt.num1(tb - ta) + '</strong>' }, '']);
    var match = Math.abs(ta - (num(plan.essential) + num(plan.optional))) < 0.05;
    return '<section class="card"><h2>생활비 조정안</h2>' + plain(rows, ['항목', '기존', '조정', '절감', '실행 방법'], '생활비 조정안') +
      '<p class="small muted">단위 만원/월. ' + (match ? '조정 합계 ' + fmt.short(ta) + '은 실행 기준 계획의 생활비(필수 ' + fmt.short(plan.essential) + ' + 선택 ' + fmt.short(plan.optional) + ')와 같습니다.' : '실행 기준 계획의 생활비는 필수 ' + fmt.short(plan.essential) + ' + 선택 ' + fmt.short(plan.optional) + '입니다.') + '</p>' +
      (isCase(c) ? '<p class="small muted">필수생활비 165 = 조정 생활비 200 − 여가·쇼핑 25 − 비정기 적립 10. 월 35 절감이 지속 가능한지는 면담 질문 2로 확인해야 하는 핵심 가정입니다.</p>' + src('표 9') : '') + '</section>';
  }

  function productSplit(c) {
    var plan = c.d.plan || {};
    var p = (plan.products || []).filter(function (x) { return x.type === 'bank'; })[0];
    if (!p) return '';
    var n = num(p.months), A = num(p.monthly), i = num(p.rate), pi = num(p.prefRate);
    var surplus = num(c.state.customer.netMonthly) - num(plan.essential) - num(plan.optional) - num(plan.pensionMonthly);
    var total = surplus;
    var after = function (a, rate) { return a * rate / 12 * n * (n + 1) / 2 * (1 - 0.154); };
    var col = function (a, rate) { return [n1(a * n), (rate * 100).toFixed(2) + '%', n1(after(a, rate)), n1(a * n + after(a, rate))]; };
    var c1 = col(A, i), c2 = pi ? col(A, pi) : null, c3 = col(total, i);
    var heads = ['구분', '월 ' + fmt.short(A) + ' · 기본금리'].concat(c2 ? ['월 ' + fmt.short(A) + ' · 우대 충족'] : []).concat(['월 ' + fmt.short(total) + ' 전액 적금 · 기본금리']);
    var names = ['원금', '적용금리 가정(연)', '세후 이자 근사', '만기금 근사'];
    var rows = names.map(function (nm, r) { return [nm, c1[r]].concat(c2 ? [c2[r]] : []).concat([c3[r]]); });
    var liquid = (total - A) * n;
    var giveUp = after(total, i) - after(A, i);
    return '<section class="card"><h2>주거자금 상품 배치 — 적금 ' + fmt.short(A) + ' / 유동자금 ' + fmt.short(total - A) + '</h2>' +
      '<p>월 주거저축 ' + fmt.short(total) + '을 전부 적금에 묶지 않고 ' + ui.esc(p.start) + '부터 ' + n + '개월 동안 <strong>적금 ' + fmt.short(A) + ' + 바로 꺼낼 수 있는 주거 유동자금 ' + fmt.short(total - A) + '</strong>으로 나눕니다. 만기 전에도 계약금이나 일정 변화에 대응할 돈을 남기기 위해서입니다.</p>' +
      plain(rows, heads, '자유적금 적용 예시') +
      '<p>나눠서 얻는 것: ' + n + '개월 동안 유동성 <strong>' + fmt.short(liquid) + '만원</strong>. 포기하는 것: 세후 이자 약 <strong>' + fmt.num1(giveUp) + '만원</strong>.</p>' +
      '<p class="small muted">이자는 납입 회차별 단리 근사(첫 납입 ' + n + '개월 ~ 마지막 납입 1개월), 이자소득세 15.4% 차감. 조사일 금리가 가입할 때도 같다는 조건의 예시이며 금리를 보장하지 않습니다. 특정 상품 추천이 아니라 비교 예시입니다.</p>' +
      (isCase(c) ? src('표 13·14') : '') + '</section>';
  }

  function suitability(c) {
    if (!isCase(c)) return '';
    return '<section class="card"><h2>정책상품·보험·연금 적합성 판단</h2>' + plain([
      ['청년미래적금', '3년 만기, 월 최대 50, 기여금 6% 또는 12%. 2차 신청 2026.10.07~10.16', { html: ui.badge('기본 재원에서 제외', 'warn') + ' 신청 이력이 없고, 2026-11에 개설해도 만기가 2029-11로 목표(2029-10)보다 늦습니다. 우대형 12%는 가구소득 등 심사가 필요해 확정할 수 없습니다.' }],
      ['재직자 우대 저축공제', '3년형·5년형, 월 10~50, 기업지원금 20% 또는 40%. 기업의 참여·협약 필요', { html: ui.badge('확인 필요', 'warn') + ' 회사 참여와 지원비율 미확인. 기존 110 외에 공제 납입액을 따로 만들지 않습니다.' }],
      ['소득세 감면', '중소기업 취업 청년 소득세 감면 적용 여부', { html: ui.badge('확인 필요', 'warn') + ' 실수령 320에 이미 반영됐는지 확인. 환급액을 임의로 넣지 않습니다.' }],
      ['보험', '보험료 월 8(실손 3 + 정액 질병 보장 5, 사례 가정)', '보장기간·갱신·자기부담·면책·단체보험 중복을 확인하기 전에는 해지하지 않습니다.'],
      ['연금', '연금저축 잔액 100, 월 10 유지', '국민연금 예상액·퇴직연금 정보가 없어 은퇴 충분성은 판단하지 않습니다. 미확정 세액공제 환급은 주거재원에 넣지 않습니다.']
    ], ['구분', '확인한 내용', '이 사례의 판단'], '적합성 판단') +
      '<p class="small muted">지원율이 높아도 가입 가능성·만기일·중도해지 조건이 자금을 쓸 시점과 맞지 않으면 기본안에 넣지 않습니다. 조건은 확인일(2026-11-03) 기준이며 신청 전 공식 기관에서 다시 확인하세요.</p>' + src('표 16') + '</section>';
  }

  pages.basis = function (c) {
    var body = debtOptions(c) + livingTable(c) + productSplit(c) + suitability(c);
    return ui.pageHead('설계 근거', '4단계 — 왜 이 설계안인지: 상환 대안, 생활비 조정, 상품 배치, 정책 적합성') +
      (body || '<section class="card">' + ui.empty('설계안이 아직 없어 근거를 보여 줄 수 없어요.') + '</section>');
  };

  /* ---------- 5. 실행 일정(표 18) ---------- */
  pages.schedule = function (c) {
    var head = ui.pageHead('실행 일정', '5단계 — 언제, 누가, 어떤 자료로 완료를 확인하는지');
    if (!isCase(c)) return head + notCase('실행 일정표');
    return head + '<section class="card"><h2>실행 일정과 확인 자료</h2>' + plain([
      ['실행 전 1주', '자료 대조, 목표·지출 조정안 선택', '설계 담당자 · 가정·선택 기록'],
      ['실행 직전', '예·적금·ETF 현금화, 대출 700 상환', '금융기관 · 순매도대금·수수료·잔액'],
      ['매월 급여일 다음 날', '생활·연금·목적자금 이체', '고객 · 이체내역'],
      ['2026.11~2027.01', '원금 월 100과 이자 상환', '은행 · 완제·미수이자 확인'],
      ['2027.06', '비상금 990 완성, 주거 86.4 적립', '월말 잔액'],
      ['2027.07~2029.03', '자유적금 월 80, 주거 유동자금 월 30', '자동이체·입출금내역'],
      ['2029.04', '적금 만기금 수령, 매물 조사', '만기금·주택조건 확인'],
      ['2029.04~10', '월 110 유동자금 적립', '목적별 관리표'],
      ['계약 전', '계약금·잔금·반환일 대조', '지급일별 가용자금표'],
      ['이사 후', '새 생활비·비상금·보장·은퇴 재설계', '변경된 가구자료']
    ], ['시점', '실행할 일', '담당·확인 자료'], '실행 일정') + src('표 18') + '</section>' +
      '<section class="card"><h2>계약 전에 꼭 확인할 것</h2><ul class="rows">' +
      '<li>36개월 결과에는 2029년 10월 말에 넣는 110이 들어 있습니다. 잔금일이 그보다 빠르면 원금 기준 93.6만원이 모자랍니다(계산은 진단 화면의 「계산 조건별 결과」).</li>' +
      '<li>계약금을 400으로 가정하면 잔금은 3,600, 부대비용 150을 더해 이후 필요한 돈은 3,750입니다. 이미 낸 계약금을 자산과 지출 양쪽에 두 번 세지 않습니다.</li>' +
      '<li>임대인과 등기상 소유자 일치, 대리권, 선순위 권리, 납세 자료를 점검하고 법률 판단은 전문가 확인을 받습니다. 보증금반환보증은 가입 가능 여부와 비용이 주택마다 달라 0원으로 가정하지 않습니다.</li></ul></section>';
  };

  /* ---------- 6. 점검 주기·경보 기준(표 20) ---------- */
  pages.cadence = function (c) {
    var head = ui.pageHead('점검 주기·기준', '6단계 — 누가 얼마나 자주 보고, 어떤 일이 생기면 무엇을 하는지');
    if (!isCase(c)) return head + notCase('점검 주기와 조치 기준');
    return head + '<section class="card"><h2>점검 주기</h2>' + plain([
      ['매주(약 10분)', '고객', '생활계좌 점검'],
      ['매월 말', '고객 → 설계 담당자', '잔액·납입내역 기록(앱의 이번 달 기록), 담당자가 내역 검토'],
      ['분기', '설계 담당자', '목표 달성 전망 다시 계산'],
      ['반기 · 계약 전', '설계 담당자', '정책·주거 조건 확인'],
      ['매년 · 변화 즉시', '고객·설계 담당자', '가족·건강·은퇴 관련 사항']
    ], ['주기', '누가', '무엇을'], '점검 주기') + '</section>' +
      '<section class="card"><h2>경보와 조치 기준</h2>' + plain([
        ['생활비', '200 초과 2개월 연속', '원인 확인, 3·4단계 재평가', '앱 경보'],
        ['비상금', '완성 후 825 미만', '주거납입 조정, 990 복구', '앱 경보'],
        ['소득·고용', '실수령 10% 이상 감소·실직', '2단계 자료 재수집', '앱 경보'],
        ['주거 잔액', '계획 대비 5% 이상 부족', '미래 잔액·납입 재계산', '앱 경보(누적 저축 미달)'],
        ['목표 전망', '예상 지급일 가용자금이 목표 미달', '부족액·보완액·일정 대안 제시', '판정·역산 도구'],
        ['정책·주거', '자격·만기·가격·반환일 변경', '적합성·현금 사용 시점 확인', '사람이 확인'],
        ['대출', '미상환·추가 차입', '상환과 생활비 재설계', '사람이 확인'],
        ['가족·건강', '결혼·부양·질병 변화', '목표와 필요자금 재합의', '사람이 확인'],
        ['소득 증가', '실제 증가 확인', '증가분의 70% 주거 · 20% 연금 또는 장기목표 · 10% 여가·자기계발 배분 검토', '사람이 확인']
      ], ['항목', '경보', '조치', '앱에서'], '경보와 조치 기준') +
      '<p class="small muted">주거 잔액 5% 기준만으로는 부족합니다. 5%(약 162)는 목표 여유(90.2)보다 커서, 5% 차이가 나기 전에 이미 목표에 못 미칠 수 있습니다. 그래서 「지급일 예상 가용자금」(판정)을 함께 봅니다. 숫자 기준은 「경보 기준」 화면에서 바꿀 수 있습니다.</p>' + src('표 20') + '</section>';
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
