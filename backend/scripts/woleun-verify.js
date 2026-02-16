/**
 * 월운(流月) 검증 — 1984.11.16 01:00 기준 참조 표와 비교
 * 참조: 1월=己丑 정재 정재 월살 관대 … 12월=庚子 편관 정인 년살 목욕 (당해년 丙年 기준)
 *
 * 실행: cd backend && node scripts/woleun-verify.js
 */
import { solarToSaju } from '../src/services/saju.js';

const birth = { date: '1984-11-16', time: '01:00', gender: 'M' };
const saju = solarToSaju(birth.date, birth.time, birth.gender);
if (!saju || !saju.woleun || saju.woleun.length !== 12) {
  console.error('FAIL: saju or woleun missing');
  process.exit(1);
}

const ref = [
  { month: 1, gapja: '己丑', chun: '정재', ji: '정재', sinsal: '월살', un: '관대' },
  { month: 2, gapja: '庚寅', chun: '편관', ji: '비견', sinsal: '망신살', un: '건록' },
  { month: 3, gapja: '辛卯', chun: '정관', ji: '겁재', sinsal: '장성살', un: '제왕' },
  { month: 4, gapja: '壬辰', chun: '편인', ji: '편재', sinsal: '반안살', un: '쇠' },
  { month: 5, gapja: '癸巳', chun: '정인', ji: '식신', sinsal: '역마살', un: '병' },
  { month: 6, gapja: '甲午', chun: '비견', ji: '상관', sinsal: '육해살', un: '사' },
  { month: 7, gapja: '乙未', chun: '겁재', ji: '정재', sinsal: '화개살', un: '묘' },
  { month: 8, gapja: '丙申', chun: '식신', ji: '편관', sinsal: '겁살', un: '절' },
  { month: 9, gapja: '丁酉', chun: '상관', ji: '정관', sinsal: '재살', un: '태' },
  { month: 10, gapja: '戊戌', chun: '편재', ji: '편재', sinsal: '천살', un: '양' },
  { month: 11, gapja: '己亥', chun: '정재', ji: '편인', sinsal: '지살', un: '장생' },
  { month: 12, gapja: '庚子', chun: '편관', ji: '정인', sinsal: '년살', un: '목욕' },
];

console.log('=== 월운 검증 (1984.11.16 01:00 남, 당해년 기준) ===\n');
console.log('일간(日干):', saju.gapjaChinese?.day?.[0], '\n');

const byMonth = Object.fromEntries(saju.woleun.map((w) => [w.month, w]));
let ok = 0;
let fail = 0;

console.log('월 | 우리 간지 | 참조 간지 | 우리 천간십성 | 참조 천간십성 | 우리 지지십성 | 참조 지지십성 | 우리 신살 | 참조 신살 | 우리 12운성 | 참조 12운성');
console.log('-'.repeat(120));

for (const r of ref) {
  const w = byMonth[r.month];
  if (!w) {
    console.log(r.month + '월 | - | ' + r.gapja + ' | - | ' + r.chun + ' | - | ' + r.ji + ' | - | ' + r.sinsal + ' | - | ' + r.un);
    fail++;
    continue;
  }
  const gapjaOk = w.gapja === r.gapja;
  const chunOk = w.sipseong?.ko === r.chun;
  const jiOk = w.sipseongJi?.ko === r.ji;
  const sinsalOk = w.sinsal === r.sinsal;
  const unOk = w.unseong12?.ko === r.un;
  if (gapjaOk && chunOk && jiOk && sinsalOk && unOk) ok++;
  else fail++;
  const g = gapjaOk ? '✓' : '✗';
  const c = chunOk ? '✓' : '✗';
  const j = jiOk ? '✓' : '✗';
  const s = sinsalOk ? '✓' : '✗';
  const u = unOk ? '✓' : '✗';
  console.log(
    r.month + '월 | ' + w.gapja + ' ' + g + ' | ' + r.gapja + ' | ' + (w.sipseong?.ko ?? '-') + ' ' + c + ' | ' + r.chun + ' | ' + (w.sipseongJi?.ko ?? '-') + ' ' + j + ' | ' + r.ji + ' | ' + (w.sinsal ?? '-') + ' ' + s + ' | ' + r.sinsal + ' | ' + (w.unseong12?.ko ?? '-') + ' ' + u + ' | ' + r.un
  );
}

console.log('\n--- 요약 ---');
console.log('일치:', ok, '/ 12');
if (fail > 0) {
  console.error('불일치:', fail);
  process.exit(1);
}
console.log('월운 검증 통과 (참조 표와 일치)');
