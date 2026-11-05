/*
 * 정답 테스트 입력·기대값(명세 7절). Node 테스트와 화면의 '계산 검증' 탭이 함께 쓴다.
 * 기대값은 사용자 허락 없이 바꾸지 않는다(명세 0절 5).
 * 허용 오차 ±0.05만원. 2026-09가 m=1.
 */
(function (root) {
  'use strict';

  var TOLERANCE = 0.05;

  // 필드 이름 → 화면 표시 이름
  var FIELD_LABELS = {
    income: '소득',
    interest: '이자',
    principal: '원금 상환',
    debtTotal: '부채 잔액',
    debtHigh: '고금리 부채 잔액',
    debtLow: '저금리 부채 잔액(조건 제외)',
    productPay: '상품 납입',
    productBalance: '상품 잔액',
    productMaturity: '상품 만기 지급',
    depositReturn: '보증금 반환',
    emergency: '비상금',
    housing: '주거자금',
    investment: '투자자산',
    usable: '사용 가능 주거자금',
    verdict: '판정',
    payoffHigh: '고금리 부채 상환 완료월',
    judgeStatus: '목표 판정',
    judgeLabel: '목표 판정(미충족 항목)',
    shortDebt: '부채 조건 부족액',
    shortEmergency: '비상금 조건 부족액',
    shortHousing: '주거 조건 부족액'
  };

  var CASES = [
    // A. 호환 모드(legacy) — 원본 앱 재현
    { id: 'A1', group: 'A', title: '설계 후, 2026-09', plan: 'after-v1', debtRule: 'legacy', month: '2026-09',
      expect: { interest: 7.8, principal: 57.2, debtTotal: 2042.8, emergency: 658.5, housing: 802.0, investment: 401.3 } },
    { id: 'A2', group: 'A', title: '설계 후, 2026-12', plan: 'after-v1', debtRule: 'legacy', month: '2026-12',
      expect: { productPay: 30, productBalance: 31.8, emergency: 800.0, housing: 812.9 } },
    { id: 'A3', group: 'A', title: '설계 후, 2028-08 보증금 반환', plan: 'after-v1', debtRule: 'legacy', month: '2028-08',
      expect: { depositReturn: 1000, housing: 2366.7 } },
    { id: 'A4', group: 'A', title: '설계 후, 2028-10 신용대출 완제', plan: 'after-v1', debtRule: 'legacy', month: '2028-10',
      expect: { principal: 64.0, debtTotal: 525.8 } },
    { id: 'A5', group: 'A', title: '설계 후, 2028-11 감면 종료', plan: 'after-v1', debtRule: 'legacy', month: '2028-11',
      expect: { income: 281, interest: 0.7, principal: 29.3, debtTotal: 496.5 } },
    { id: 'A6', group: 'A', title: '설계 후, 2029-12 목표월', plan: 'after-v1', debtRule: 'legacy', month: '2029-12',
      expect: { productMaturity: 1144.8, debtTotal: 112.4, emergency: 875.2, housing: 4323.4, investment: 457.0, usable: 4780.4, verdict: '미달' } },
    { id: 'A7', group: 'A', title: '설계 후, 정책상품 제외', plan: 'after-v1', debtRule: 'legacy', excludeProducts: true, month: '2029-12',
      expect: { usable: 4767.0 } },
    { id: 'A8', group: 'A', title: '설계 전, 2029-08', plan: 'before-v1', debtRule: 'legacy', month: '2029-08',
      expect: { debtTotal: 463.9, emergency: 864.4, usable: 3605.8 } },

    // B. 기본 모드(고금리 부채 규칙, 기준 연 4%)
    { id: 'B1', group: 'B', title: '설계 후, 2026-09 (A1과 같음)', plan: 'after-v1', debtRule: 'default', month: '2026-09',
      expect: { interest: 7.8, principal: 57.2, debtTotal: 2042.8, emergency: 658.5, housing: 802.0, investment: 401.3 } },
    { id: 'B2', group: 'B', title: '설계 후, 2029-12 목표월', plan: 'after-v1', debtRule: 'default', month: '2029-12',
      expect: { debtHigh: 0, payoffHigh: '2028-10', debtLow: 335.6, emergency: 875.2, housing: 4548.3, usable: 5005.2,
        judgeStatus: '미달', judgeLabel: '미달(주거)', shortDebt: 0, shortEmergency: 0, shortHousing: 194.8 } },
    { id: 'B3', group: 'B', title: '설계 후, 정책상품 제외', plan: 'after-v1', debtRule: 'default', excludeProducts: true, month: '2029-12',
      expect: { usable: 4991.8 } }
  ];

  function getActual(field, row, result) {
    var j = result.judgement;
    var cond = function (key) {
      for (var i = 0; i < j.conditions.length; i++) if (j.conditions[i].key === key) return j.conditions[i].shortfall;
      return undefined;
    };
    switch (field) {
      case 'payoffHigh': return result.payoff.high;
      case 'judgeStatus': return j.status;
      case 'judgeLabel': return j.label;
      case 'shortDebt': return cond('debt');
      case 'shortEmergency': return cond('emergency');
      case 'shortHousing': return cond('housing');
      default: return row ? row[field] : undefined;
    }
  }

  /**
   * 사례 하나 실행.
   * @param {object} c 사례
   * @param {object} P { engine, demo } (Node: require 결과, 브라우저: window.Planner)
   * @returns {{id, title, pass, checks:[{field,label,expected,actual,pass}]}}
   */
  function runCase(c, P) {
    var state = P.demo.getDemo();
    var result = P.engine.runPlan(state, c.plan, {
      debtRule: c.debtRule,
      excludeProducts: !!c.excludeProducts
    });
    var row = P.engine.rowAt(result, c.month);
    var checks = Object.keys(c.expect).map(function (field) {
      var expected = c.expect[field];
      var actual = getActual(field, row, result);
      var pass = typeof expected === 'number'
        ? typeof actual === 'number' && Math.abs(actual - expected) <= TOLERANCE
        : actual === expected;
      return { field: field, label: FIELD_LABELS[field] || field, expected: expected, actual: actual, pass: pass };
    });
    return {
      id: c.id,
      group: c.group,
      title: c.title,
      pass: checks.every(function (x) { return x.pass; }),
      checks: checks
    };
  }

  function runAll(P) {
    return CASES.map(function (c) { return runCase(c, P); });
  }

  var api = { TOLERANCE: TOLERANCE, FIELD_LABELS: FIELD_LABELS, CASES: CASES, runCase: runCase, runAll: runAll };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Planner = root.Planner || {};
    root.Planner.cases = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
