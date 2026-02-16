/**
 * 만세력(사주) 계산 검증 스크립트
 * korean-lunar-calendar README 기준값(KARI/한국천문연구원)과 비교
 *
 * 실행: cd backend && node scripts/verify-saju.js
 * 참조: https://beta-ybz6.onrender.com/ (동일 날짜 입력 후 연주/월주/일주 비교 권장)
 */
import { solarToSaju, lunarToSaju } from '../src/services/saju.js';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

console.log('=== 만세력 계산 검증 (한국천문연구원 기준) ===\n');

// 1. 양력 → 음력 + 간지 (korean-lunar-calendar README 예시)
// 2017-06-24 (양력) → 음력 2017년 5월 1일 (윤달), 정유년 병오월 임오일
const r1 = solarToSaju('2017-06-24');
assert(r1, 'solarToSaju(2017-06-24) should return result');
assert(r1.lunar?.year === 2017 && r1.lunar?.month === 5 && r1.lunar?.day === 1, 'Lunar date should be 2017-05-01');
assert(r1.lunar?.intercalation === true, 'May 2017 should be intercalation (윤달)');
assert(r1.gapjaKorean?.year === '정유년', 'Year gapja should be 정유년');
assert(r1.gapjaKorean?.month === '병오월', 'Month gapja should be 병오월');
assert(r1.gapjaKorean?.day === '임오일', 'Day gapja should be 임오일');
assert(r1.gapjaChinese?.year === '丁酉年' && r1.gapjaChinese?.month === '丙午月' && r1.gapjaChinese?.day === '壬午日', 'Chinese gapja should match');
console.log('1. 양력 2017-06-24 → 음력 2017-05-01(윤달), 정유년 병오월 임오일: OK');

// 2. 음력 → 양력 + 간지 (korean-lunar-calendar README 예시)
// 1956-01-21 (음력, 평달) → 양력 1956-03-03, 병신년 경인월 기사일
const r2 = lunarToSaju('1956-01-21', false);
assert(r2, 'lunarToSaju(1956-01-21, false) should return result');
assert(r2.solar?.year === 1956 && r2.solar?.month === 3 && r2.solar?.day === 3, 'Solar date should be 1956-03-03');
assert(r2.gapjaKorean?.year === '병신년', 'Year gapja should be 병신년');
assert(r2.gapjaKorean?.month === '경인월', 'Month gapja should be 경인월');
assert(r2.gapjaKorean?.day === '기사일', 'Day gapja should be 기사일');
assert(r2.gapjaChinese?.year === '丙申年' && r2.gapjaChinese?.month === '庚寅月' && r2.gapjaChinese?.day === '己巳日', 'Chinese gapja should match');
console.log('2. 음력 1956-01-21(평달) → 양력 1956-03-03, 병신년 경인월 기사일: OK');

// 3. 양력 → 음력 (일반 날짜, 이중 검증: 양력→음력→양력 되돌리기)
const r3 = solarToSaju('1990-05-15');
assert(r3, 'solarToSaju(1990-05-15) should return result');
const back = lunarToSaju(
  `${r3.lunar.year}-${String(r3.lunar.month).padStart(2, '0')}-${String(r3.lunar.day).padStart(2, '0')}`,
  !!r3.lunar.intercalation
);
assert(back?.solar?.year === 1990 && back?.solar?.month === 5 && back?.solar?.day === 15, 'Round-trip solar→lunar→solar should match original');
console.log('3. 양력 1990-05-15 → 음력 → 양력 되돌리기 일치: OK');

// 4. 음력 윤달 round-trip
const r4 = lunarToSaju('2017-05-01', true); // 윤달
assert(r4, 'lunarToSaju(2017-05-01, true) should return result');
const r4Back = solarToSaju(`${r4.solar.year}-${String(r4.solar.month).padStart(2, '0')}-${String(r4.solar.day).padStart(2, '0')}`);
assert(r4Back?.lunar?.month === 5 && r4Back?.lunar?.day === 1 && r4Back?.lunar?.intercalation === true, 'Round-trip lunar(윤)→solar→lunar should match');
console.log('4. 음력 2017-05-01(윤달) → 양력 → 음력 되돌리기 일치: OK');

// 5. 시주·성별 포함
const r5 = solarToSaju('1990-05-15', '14:30', 'M');
assert(r5, 'solarToSaju with time and gender should return result');
assert(r5.gapjaKorean?.hour && r5.gapjaChinese?.hour, 'Hour pillar (시주) should be present');
assert(r5.gender === 'M', 'Gender should be stored');
assert(r5.birthTime === '14:30', 'Birth time should be stored');
console.log('5. 시주·성별 포함 (1990-05-15 14:30 M): OK');

console.log('\n=== 검증 완료: korean-lunar-calendar(KARI 기준)와 일치 ===');
console.log('참조 사이트와 비교: https://beta-ybz6.onrender.com/ 에서 동일 날짜·시간 입력 후');
console.log('  - 연주/월주/일주/시주 및 성별이 저장되는지 확인하세요.');
