/**
 * 사주 전체 값 검증 스크립트
 * 다양한 생년월일시·성별로 solarToSaju / lunarToSaju 결과의 모든 항목을 검증
 *
 * 실행: cd backend && node scripts/saju-full-verify.js
 */
import { solarToSaju, lunarToSaju } from '../src/services/saju.js';

const currentYear = new Date().getFullYear();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

function checkNonEmpty(value, name) {
  assert(value != null && value !== '', `${name} must be non-empty`);
}

function checkDistribution(d) {
  assert(d && typeof d === 'object', 'ohang.distribution must be object');
  const keys = ['목', '화', '토', '금', '수'];
  keys.forEach((k) => assert(typeof d[k] === 'number' && d[k] >= 0, `ohang.distribution.${k} must be number >= 0`));
}

function checkPillarKeys(obj, name) {
  if (!obj) return;
  ['year', 'month', 'day', 'hour'].forEach((p) => {
    if (obj[p] != null) assert(typeof obj[p] === 'object' || typeof obj[p] === 'string', `${name}.${p} type`);
  });
}

function checkJijiRelation(jiji) {
  if (!jiji) return;
  ['year', 'month', 'day', 'hour'].forEach((p) => {
    const v = jiji[p];
    if (v && v.ko) {
      const ko = v.ko;
      ['jangan', 'banghap', 'samhap', 'banhap', 'gahap', 'yukhap', 'amhap', 'chung', 'hyeong', 'pa', 'hae', 'wonjin', 'gweemun'].forEach((key) => {
        if (ko[key] !== undefined && ko[key] !== null) assert(typeof ko[key] === 'string' || ko[key] === null, `jijiRelation.${p}.ko.${key}`);
      });
    }
  });
}

function checkSeunCenteredOnCurrentYear(seun) {
  assert(Array.isArray(seun) && seun.length === 10, 'seun must be array of length 10');
  const years = seun.map((s) => s.year);
  assert(years.includes(currentYear), `seun must include current year ${currentYear}`);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  assert(minY === currentYear - 4 && maxY === currentYear + 5, `seun range must be ${currentYear - 4}~${currentYear + 5}`);
  seun.forEach((s, i) => {
    assert(s.year !== undefined && s.gapja && s.gapjaKo, `seun[${i}] must have year, gapja, gapjaKo`);
    assert(s.sipseong === null || (s.sipseong && (s.sipseong.ko || s.sipseong.zh)), `seun[${i}].sipseong`);
    assert(s.sinsal && typeof s.sinsal === 'string', `seun[${i}].sinsal must be string (流年地支 기준)`);
    assert(s.unseong12 === null || (s.unseong12 && (s.unseong12.ko || s.unseong12.zh)), `seun[${i}].unseong12`);
  });
}

const TEST_CASES = [
  { id: 'solar-2017', desc: '양력 2017-06-24 무시 무성별', fn: () => solarToSaju('2017-06-24'), hasHour: false, hasGender: false },
  { id: 'solar-1956', desc: '양력 1956-03-03 여', fn: () => solarToSaju('1956-03-03', undefined, 'F'), hasHour: false, hasGender: true },
  { id: 'solar-1990-14:30-M', desc: '양력 1990-05-15 14:30 남', fn: () => solarToSaju('1990-05-15', '14:30', 'M'), hasHour: true, hasGender: true },
  { id: 'solar-2000-09:00-F', desc: '양력 2000-01-01 09:00 여', fn: () => solarToSaju('2000-01-01', '09:00', 'F'), hasHour: true, hasGender: true },
  { id: 'solar-1988-08:00-M', desc: '양력 1988-02-17 08:00 남', fn: () => solarToSaju('1988-02-17', '08:00', 'M'), hasHour: true, hasGender: true },
  { id: 'lunar-1956', desc: '음력 1956-01-21 여', fn: () => lunarToSaju('1956-01-21', false, undefined, 'F'), hasHour: false, hasGender: true },
  { id: 'lunar-1985-20:00-M', desc: '음력 1985-08-15 20:00 남', fn: () => lunarToSaju('1985-08-15', false, '20:00', 'M'), hasHour: true, hasGender: true },
  { id: 'solar-1995-12:00-F', desc: '양력 1995-07-20 12:00 여', fn: () => solarToSaju('1995-07-20', '12:00', 'F'), hasHour: true, hasGender: true },
  { id: 'solar-1970-00:00-M', desc: '양력 1970-01-01 00:00 남', fn: () => solarToSaju('1970-01-01', '00:00', 'M'), hasHour: true, hasGender: true },
];

console.log('=== 사주 전체 값 검증 (다양한 생년월일시·성별) ===\n');
console.log(`현재 연도 기준 세운 중심: ${currentYear} (${currentYear - 4} ~ ${currentYear + 5})\n`);

let passed = 0;
let failed = 0;

for (const tc of TEST_CASES) {
  try {
    const saju = tc.fn();
    assert(saju, `${tc.id}: saju must be non-null`);

    checkNonEmpty(saju.gapjaKorean?.year, 'gapjaKorean.year');
    checkNonEmpty(saju.gapjaKorean?.month, 'gapjaKorean.month');
    checkNonEmpty(saju.gapjaKorean?.day, 'gapjaKorean.day');
    checkNonEmpty(saju.gapjaChinese?.year, 'gapjaChinese.year');
    checkNonEmpty(saju.gapjaChinese?.month, 'gapjaChinese.month');
    checkNonEmpty(saju.gapjaChinese?.day, 'gapjaChinese.day');
    if (tc.hasHour) {
      checkNonEmpty(saju.gapjaKorean?.hour, 'gapjaKorean.hour');
      checkNonEmpty(saju.gapjaChinese?.hour, 'gapjaChinese.hour');
    }

    assert(saju.ohang?.distribution, 'ohang.distribution');
    checkDistribution(saju.ohang.distribution);

    assert(saju.sipseong, 'sipseong');
    checkPillarKeys(saju.sipseong, 'sipseong');
    ['year', 'month', 'day'].forEach((p) => {
      if (saju.sipseong[p]) assert(saju.sipseong[p].ko != null || saju.sipseong[p].zh != null, `sipseong.${p}`);
    });

    assert(saju.unseong12, 'unseong12');
    ['year', 'month', 'day'].forEach((p) => {
      if (saju.unseong12[p]) assert(saju.unseong12[p].ko != null || saju.unseong12[p].zh != null, `unseong12.${p}`);
    });

    assert(saju.cheonganRelation && typeof saju.cheonganRelation === 'object', 'cheonganRelation');
    assert(saju.jijiRelation && typeof saju.jijiRelation === 'object', 'jijiRelation');
    checkJijiRelation(saju.jijiRelation);

    assert(saju.sinsal12 != null, 'sinsal12');
    assert(saju.sinsal12Pillar != null, 'sinsal12Pillar');
    assert(saju.sinsalCombined != null, 'sinsalCombined');

    if (tc.hasGender && saju.solar?.year != null) {
      assert(saju.daeun?.steps?.length === 10, 'daeun.steps length 10');
      saju.daeun.steps.forEach((s, i) => {
        assert(s.age !== undefined && s.gapja && s.gapjaKo, `daeun.steps[${i}]`);
        assert(s.sipseong === null || typeof s.sipseong === 'object', `daeun.steps[${i}].sipseong`);
        assert(s.sinsal && typeof s.sinsal === 'string', `daeun.steps[${i}].sinsal must be string (大运地支 기준)`);
        assert(s.unseong12 === null || typeof s.unseong12 === 'object', `daeun.steps[${i}].unseong12`);
      });

      assert(Array.isArray(saju.seun), 'seun array');
      checkSeunCenteredOnCurrentYear(saju.seun);

      assert(Array.isArray(saju.woleun) && saju.woleun.length === 12, 'woleun length 12');
      saju.woleun.forEach((w, i) => {
        assert(w.month === i + 1 && w.gapja && w.gapjaKo, `woleun[${i}]`);
      });
    }

    console.log(`  OK: ${tc.id} (${tc.desc})`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${tc.id} (${tc.desc})`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 참조 문서(SAJU_COMPARE_RESULT) 알려진 값과 일치 검증
console.log('\n--- 참조 값 일치 검증 (with-time-1990) ---');
try {
  const r = solarToSaju('1990-05-15', '14:30', 'M');
  assert(r.gapjaKorean?.year === '경오년' && r.gapjaKorean?.month === '신사월' && r.gapjaKorean?.day === '경진일' && r.gapjaKorean?.hour === '계미시', 'gapjaKorean 1990');
  assert(r.gapjaChinese?.year === '庚午年' && r.gapjaChinese?.month === '辛巳月' && r.gapjaChinese?.day === '庚辰日' && r.gapjaChinese?.hour === '癸未时', 'gapjaChinese 1990');
  assert(r.ohang?.distribution?.목 === 0 && r.ohang?.distribution?.화 === 2 && r.ohang?.distribution?.토 === 2 && r.ohang?.distribution?.금 === 3 && r.ohang?.distribution?.수 === 1, 'ohang 1990');
  assert(r.sipseong?.year?.ko === '비견' && r.sipseong?.month?.ko === '겁재' && r.sipseong?.day?.ko === '비견' && r.sipseong?.hour?.ko === '상관', 'sipseong 1990');
  console.log('  OK: 양력 1990-05-15 14:30 남 — 간지·오행·십성 참조 문서와 일치');
  passed++;
} catch (err) {
  console.error(`  FAIL: ${err.message}`);
  failed++;
}

console.log('\n--- 요약 ---');
console.log(`통과: ${passed} / ${passed + failed}`);
if (failed > 0) {
  console.error(`실패: ${failed}`);
  process.exit(1);
}
console.log('검증 완료: 모든 항목 정상');
