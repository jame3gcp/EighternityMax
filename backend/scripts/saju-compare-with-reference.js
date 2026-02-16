/**
 * 우리 만세력 결과 vs 참조(README·검색·수동) 비교
 * 실행: cd backend && node scripts/saju-compare-with-reference.js
 * 참조 사이트: https://beta-ybz6.onrender.com/
 */
import { solarToSaju, lunarToSaju } from '../src/services/saju.js';
import { TEST_CASES } from './saju-compare-test-data.js';

function runOurSaju(case_) {
  const { birthDate, birthTime, calendarType, isIntercalation, gender } = case_.input;
  if (calendarType === 'lunar') {
    return lunarToSaju(birthDate, !!isIntercalation, birthTime || undefined, gender);
  }
  return solarToSaju(birthDate, birthTime || undefined, gender);
}

function comparePillar(ours, ref, key) {
  if (ref == null || ref[key] == null) return { match: null, ours, ref: '-' };
  const o = ours?.[key];
  const r = ref[key];
  const match = o === r;
  return { match, ours: o ?? '-', ref: r };
}

function compareLunar(ours, ref) {
  if (!ref?.lunar) return { match: null };
  const o = ours?.lunar;
  const r = ref.lunar;
  if (!o || !r) return { match: null };
  const match =
    o.year === r.year && o.month === r.month && o.day === r.day && !!o.intercalation === !!r.intercalation;
  return { match, ours: `${o.year}-${o.month}-${o.day}${o.intercalation ? '(윤)' : ''}`, ref: `${r.year}-${r.month}-${r.day}${r.intercalation ? '(윤)' : ''}` };
}

function compareSolar(ours, ref) {
  if (!ref?.solar) return { match: null };
  const o = ours?.solar;
  const r = ref.solar;
  if (!o || !r) return { match: null };
  const match = o.year === r.year && o.month === r.month && o.day === r.day;
  return { match, ours: o ? `${o.year}-${o.month}-${o.day}` : '-', ref: `${r.year}-${r.month}-${r.day}` };
}

const results = [];
let passed = 0;
let failed = 0;
let skipped = 0;

for (const case_ of TEST_CASES) {
  const ours = runOurSaju(case_);
  const ref = case_.reference;
  const row = {
    id: case_.id,
    description: case_.description,
    input: case_.input,
    ours: ours
      ? {
          gapjaKorean: ours.gapjaKorean,
          gapjaChinese: ours.gapjaChinese,
          lunar: ours.lunar,
          solar: ours.solar,
          gender: ours.gender,
          birthTime: ours.birthTime,
          ohang: ours.ohang,
          sipseong: ours.sipseong,
          unseong12: ours.unseong12,
        }
      : null,
    comparisons: [],
    allMatch: null,
  };

  if (!ours) {
    row.allMatch = false;
    failed++;
    results.push(row);
    continue;
  }

  if (ref.lunar) {
    const c = compareLunar(ours, ref);
    row.comparisons.push({ name: '음력', ...c });
  }
  if (ref.solar) {
    const c = compareSolar(ours, ref);
    row.comparisons.push({ name: '양력', ...c });
  }
  if (ref.gapjaKorean) {
    for (const key of ['year', 'month', 'day', 'hour']) {
      if (ref.gapjaKorean[key] != null) {
        const c = comparePillar(ours.gapjaKorean, ref.gapjaKorean, key);
        row.comparisons.push({ name: `간지(한) ${key}`, ...c });
      }
    }
  }
  if (ref.gapjaChinese) {
    for (const key of ['year', 'month', 'day', 'hour']) {
      if (ref.gapjaChinese[key] != null) {
        const c = comparePillar(ours.gapjaChinese, ref.gapjaChinese, key);
        row.comparisons.push({ name: `간지(중) ${key}`, ...c });
      }
    }
  }
  if (ref.ohangDistribution) {
    const dist = ours.ohang?.distribution;
    for (const key of ['목', '화', '토', '금', '수']) {
      const o = dist?.[key];
      const r = ref.ohangDistribution[key];
      const match = o != null && r != null ? o === r : null;
      row.comparisons.push({ name: `오행 ${key}`, match, ours: o ?? '-', ref: r ?? '-' });
    }
  }
  if (ref.sipseongKo) {
    for (const key of ['year', 'month', 'day', 'hour']) {
      if (ref.sipseongKo[key] != null) {
        const o = ours.sipseong?.[key]?.ko;
        const r = ref.sipseongKo[key];
        const match = o != null && r != null ? o === r : null;
        row.comparisons.push({ name: `십성(한) ${key}`, match, ours: o ?? '-', ref: r ?? '-' });
      }
    }
  }

  const allChecked = row.comparisons.filter((c) => c.match !== null);
  if (allChecked.length === 0) {
    row.allMatch = null;
    skipped++;
  } else {
    const allMatch = allChecked.every((c) => c.match === true);
    row.allMatch = allMatch;
    if (allMatch) passed++;
    else failed++;
  }
  results.push(row);
}

// Report
const lines = [
  '# 만세력 테스트 비교 결과',
  '',
  '참조: korean-lunar-calendar README(KARI), 웹 검색, [beta-ybz6.onrender.com](https://beta-ybz6.onrender.com/)',
  '',
  '## 요약',
  '',
  `| 구분 | 건수 |`,
  `|------|------|`,
  `| 일치 | ${passed} |`,
  `| 불일치 | ${failed} |`,
  `| 참조 없음(수동 확인) | ${skipped} |`,
  '',
  '## 참조 사이트와 수동 비교용 입력',
  '',
  '[beta-ybz6.onrender.com](https://beta-ybz6.onrender.com/)에서 아래와 같이 입력한 뒤, 사주 4주(연·월·일·시주)를 우리 결과와 비교하면 됩니다.',
  '',
  '| 케이스 | 양력/음력 | 생년월일 | 시간 | 성별 |',
  '|--------|-----------|----------|------|------|',
];

for (const t of TEST_CASES) {
  const cal = t.input.calendarType === 'lunar' ? '음력' : '양력';
  const date = t.input.birthDate;
  const time = t.input.birthTime || '-';
  const gender = t.input.gender === 'M' ? '남' : t.input.gender === 'F' ? '여' : '-';
  lines.push(`| ${t.id} | ${cal} | ${date} | ${time} | ${gender} |`);
}
lines.push('');
lines.push('## 케이스별 결과');
lines.push('');

for (const r of results) {
  lines.push(`### ${r.id}: ${r.description}`);
  lines.push('');
  lines.push('**입력**');
  lines.push('```json');
  lines.push(JSON.stringify(r.input, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('**우리 결과**');
  if (r.ours) {
    lines.push('- 연주(한): ' + (r.ours.gapjaKorean?.year ?? '-'));
    lines.push('- 월주(한): ' + (r.ours.gapjaKorean?.month ?? '-'));
    lines.push('- 일주(한): ' + (r.ours.gapjaKorean?.day ?? '-'));
    lines.push('- 시주(한): ' + (r.ours.gapjaKorean?.hour ?? '-'));
    lines.push('- 연주(중): ' + (r.ours.gapjaChinese?.year ?? '-'));
    lines.push('- 월주(중): ' + (r.ours.gapjaChinese?.month ?? '-'));
    lines.push('- 일주(중): ' + (r.ours.gapjaChinese?.day ?? '-'));
    lines.push('- 시주(중): ' + (r.ours.gapjaChinese?.hour ?? '-'));
    lines.push('- 성별: ' + (r.ours.gender ?? '-'));
    if (r.ours.lunar) lines.push('- 음력: ' + `${r.ours.lunar.year}-${r.ours.lunar.month}-${r.ours.lunar.day}` + (r.ours.lunar.intercalation ? '(윤)' : ''));
    if (r.ours.solar) lines.push('- 양력: ' + `${r.ours.solar.year}-${r.ours.solar.month}-${r.ours.solar.day}`);
    if (r.ours.ohang?.distribution) lines.push('- 오행분포: 목' + (r.ours.ohang.distribution.목 ?? 0) + ' 화' + (r.ours.ohang.distribution.화 ?? 0) + ' 토' + (r.ours.ohang.distribution.토 ?? 0) + ' 금' + (r.ours.ohang.distribution.금 ?? 0) + ' 수' + (r.ours.ohang.distribution.수 ?? 0));
    if (r.ours.sipseong) lines.push('- 십성: 연' + (r.ours.sipseong.year?.ko ?? '-') + ' 월' + (r.ours.sipseong.month?.ko ?? '-') + ' 일' + (r.ours.sipseong.day?.ko ?? '-') + ' 시' + (r.ours.sipseong.hour?.ko ?? '-'));
    if (r.ours.unseong12) lines.push('- 12운성: 연' + (r.ours.unseong12.year?.ko ?? '-') + ' 월' + (r.ours.unseong12.month?.ko ?? '-') + ' 일' + (r.ours.unseong12.day?.ko ?? '-') + ' 시' + (r.ours.unseong12.hour?.ko ?? '-'));
  } else {
    lines.push('- (계산 실패)');
  }
  lines.push('');
  lines.push('**비교**');
  if (r.comparisons.length > 0) {
    lines.push('| 항목 | 우리 | 참조 | 일치 |');
    lines.push('|------|------|------|------|');
    for (const c of r.comparisons) {
      const ok = c.match === true ? 'O' : c.match === false ? 'X' : '-';
      lines.push(`| ${c.name} | ${c.ours} | ${c.ref} | ${ok} |`);
    }
    lines.push('');
    lines.push('**결과**: ' + (r.allMatch === true ? 'O 일치' : r.allMatch === false ? 'X 불일치' : '수동 확인 필요'));
  } else {
    lines.push('- 참조: ' + (TEST_CASES.find((t) => t.id === r.id)?.reference?.source ?? '수동 확인'));
    lines.push('- **결과**: 참조 사이트에서 동일 입력 후 연/월/일/시주 비교 권장');
  }
  lines.push('');
}

const reportPath = new URL('../../docs/SAJU_COMPARE_RESULT.md', import.meta.url);
await import('fs').then((fs) => fs.promises.writeFile(reportPath.pathname, lines.join('\n'), 'utf-8'));

console.log('=== 만세력 참조 비교 테스트 ===\n');
console.log('요약: 일치 ' + passed + ', 불일치 ' + failed + ', 수동확인 ' + skipped);
console.log('');
for (const r of results) {
  const status = r.allMatch === true ? 'O' : r.allMatch === false ? 'X' : '?';
  console.log(`[${status}] ${r.id}: ${r.description}`);
  if (r.allMatch === false && r.comparisons.length) {
    r.comparisons.filter((c) => c.match === false).forEach((c) => console.log(`    불일치: ${c.name} ours=${c.ours} ref=${c.ref}`));
  }
}
console.log('\n상세 보고서: docs/SAJU_COMPARE_RESULT.md');
process.exit(failed > 0 ? 1 : 0);
