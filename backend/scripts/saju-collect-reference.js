/**
 * 참조 사이트(https://beta-ybz6.onrender.com/)에서 20건 샘플 결과 수집
 * 실행: cd backend && npx playwright install chromium && node scripts/saju-collect-reference.js
 *
 * 결과: docs/saju-reference-dataset-20.json
 */
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { VERIFY_SAMPLES_20 } from './saju-verify-samples-20.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_LIMIT = parseInt(process.env.SAMPLE_LIMIT || '20', 10);
const SAMPLES = SAMPLE_LIMIT <= 0 ? VERIFY_SAMPLES_20 : VERIFY_SAMPLES_20.slice(0, SAMPLE_LIMIT);
const REF_URL = 'https://beta-ybz6.onrender.com/';
const OUT_PATH = join(__dirname, '../../docs/saju-reference-dataset-20.json');

function parseInput(input) {
  const [y, m, d] = input.birthDate.split('-').map(Number);
  let h = 0;
  let min = 0;
  if (input.birthTime) {
    const [hh, mm] = input.birthTime.split(':').map(Number);
    h = hh;
    min = mm || 0;
  }
  return {
    year: y,
    month: m,
    day: d,
    hour: h,
    minute: min,
    solar: input.calendarType === 'solar',
    lunar: input.calendarType === 'lunar',
    intercalation: !!input.isIntercalation,
    male: input.gender === 'M',
    female: input.gender === 'F',
  };
}

/**
 * 페이지에서 결과 영역의 모든 테이블을 추출해 구조화된 객체로 반환
 */
function extractResultScript() {
  return () => {
    const tables = document.querySelectorAll('table');
    const result = {
      gapja4: null,
      ohang: null,
      sipseongUnseong12: null,
      jijiRelation: null,
      sinsal12: null,
      daeun: null,
      seun: null,
      woleun: null,
      rawTables: [],
    };
    tables.forEach((table, idx) => {
      const rows = [];
      table.querySelectorAll('tr').forEach((tr) => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach((th) => cells.push((th.textContent || '').trim()));
        if (cells.length) rows.push(cells);
      });
      result.rawTables.push(rows);
    });
    // 첫 번째 테이블: 사주 4주 (헤더 시주|일주|월주|연주, 다음 행 값)
    if (result.rawTables[0]?.length >= 2) {
      const header = result.rawTables[0][0];
      const values = result.rawTables[0][1];
      result.gapja4 = {};
      header.forEach((k, i) => {
        if (values[i] && values[i] !== '-') result.gapja4[k] = values[i];
      });
    }
    // 두 번째: 오행 (목|화|토|금|수)
    if (result.rawTables[1]?.length >= 2) {
      const header = result.rawTables[1][0];
      const values = result.rawTables[1][1];
      result.ohang = {};
      header.forEach((k, i) => {
        const v = values[i];
        if (v !== undefined && v !== '-') result.ohang[k] = v;
      });
    }
    // 십성 & 12운성: 구분 행 + 시주/일주/월주/연주 열
    if (result.rawTables[2]) {
      result.sipseongUnseong12 = result.rawTables[2];
    }
    // 지지형충회합
    if (result.rawTables[3]) {
      result.jijiRelation = result.rawTables[3];
    }
    // 십이신살, 신살
    if (result.rawTables[4]) {
      result.sinsal12 = result.rawTables[4];
    }
    // 대운
    if (result.rawTables[5]) {
      result.daeun = result.rawTables[5];
    }
    // 세운
    if (result.rawTables[6]) {
      result.seun = result.rawTables[6];
    }
    // 월운
    if (result.rawTables[7]) {
      result.woleun = result.rawTables[7];
    }
    return result;
  };
}

async function main() {
  const collected = {
    collectedAt: new Date().toISOString(),
    referenceUrl: REF_URL,
    samples: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (let i = 0; i < SAMPLES.length; i++) {
    const sample = SAMPLES[i];
    const p = parseInput(sample.input);
    console.log(`[${i + 1}/${SAMPLES.length}] ${sample.id} ${sample.input.birthDate} ${sample.input.birthTime || '-'} ${sample.input.calendarType} ${sample.input.gender}`);

    await page.goto(REF_URL, { waitUntil: 'networkidle', timeout: 30000 });

    await page.locator('#y').fill(String(p.year));
    await page.locator('#m').fill(String(p.month));
    await page.locator('#d').fill(String(p.day));
    await page.locator('#hh').fill(String(p.hour));
    await page.locator('#mm').fill(String(p.minute));

    const calendarSelect = page.locator('select').first();
    await calendarSelect.selectOption(p.solar ? '양력' : '음력');

    if (p.lunar && p.intercalation) {
      const yundal = page.locator('input[type="checkbox"]').first();
      await yundal.check().catch(() => {});
    }

    if (p.male) {
      await page.locator('input[value="M"]').check().catch(() => {});
      await page.getByText('남자').first().click().catch(() => {});
    } else {
      await page.locator('input[value="F"]').check().catch(() => {});
      await page.getByText('여자').first().click().catch(() => {});
    }

    await page.getByRole('button', { name: '계산하기' }).click();

    await page.waitForTimeout(1500);

    const ref = await page.evaluate(extractResultScript());
    collected.samples.push({
      id: sample.id,
      description: sample.description,
      input: sample.input,
      reference: ref,
    });
  }

  await browser.close();

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(collected, null, 2), 'utf-8');
  console.log('Written:', OUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
