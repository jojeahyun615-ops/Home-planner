/*
 * 심사위원 둘러보기(명세 6-4): ① 설계 전후 진단 → ② 충격 2개 함께 적용 → ③ 실행 기록과 경보 → ④ 수정안 비교와 고객 선택.
 * 단계마다 화면을 옮기고, 안내 문장은 지금 계산 결과로 만든다.
 */
(function (root) {
  'use strict';

  var P = root.Planner;
  var ui = P.ui;
  var fmt = P.format;

  var SEEN_KEY = 'jaemu-planner-tour-seen';

  function cond(j, k) { return j.conditions.filter(function (x) { return x.key === k; })[0]; }

  var STEPS = [
    {
      title: '설계 전후 진단',
      view: { role: 'planner', plannerPage: 'diagnosis' },
      text: function (c) {
        var b = c.d.beforePlan;
        if (!b) return '설계 전·후 판정과 진단 지표를 나란히 봅니다.';
        var jb = P.engine.runPlan(c.state, b.id).judgement;
        var ja = P.engine.runPlan(c.state, c.state.activePlanId).judgement;
        return '설계 전(' + b.targetMonth + ')은 ' + jb.label + ', 주거 ' + fmt.short(cond(jb, 'housing').shortfall) + '만원 부족. ' +
          '설계 후(' + c.d.plan.targetMonth + ')는 ' + ja.label + (cond(ja, 'housing').met ? '' : ', 주거 ' + fmt.short(cond(ja, 'housing').shortfall) + '만원 부족') + '입니다. ' +
          '진단 지표 표의 "바뀐 원인" 칸에서 무엇 때문에 달라졌는지 확인하세요.';
      }
    },
    {
      title: '충격 2개를 함께 적용',
      view: { role: 'planner', plannerPage: 'tools', tool: 'scenario', scn: null },
      text: function () {
        return '소득 10% 감소(6개월)와 생활비 5% 상승을 함께 켠 결과입니다. 확률이 아니라 "이 충격이 오면"의 조건부 결과예요. 표에서 충격을 더 켜거나 크기를 바꿔 [켠 충격을 함께 적용]을 눌러 보세요.';
      }
    },
    {
      title: '실행 기록과 경보',
      view: { role: 'customer', tab: 'alerts' },
      text: function (c) {
        var n = (c.state.alerts || []).filter(function (a) { return a.status !== '해소'; }).length;
        return '고객이 기록한 10월 생활비가 계획보다 많아 경보가 생겼고, 10월 비상금 기록이 없어 저축 누적 미달도 함께 떴어요(활성 경보 ' + n + '건). ' +
          '이번 달처럼 아직 유예기간이 남은 달은 기록이 없어도 "아직 확인 안 됨"으로만 표시합니다. 이번 달 기록 탭의 [시연용 거래 불러오기]로 빠진 10월 비상금을 채워 볼 수 있어요.';
      }
    },
    {
      title: '수정안 비교와 고객 선택',
      view: { role: 'customer', tab: 'plan' },
      text: function () {
        return '설계사가 제시한 A·B·C(서로 다른 실행 전략)와 초과 지출 보완 수정안을 적용 전후로 비교하세요. 고객이 [이 안 선택]이나 [적용]을 눌러야 실행 기준이 바뀌고, 이전 버전과 기록은 그대로 남습니다.';
      }
    }
  ];

  function markSeen() {
    try { root.localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* 무시 */ }
  }
  ui.tourSeen = function () {
    try { return root.localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
  };

  function go(i) {
    var s = STEPS[i];
    ui.setView(Object.assign({ tour: i, more: null, confirm: null }, s.view));
  }

  /** 화면 아래에 붙는 안내 패널 */
  ui.tourPanel = function (c) {
    var i = c.view.tour;
    if (i === null || i === undefined || !STEPS[i]) return '';
    var s = STEPS[i];
    return '<aside class="tour" role="dialog" aria-modal="false" aria-labelledby="tour-t">' +
      '<div class="tour-step">둘러보기 ' + (i + 1) + ' / ' + STEPS.length + '</div>' +
      '<h2 id="tour-t">' + ['①', '②', '③', '④'][i] + ' ' + ui.esc(s.title) + '</h2>' +
      '<p>' + ui.esc(s.text(c)) + '</p>' +
      '<div class="btn-row">' +
      (i > 0 ? '<button class="btn btn-sm" data-action="tour-go" data-step="' + (i - 1) + '">이전</button>' : '') +
      (i < STEPS.length - 1 ? '<button class="btn btn-sm btn-primary" data-action="tour-go" data-step="' + (i + 1) + '">다음</button>'
        : '<button class="btn btn-sm btn-primary" data-action="tour-end">둘러보기 끝내기</button>') +
      (i < STEPS.length - 1 ? '<button class="btn btn-sm" data-action="tour-end">그만 보기</button>' : '') +
      '</div></aside>';
  };

  /** 첫 방문 안내 카드(고객 홈 맨 위) */
  ui.tourWelcome = function (c) {
    if (ui.tourSeen() || (c.view.tour !== null && c.view.tour !== undefined)) return '';
    return '<section class="card welcome" aria-labelledby="welcome-h"><h2 id="welcome-h">처음 오셨나요?</h2>' +
      '<p class="small">가상 고객 김하늘의 주거자금 설계를 설계사 화면과 고객 화면을 오가며 4단계로 보여드려요.</p>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="tour-start">둘러보기 시작(약 2분)</button>' +
      '<button class="btn" data-action="tour-skip">바로 둘러볼게요</button></div></section>';
  };

  Object.assign(ui.actions, {
    'tour-start': function () { markSeen(); go(0); },
    'tour-go': function (c, el) { go(Number(el.getAttribute('data-step'))); },
    'tour-end': function () { markSeen(); ui.setView({ tour: null }, true); },
    'tour-skip': function () { markSeen(); ui.setView({ tour: null }, true); }
  });

  ui.TOUR_STEPS = STEPS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
