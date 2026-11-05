/*
 * 시연 고객 김하늘(가상) 기본 데이터 (명세 2절).
 * 금액 단위: 만원. 이율: 연이율 소수.
 * getDemo()는 매번 새 사본을 돌려준다(원본이 화면에서 바뀌지 않도록).
 */
(function (root) {
  'use strict';

  var DEMO = {
    schemaVersion: 1,
    demoVersion: 2, // 시연 데이터 내용이 바뀔 때마다 올린다(저장된 옛 시연 데이터 안내용)
    demoToday: '2026-11-05', // 시연 기준일(명세 검토 표 5번)
    activePlanId: 'after-v1',

    customer: {
      name: '김하늘(가상)',
      birth: '1997-03',
      firstJob: '2023-11',
      job: '사무직',
      companySize: '중소기업',
      region: '수도권',
      grossPrevYear: 4000,
      netMonthly: 290,
      taxExemption: { applied: true, start: '2023-11', end: '2028-10', monthlyEffect: 9 },
      cash: 900,
      emergency: 0,
      housing: 800,
      investment: 400,
      depositReturn: { amount: 1000, month: '2028-08' },
      pension: 300,
      debts: [
        { name: '학자금 대출', balance: 900, rate: 0.017, monthlyPayment: 15 },
        { name: '신용대출', balance: 1500, rate: 0.065, monthlyPayment: 35 }
      ],
      goal: { depositTarget: 5000, movingCost: 200, emergencyTarget: 800 },
      risk: {
        institution: {
          type: '위험중립형',
          date: '2024-05-10',
          source: 'OO은행 투자자정보확인서(가상)',
          purpose: '목돈 운용(펀드 가입)',
          netAtThatTime: 260
        },
        appSurvey: null
      }
    },

    plans: [
      {
        id: 'before-v1',
        kind: '설계 전',
        date: '2026-08-20',
        name: '설계 전 진단',
        memo: '현재 소비·상환 습관을 유지하는 경우',
        startMonth: '2026-09',
        targetMonth: '2029-08',
        essential: 135,
        optional: 60,
        extraRepayment: 0,
        products: [],
        parentId: null,
        author: '설계사'
      },
      {
        id: 'after-v1',
        kind: '설계 후',
        date: '2026-08-27',
        name: '설계 후 1차 수정안',
        memo: '선택지출 22·필수 5 절감, 월 15 추가 상환, 이사월 2029-12',
        startMonth: '2026-09',
        targetMonth: '2029-12',
        essential: 130,
        optional: 38,
        extraRepayment: 15,
        products: [{ policyId: 'youth-future', monthly: 30, start: '2026-12', months: 36, conditional: true }],
        parentId: 'before-v1',
        author: '설계사',
        selectedBy: '고객',
        selectedAt: '2026-08-28'
      }
    ],

    initial: { repayFromCash: 300, emergencyFromCash: 600 }, // 2026-08 말 초기 처리

    assumptions: {
      livingGrowth: 0.02,
      emergencyRate: 0.03,
      housingRate: 0.03,
      investmentRate: 0.04,
      highRateThreshold: 0.04,
      includeInvestmentInHousing: true
    },

    assumptionNotes: {
      livingGrowth: '생활비는 시작월부터 12개월마다 연 2%씩 오른다고 가정합니다. 물가 전망이 아니라 보수적 계획값입니다.',
      emergencyRate: '연 3%는 예금 금리 가정이며 보장값이 아닙니다. 월 이율은 연이율 ÷ 12로 계산합니다.',
      housingRate: '연 3%는 예금 금리 가정이며 보장값이 아닙니다. 월 이율은 연이율 ÷ 12로 계산합니다.',
      investmentRate: '연 4%는 투자자산의 계획용 기대수익 가정입니다. 실제로는 가격이 오르내리며 손실이 날 수 있습니다.',
      highRateThreshold: '연 4% 이상인 부채만 고금리로 보고 추가 상환합니다. 예금 금리 가정(3%)보다 높아 먼저 갚는 쪽이 유리하기 때문입니다.',
      includeInvestmentInHousing: '투자자산을 이사 자금에 포함합니다. 매각 시 가격 변동이 있으므로 화면에서 현금성과 따로 표시합니다.'
    },

    records: [
      { month: '2026-09', debt: 65, emergency: 50, essential: 130, optional: 42, status: '확정' },
      { month: '2026-10', debt: 65, essential: 132, optional: 61, status: '확정' },
      { month: '2026-11', debt: 65, optional: 18, status: '잠정' }
    ],

    scheduledPayments: [
      { name: '10월 카드대금', amount: 42, kind: '선택', spendMonth: '2026-10', note: '예측용 — 확인 전에는 기록에 더하지 않음' },
      { name: '월세·관리비', amount: 65, kind: '필수', spendMonth: '2026-11', note: '예측용 — 확인 전에는 기록에 더하지 않음' }
    ],

    // 결과(판정·부족액)는 저장하지 않고 화면에서 엔진으로 다시 계산한다. 적용 로직은 3단계에서 붙인다.
    // 숫자는 기본 모드 엔진으로 정했다: 제시일(2026-11-03)까지의 확정 기록(10월 초과 지출 포함)을 반영한
    // after-v1의 2029-12 주거 부족액 224.5를 메우는 세 가지 전략(tests/solver.test.js에서 확인).
    proposals: [
      {
        id: 'abc-2026-11',
        type: '설계안',
        status: '고객에게 제시됨',
        createdAt: '2026-11-03',
        presentedAt: '2026-11-03',
        basePlanId: 'after-v1',
        title: '주거 부족액 224.5만원 보완 — 세 가지 실행 전략',
        options: [
          {
            key: 'A',
            name: '생활비 조정형',
            summary: '2026-12부터 선택지출을 월 6만원 줄입니다(38 → 32, 생활비 인상률 함께 적용). 이사월은 그대로 2029-12.',
            planChanges: { budgetAdjustments: [{ start: '2026-12', months: 0, optional: -6, grow: true }] }
          },
          {
            key: 'B',
            name: '이사 시점 조정형',
            summary: '생활비는 그대로 두고 이사월을 3개월 늦춥니다(2029-12 → 2030-03).',
            planChanges: { targetMonth: '2030-03' }
          },
          {
            key: 'C',
            name: '목표 보증금 조정형',
            summary: '생활비와 이사월은 그대로 두고 목표 보증금을 230만원 낮춥니다(5,000 → 4,770).',
            goalChanges: { depositTarget: 4770 }
          }
        ],
        chosenKey: null
      },
      {
        id: 'rev-overspend-2026-10',
        type: '수정안',
        kind: '초과 지출 보완',
        status: '확인 대기',
        createdAt: '2026-11-02',
        basePlanId: 'after-v1',
        // src/alerts.js의 buildOverspendRevision이 2026-11-05 기준으로 만드는 것과 같은 내용(테스트로 확인)
        title: '10월 생활비 초과분 보완',
        reason: '2026-10 생활비가 193만원으로 계획 168만원보다 25만원(14.9%) 많습니다 (필수 +2.0, 선택 +23.0).',
        summary: '초과분 25만원을 2026-12~2027-02 석 달 동안 선택지출 예산에서 월 8.3만원씩 나눠 줄입니다.',
        planChanges: { budgetAdjustments: [{ start: '2026-12', months: 3, optional: -25 / 3, note: '초과 지출 보완' }] },
        alertId: 'overspend-2026-10',
        author: '앱(규칙 기반)'
      }
    ],

    changeLog: [
      { at: '2026-08-20', who: '설계사', what: '설계 전 진단 작성', version: 'before-v1' },
      { at: '2026-08-27', who: '설계사', what: '설계 후 1차 수정안 작성', version: 'after-v1' },
      { at: '2026-08-28', who: '고객', what: '설계 후 1차 수정안을 실행 기준으로 선택', version: 'after-v1' }
    ]
  };

  function getDemo() {
    return JSON.parse(JSON.stringify(DEMO));
  }

  var api = { getDemo: getDemo };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Planner = root.Planner || {};
    root.Planner.demo = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
