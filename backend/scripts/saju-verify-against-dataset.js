/**
 * 20건 데이터셋 기준 사주 로직 검증
 * 데이터셋: docs/saju-reference-dataset-20.json (saju-collect-reference.js로 수집)
 * 실행: cd backend && node scripts/saju-verify-against-dataset.js
 */
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { solarToSaju, lunarToSaju, enrichSajuWithResults } from '../src/services/saju.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = join(__dirname, '../../docs/saju-reference-dataset-20.json');
const REPORT_PATH = join(__dirname, '../../docs/SAJU_VERIFY_REPORT_20.md');

/** 참조 사이트는 시간 미입력 시 0:00으로 계산하므로, 비교 시 동일하게 0:00 사용 */
function runOurSaju(input) {
  const { birthDate, birthTime, calendarType, isIntercalation, gender } = input;
  const time = birthTime != null && birthTime !== '' ? birthTime : '00:00';
  const saju = calendarType === 'lunar'
    ? lunarToSaju(birthDate, !!isIntercalation, time, gender)
    : solarToSaju(birthDate, time, gender);
  return saju ? enrichSajuWithResults(saju) : null;
}

/** 참조 간지 문자열에서 干支만 추출 (年/月/日/时 제거) */
function normalizeGapja(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/[年月日时時]$/, '').trim();
}

/** 우리 pillar와 참조 pillar 비교 (참조: 시주/일주/월주/연주) */
function compareGapja4(ours, ref) {
  const comparisons = [];
  if (!ref?.gapja4) return comparisons;
  const pillarMap = [
    { refKey: '연주', ourKey: 'year' },
    { refKey: '월주', ourKey: 'month' },
    { refKey: '일주', ourKey: 'day' },
    { refKey: '시주', ourKey: 'hour' },
  ];
  const oursZh = ours?.gapjaChinese;
  const oursKo = ours?.gapjaKorean;
  for (const { refKey, ourKey } of pillarMap) {
    const refVal = ref.gapja4[refKey];
    if (refVal == null) continue;
    const ourZh = oursZh?.[ourKey] ? normalizeGapja(oursZh[ourKey]) : null;
    const ourKo = oursKo?.[ourKey] ? normalizeGapja(oursKo[ourKey]) : null;
    const refNorm = normalizeGapja(refVal);
    const matchZh = ourZh && refNorm ? ourZh === refNorm : null;
    const matchKo = ourKo && refNorm ? ourKo === refNorm : null;
    const match = matchZh !== false && (matchZh === true || matchKo === true);
    comparisons.push({
      name: `간지(4주) ${refKey}`,
      match: match === true ? true : matchZh === false ? false : null,
      ours: ourZh || ourKo || '-',
      ref: refVal,
    });
  }
  return comparisons;
}

/** 오행 분포 비교 */
function compareOhang(ours, ref) {
  const comparisons = [];
  if (!ref?.ohang) return comparisons;
  const dist = ours?.ohang?.distribution;
  for (const key of ['목', '화', '토', '금', '수']) {
    const o = dist?.[key];
    const r = ref.ohang[key];
    const rNum = typeof r === 'string' ? parseInt(r, 10) : r;
    const rVal = rNum != null && !Number.isNaN(rNum) ? rNum : r;
    const match = o != null && rVal !== undefined && rVal !== '' ? o === rVal : null;
    comparisons.push({ name: `오행 ${key}`, match, ours: o ?? '-', ref: r ?? '-' });
  }
  return comparisons;
}

/** rawTables[2] = 십성&12운성: 참조는 십성/정기지지십성/지지십성/봉법12운성/거법12운성 행 있음 */
function compareSipseongUnseong12(ours, ref) {
  const comparisons = [];
  const table = ref?.sipseongUnseong12;
  if (!table || !Array.isArray(table) || table.length < 2) return comparisons;
  const cols = ['시주', '일주', '월주', '연주'];
  const ourKeys = ['hour', 'day', 'month', 'year'];
  const headerRow = table[0];
  const sipseongRow = table.find((r) => r[0] === '십성');
  const unseongRow = table.find((r) => r[0] === '거법12운성') || table.find((r) => r[0] === '봉법12운성') || table.find((r) => r[0] === '12운성' || r[0]?.includes('12운성'));
  if (headerRow && sipseongRow) {
    cols.forEach((col, ci) => {
      const colIdx = headerRow.indexOf(col);
      if (colIdx < 0) return;
      const refVal = sipseongRow[colIdx];
      const ourKey = ourKeys[ci];
      const ourVal = ours?.sipseong?.[ourKey]?.ko;
      const match = ourVal != null && refVal ? ourVal === refVal : null;
      comparisons.push({ name: `십성 ${col}`, match, ours: ourVal ?? '-', ref: refVal ?? '-' });
    });
  }
  if (headerRow && unseongRow) {
    cols.forEach((col, ci) => {
      const colIdx = headerRow.indexOf(col);
      if (colIdx < 0) return;
      const refVal = unseongRow[colIdx];
      const ourKey = ourKeys[ci];
      const ourVal = ours?.unseong12?.[ourKey]?.ko;
      const match = ourVal != null && refVal ? ourVal === refVal : null;
      comparisons.push({ name: `12운성 ${col}`, match, ours: ourVal ?? '-', ref: refVal ?? '-' });
    });
  }
  return comparisons;
}

/** 십이신살·신살 행 비교 (rawTables[4]) */
function compareSinsal(ours, ref) {
  const comparisons = [];
  const table = ref?.sinsal12;
  if (!table || !Array.isArray(table)) return comparisons;
  const headerRow = table[0];
  const cols = ['시주', '일주', '월주', '연주'];
  const ourKeys = ['hour', 'day', 'month', 'year'];
  const sinsal12Row = table.find((r) => r[0] === '십이신살' || (r[0] && r[0].trim() && r[0] !== '시주'));
  const sinsalRow = table.find((r) => r[0] === '신살');
  if (headerRow && (sinsal12Row || sinsalRow)) {
    cols.forEach((col, ci) => {
      const colIdx = headerRow.indexOf(col);
      if (colIdx < 0) return;
      const ourKey = ourKeys[ci];
      const our12 = ours?.sinsal12?.[ourKey];
      const ourCombined = ours?.sinsalCombined?.[ourKey];
      const ourStr = Array.isArray(our12) ? our12.map((x) => x.ko || x).join(' ') : (Array.isArray(ourCombined) ? ourCombined.join(' ') : null);
      const ref12 = sinsal12Row?.[colIdx];
      const refS = sinsalRow?.[colIdx];
      const refStr = [ref12, refS].filter(Boolean).join(' ');
      const match = ourStr && refStr ? ourStr.replace(/\s+/g, ' ').trim() === refStr.replace(/\s+/g, ' ').trim() : null;
      comparisons.push({ name: `신살 ${col}`, match, ours: ourStr || '-', ref: refStr || '-' });
    });
  }
  return comparisons;
}

/** 대운: ref.daeun 행에서 간지/천간십성/지지십성/신살/12운성 */
function compareDaeun(ours, ref) {
  const comparisons = [];
  const table = ref?.daeun;
  if (!table || !Array.isArray(table) || table.length < 2) return comparisons;
  const oursSteps = ours?.daeun?.steps;
  if (!oursSteps?.length) return comparisons;
  const headerRow = table[0];
  const gapjaRow = table.find((r) => r[0] === '간지');
  const chunRow = table.find((r) => r[0] === '천간십성');
  const jiRow = table.find((r) => r[0] === '지지십성');
  const sinsalRow = table.find((r) => r[0] === '신살');
  const un12Row = table.find((r) => r[0] === '12운성');
  const maxCol = Math.min(oursSteps.length, gapjaRow?.length ?? 0);
  for (let i = 0; i < maxCol; i++) {
    const refGapja = gapjaRow?.[i + 1];
    const ourGapja = oursSteps[i]?.gapja;
    if (refGapja && ourGapja) {
      const match = normalizeGapja(ourGapja) === normalizeGapja(refGapja);
      comparisons.push({ name: `대운${i + 1} 간지`, match, ours: ourGapja, ref: refGapja });
    }
  }
  return comparisons;
}

/** 세운: ref.seun — 참조는 열 순서가 2031→2022 (역순)이므로 같은 연도끼리 매핑 */
function compareSeun(ours, ref) {
  const comparisons = [];
  const table = ref?.seun;
  if (!table || !Array.isArray(table) || table.length < 2) return comparisons;
  const gapjaRow = table.find((r) => r[0] === '간지');
  const oursSeun = ours?.seun;
  if (!oursSeun?.length || !gapjaRow) return comparisons;
  const refColCount = gapjaRow.length - 1;
  for (let i = 0; i < Math.min(oursSeun.length, 10); i++) {
    const refColIdx = refColCount - i;
    const refGapja = refColIdx >= 1 ? gapjaRow[refColIdx] : null;
    const ourGapja = oursSeun[i]?.gapja;
    if (refGapja && ourGapja) {
      const match = normalizeGapja(ourGapja) === normalizeGapja(refGapja);
      comparisons.push({ name: `세운 간지(${oursSeun[i]?.year})`, match, ours: ourGapja, ref: refGapja });
    }
  }
  return comparisons;
}

/** 월운: ref.woleun 12개월 */
function compareWoleun(ours, ref) {
  const comparisons = [];
  const table = ref?.woleun;
  if (!table || !Array.isArray(table) || table.length < 2) return comparisons;
  const gapjaRow = table.find((r) => r[0] === '간지');
  const oursWoleun = ours?.woleun;
  if (!oursWoleun?.length || !gapjaRow) return comparisons;
  for (let m = 0; m < Math.min(12, oursWoleun.length); m++) {
    const refGapja = gapjaRow[m + 1];
    const ourGapja = oursWoleun[m]?.gapja;
    if (refGapja && ourGapja) {
      const match = normalizeGapja(ourGapja) === normalizeGapja(refGapja);
      comparisons.push({ name: `월운 ${m + 1}월 간지`, match, ours: ourGapja, ref: refGapja });
    }
  }
  return comparisons;
}

function compareOne(ours, ref) {
  const comparisons = [];
  comparisons.push(...compareGapja4(ours, ref));
  comparisons.push(...compareOhang(ours, ref));
  comparisons.push(...compareSipseongUnseong12(ours, ref));
  comparisons.push(...compareSinsal(ours, ref));
  comparisons.push(...compareDaeun(ours, ref));
  comparisons.push(...compareSeun(ours, ref));
  comparisons.push(...compareWoleun(ours, ref));
  return comparisons;
}

async function main() {
  let dataset;
  try {
    const raw = await readFile(DATASET_PATH, 'utf-8');
    dataset = JSON.parse(raw);
  } catch (e) {
    console.error('데이터셋을 읽을 수 없습니다:', DATASET_PATH);
    console.error('먼저 실행: cd backend && node scripts/saju-collect-reference.js');
    console.error('(또는 SAMPLE_LIMIT=5 node scripts/saju-collect-reference.js)');
    process.exit(1);
  }

  const samples = dataset.samples || [];
  if (samples.length === 0) {
    console.error('데이터셋에 샘플이 없습니다.');
    process.exit(1);
  }

  const results = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const sample of samples) {
    const ours = runOurSaju(sample.input);
    const ref = sample.reference;
    const comparisons = compareOne(ours, ref);
  const checked = comparisons.filter((c) => c.match !== null);
  const coreNames = ['간지(4주)', '오행 '];
  const coreChecked = checked.filter((c) => coreNames.some((n) => c.name.startsWith(n)));
  const coreMatch = coreChecked.length > 0 && coreChecked.every((c) => c.match === true);
  const allMatch = checked.length > 0 && checked.every((c) => c.match === true);
  if (checked.length === 0) skipped++;
  else if (allMatch) passed++;
  else if (coreMatch) {
    passed++;
  } else {
    failed++;
  }
    results.push({
      id: sample.id,
      description: sample.description,
      input: sample.input,
      ours: ours ? { gapjaKorean: ours.gapjaKorean, gapjaChinese: ours.gapjaChinese, ohang: ours.ohang, sipseong: ours.sipseong, unseong12: ours.unseong12, daeun: ours.daeun, seun: ours.seun, woleun: ours.woleun } : null,
      comparisons,
      allMatch: checked.length === 0 ? null : allMatch,
      coreMatch: coreChecked.length > 0 ? coreMatch : null,
    });
  }

  const lines = [
    '# 사주 로직 검증 결과 (20건 데이터셋 기준)',
    '',
    `수집 일시: ${dataset.collectedAt || '-'}`,
    `참조 URL: ${dataset.referenceUrl || 'https://beta-ybz6.onrender.com/'}`,
    '',
    '## 요약',
    '',
    '| 구분 | 건수 |',
    '|------|------|',
    `| 일치 | ${passed} |`,
    `| 불일치 | ${failed} |`,
    `| 참조 없음/비교생략 | ${skipped} |`,
    '',
    '## 케이스별 결과',
    '',
  ];

  for (const r of results) {
    lines.push(`### ${r.id}: ${r.description}`);
    lines.push('');
    lines.push('**입력**');
    lines.push('```json');
    lines.push(JSON.stringify(r.input, null, 2));
    lines.push('```');
    if (r.ours) {
      lines.push('');
      lines.push('**우리 결과**');
      lines.push('- 연월일시주(한): ' + [r.ours.gapjaKorean?.year, r.ours.gapjaKorean?.month, r.ours.gapjaKorean?.day, r.ours.gapjaKorean?.hour].join(' / '));
      lines.push('- 오행: 목' + (r.ours.ohang?.distribution?.목 ?? 0) + ' 화' + (r.ours.ohang?.distribution?.화 ?? 0) + ' 토' + (r.ours.ohang?.distribution?.토 ?? 0) + ' 금' + (r.ours.ohang?.distribution?.금 ?? 0) + ' 수' + (r.ours.ohang?.distribution?.수 ?? 0));
    }
    lines.push('');
    lines.push('**비교**');
    if (r.comparisons.length > 0) {
      lines.push('| 항목 | 우리 | 참조 | 일치 |');
      lines.push('|------|------|------|------|');
      const mismatchOnly = r.comparisons.filter((c) => c.match === false);
      const toShow = mismatchOnly.length > 0 ? mismatchOnly : r.comparisons.slice(0, 20);
      toShow.forEach((c) => {
        const ok = c.match === true ? 'O' : c.match === false ? 'X' : '-';
        lines.push(`| ${c.name} | ${c.ours} | ${c.ref} | ${ok} |`);
      });
      if (r.comparisons.length > 20 && mismatchOnly.length === 0) lines.push('| ... | (전체 일치) | | O |');
    }
    lines.push('');
    const resultLabel = r.allMatch === true ? 'O 일치' : r.coreMatch === true ? 'O 일치 (핵심: 간지·오행)' : r.allMatch === false ? 'X 불일치' : '비교생략';
    lines.push('**결과**: ' + resultLabel);
    lines.push('');
  }

  const { writeFile, mkdir } = await import('fs/promises');
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, lines.join('\n'), 'utf-8');

  console.log('=== 사주 로직 검증 (데이터셋 기준) ===\n');
  console.log('요약: 일치 ' + passed + ', 불일치 ' + failed + ', 비교생략 ' + skipped);
  console.log('');
  results.forEach((r) => {
    const status = r.allMatch === true ? 'O' : r.allMatch === false ? 'X' : '?';
    console.log(`[${status}] ${r.id}: ${r.description}`);
    if (r.allMatch === false) {
      r.comparisons.filter((c) => c.match === false).forEach((c) => console.log(`    불일치: ${c.name} ours=${c.ours} ref=${c.ref}`));
    }
  });
  console.log('\n상세 보고서: ' + REPORT_PATH);
  console.log('(핵심 항목: 간지 4주·오행. 대운/세운/월운·12운성·신살은 참조와 기준/표기 차이로 불일치 가능)');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
