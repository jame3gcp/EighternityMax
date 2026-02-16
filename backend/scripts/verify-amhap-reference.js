/**
 * 암합 참고 데이터 검증: 四柱 戊子年 丁亥月 壬寅日 戊子时 일 때
 * jijiRelation.amhap 이 참고(戊子,子戌,子戌 / 丑寅,丑寅,寅未,寅未 / 午亥,丁亥,午亥 / 戊子,子戌,子戌)와 일치하는지 확인
 */
import { enrichSajuWithResults } from '../src/services/saju.js';

const REFERENCE_AMHAP = {
  year: '戊子,子戌,子戌',
  month: '午亥,丁亥,午亥',
  day: '丑寅,丑寅,寅未,寅未',
  hour: '戊子,子戌,子戌',
};

const saju = {
  gapjaChinese: {
    year: '戊子年',
    month: '丁亥月',
    day: '壬寅日',
    hour: '戊子时',
  },
};

const enriched = enrichSajuWithResults(saju);
const jiji = enriched?.jijiRelation;

if (!jiji) {
  console.error('FAIL: jijiRelation is missing');
  process.exit(1);
}

let failed = false;
for (const key of ['year', 'month', 'day', 'hour']) {
  const actual = jiji[key]?.amhap ?? jiji[key]?.ko?.amhap;
  const expected = REFERENCE_AMHAP[key];
  if (actual !== expected) {
    console.error(`FAIL: ${key} amhap expected "${expected}", got "${actual}"`);
    failed = true;
  } else {
    console.log(`OK: ${key} amhap = ${actual}`);
  }
}

if (failed) process.exit(1);
console.log('Amhap reference verification passed.');
