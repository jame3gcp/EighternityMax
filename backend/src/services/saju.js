/**
 * 만세력/명리학 변환 서비스
 * 양력 생년월일(·시간)·성별 → 음력, 사주4주(연월일시), 간지, 오행, 십성, 12운성 변환
 */
import KoreanLunarCalendar from 'korean-lunar-calendar';

// 천간(10): 갑을병정무기경신임계 / 甲乙丙丁戊己庚辛壬癸
const CHEONGAN_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const CHEONGAN_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 지지(12): 자축인묘진사오미신유술해 / 子丑寅卯辰巳午未申酉戌亥
const JIJI_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const JIJI_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 오행(五行): 목0 화1 토2 금3 수4
const OHANG_KO = ['목', '화', '토', '금', '수'];
const OHANG_ZH = ['木', '火', '土', '金', '水'];
// 천간 → 오행 (0-9 → 0-4)
const CHEONGAN_TO_OHANG = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
// 지지 → 오행 (子0…亥11 → 0-4). 寅卯木 巳午火 辰戌丑未土 申酉金 亥子水
const JIJI_TO_OHANG = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 子水 丑土 寅卯木 辰土 巳午火 未土 申酉金 戌土 亥水

// 십성(十星): 비견0 겁재1 식신2 상관3 편재4 정재5 편관6 정관7 편인8 정인9
const SIPEONG_KO = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
const SIPEONG_ZH = ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];

// 12운성(十二運星)
const UNSEONG12_KO = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
const UNSEONG12_ZH = ['長生', '沐浴', '冠帶', '建祿', '帝旺', '衰', '病', '死', '墓', '絕', '胎', '養'];
// 長生 지지: 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯 → branch index
const CHANGSAENG_BRANCH = [11, 5, 2, 9, 2, 9, 4, 0, 8, 3];

// 천간 특수관계: 五合 (甲己 乙庚 丙辛 丁壬 戊癸), 冲 (甲庚 乙辛 丙壬 丁癸)
const WUHE_FIVE = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]]; // 五合: 甲己 乙庚 丙辛 丁壬 戊癸 (암합 藏干 合에 사용)
const CHEONGAN_HAP = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 5]]; // 合 pair indices (천간관계)
const CHEONGAN_CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9]]; // 冲 pair (戊己无冲)

// 지지 관계 (branch index 0-11). 六合/三合/冲/刑/害/破
const JIJI_YUKHAP = [[0, 1], [2, 11], [3, 9], [4, 8], [5, 7], [6, 10]]; // 子丑 寅亥 卯戌 辰酉 巳申 午未
const JIJI_SAMHAP = [[8, 0, 4], [11, 3, 10], [2, 6, 9], [5, 8, 1]]; // 申子辰水 亥卯未木 寅午戌火 巳酉丑金
const JIJI_BANHAP = [[8, 0], [0, 4], [11, 3], [3, 10], [2, 6], [6, 9], [5, 8], [8, 1]]; // 半合
const JIJI_CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]; // 子午 丑未 寅申 卯酉 辰戌 巳亥
const JIJI_HYENG = [[0, 3], [2, 5, 8], [1, 10, 9], [4], [6], [8], [11]]; // 子卯 寅巳申 丑未戌 辰自刑 午 酉 亥
const JIJI_HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]; // 子未 丑午 寅巳 卯辰 申亥 酉戌
const JIJI_PA = [[0, 9], [2, 11], [4, 1], [6, 3], [8, 5], [9, 10]]; // 破: 子酉 寅亥 辰丑 午卯 申巳 戌未 (酉=9)
const JIJI_GWEEMUN = [[0, 9], [2, 10], [5, 11]]; // 鬼门(귀문): 子酉 寅戌 巳亥 (참조·천라지망 기준)

// 지장간(地支藏干): 子癸 丑己癸辛 寅甲丙戊 卯乙 辰戊乙癸 巳丙戊庚 午丁己 未己丁乙 申庚壬戊 酉辛 戌戊辛丁 亥壬甲 → 천간 인덱스 배열
const JIJI_JANGAN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 4, 6], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
// 방합(方合): 寅卯辰 巳午未 申酉戌 亥子丑
const JIJI_BANGHAP = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
// 가합(假合/拱合): 寅戌 申辰 亥未 巳丑 (三合에서 중간 지지가 없을 때)
const JIJI_GAHAP = [[2, 9], [8, 4], [11, 7], [5, 1]];
// 암합(暗合): 참조 데이터와 동일한 고정 지지 쌍만 사용 — 子戌 丑寅 寅未 午亥 (藏干 五合: 癸戊 己甲 甲己 丁壬)
const JIJI_AMHAP = [[0, 10], [1, 2], [2, 7], [6, 11]]; // 子戌 丑寅 寅未 午亥

// 십이신살: 驿马/桃花/华盖 (年支或日支查). 申子辰→驿马寅/桃花酉/华盖辰, 寅午戌→驿马申/桃花卯/华盖戌, 巳酉丑→驿马亥/桃花午/华盖丑, 亥卯未→驿马巳/桃花子/华盖未
const SINSAL_SAMHAP = [[8, 0, 4], [2, 6, 9], [5, 8, 1], [11, 3, 10]]; // 申子辰 寅午戌 巳酉丑 亥卯未
const SINSAL_IKMA = [2, 8, 11, 5];   // 各局驿马支 index
const SINSAL_DOHWA = [8, 3, 6, 0];   // 各局桃花支 index
const SINSAL_HWAGAE = [4, 9, 1, 10]; // 各局华盖支 index
// 십이신살 행(참조): 천간십성 → 재살/지살/겁살. 1겁재→겁살, 4편재/5정재/6편관→재살, 7정관→지살
const SIPEONG_TO_SINSAL = [null, '겁살', null, null, '재살', '재살', '재살', '지살', null, null];
// 월운 신살(참조): 양력 1월~12월 고정. 1월=월살 2월=망신살 3월=장성살 4월=반안살 5월=역마살 6월=육해살 7월=화개살 8월=겁살 9월=재살 10월=천살 11월=지살 12월=년살
const WOLUN_SINSAL_KO = ['월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살', '겁살', '재살', '천살', '지살', '년살'];
// 세운(流年) 신살(참조): 流年地支 기준. 子→년살 丑→월살 寅→망신살 卯→장성살 辰→반안살 巳→역마살 午→육해살 未→화개살 申→겁살 酉→재살 戌→천살 亥→지살
const SEUN_SINSAL_BY_BRANCH = ['년살', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살', '겁살', '재살', '천살', '지살'];

/** 연도(서기) → 세운(流年) 지지 기준 신살. getProfile 응답 시 저장된 구 saju의 세운 신살 보정용 */
export function getSeunSinsalByYear(year) {
  if (year == null || !Number.isFinite(year)) return null;
  const i60 = ((year - 4) % 60 + 60) % 60;
  const branchIdx = i60 % 12;
  return SEUN_SINSAL_BY_BRANCH[branchIdx] ?? null;
}

/** 간지 한자(예: 丙子)에서 지지 인덱스(0–11). 대운/세운 신살 보정용 */
function branchIdxFromGapjaZh(gapjaZh) {
  if (!gapjaZh || typeof gapjaZh !== 'string' || gapjaZh.length < 2) return null;
  const zi = gapjaZh.charAt(1);
  const idx = JIJI_ZH.indexOf(zi);
  return idx >= 0 ? idx : null;
}

/** 대운(大运) 지지 기준 신살. getProfile 응답 시 저장된 구 saju의 대운 신살 보정용 (참조: 流年과 동일 地支→神煞) */
export function getDaeunSinsalByGapja(gapjaZh) {
  const branchIdx = branchIdxFromGapjaZh(gapjaZh);
  return branchIdx != null ? (SEUN_SINSAL_BY_BRANCH[branchIdx] ?? null) : null;
}
// 월덕귀인(天乙贵人): 甲戊丑未 乙己子申 丙丁亥酉 庚辛寅午 壬癸卯巳 → 일간 인덱스 → [지지 인덱스]
const GWEEIN_BRANCHES = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [2, 6], [2, 6], [3, 5], [3, 5]];

/** 60甲子 인덱스(0-59) from (stemIdx, branchIdx) */
function pillarTo60(stemIdx, branchIdx) {
  if (stemIdx == null || branchIdx == null) return null;
  const s = stemIdx % 10;
  const b = branchIdx % 12;
  if ((s - b) % 2 !== 0) return null;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) return i;
  }
  return null;
}

/** 60甲子 인덱스 → (stemIdx, branchIdx) */
function sixtyToPillar(i60) {
  if (i60 == null || i60 < 0 || i60 > 59) return null;
  return { stemIdx: i60 % 10, branchIdx: i60 % 12 };
}

/** 천간 특수관계: 해당 천간이 다른 천간과 合/冲 관계인지. 반환 { type: '合'|'冲', pair: [idx, otherIdx] } */
function cheonganRelation(stemIdx, otherStemIdx) {
  if (stemIdx == null || otherStemIdx == null || stemIdx === otherStemIdx) return null;
  const a = stemIdx % 10;
  const b = otherStemIdx % 10;
  for (const [x, y] of CHEONGAN_HAP) {
    if ((a === x && b === y) || (a === y && b === x)) return { type: '合', typeKo: '합', pair: [a, b] };
  }
  for (const [x, y] of CHEONGAN_CHUNG) {
    if ((a === x && b === y) || (a === y && b === x)) return { type: '冲', typeKo: '충', pair: [a, b] };
  }
  return null;
}

/** 지지 b의 지장간(藏干) 한자 문자열 */
function jijiJanganString(branchIdx) {
  if (branchIdx == null || branchIdx < 0 || branchIdx > 11) return null;
  const arr = JIJI_JANGAN[branchIdx];
  if (!arr || !arr.length) return null;
  return arr.map((i) => CHEONGAN_ZH[i]).join('');
}

/** 지지 b가 사주 내 다른 지지들과 갖는 관계 라벨 (참조 이미지와 동일). pillarKey로 암합 표기 형식 구분. stemIdx는 암합 天干地支 표기용 */
function jijiRelationLabels(b, allBranches, pillarKey, stemIdx) {
  const out = { jangan: null, banghap: null, samhap: null, banhap: null, gahap: null, yukhap: null, amhap: null, chung: null, hyeong: null, hae: null, pa: null, wonjin: null, gweemun: null };
  const branchSet = new Set(allBranches);
  const has = (x) => branchSet.has(x);

  out.jangan = jijiJanganString(b);

  // 방합(方合): 참조는 비어 있음 → 사주 네 기둥에 해당 方 세 지지가 모두 있을 때만 표시
  for (const tri of JIJI_BANGHAP) {
    if (tri.includes(b) && tri.every((x) => has(x))) {
      out.banghap = tri.map((i) => JIJI_ZH[i]).join('');
      break;
    }
  }
  // 삼합(三合): 참조는 비어 있음 → 해당 三合의 다른 지지가 하나라도 있을 때만 표시
  for (const tri of JIJI_SAMHAP) {
    if (tri.includes(b)) {
      const rest = tri.filter((x) => x !== b);
      if (has(rest[0]) || has(rest[1])) out.samhap = tri.map((i) => JIJI_ZH[i]).join('');
      break;
    }
  }
  // 반합(半合): 참조와 동일 — 해당 지지가 속한 半合 쌍을 항상 표시 (申子,子辰 등)
  const banhapList = [];
  for (const [p, q] of JIJI_BANHAP) {
    if (b === p || b === q) banhapList.push(JIJI_ZH[p] + JIJI_ZH[q]);
  }
  if (banhapList.length) out.banhap = banhapList.join(',');

  // 가합(拱合): 참조와 동일 — 해당 지지가 속한 拱合 쌍을 항상 표시 (寅戌, 未亥 등)
  const gahapList = [];
  for (const [p, q] of JIJI_GAHAP) {
    if (b === p || b === q) gahapList.push(JIJI_ZH[p] + JIJI_ZH[q]);
  }
  if (gahapList.length) out.gahap = gahapList.join(',');

  // 육합: 참고 데이터와 동일 — 해당 지지가 속한 六合 쌍을 항상 표시 (子→子丑, 寅/亥→寅亥 등)
  for (const [p, q] of JIJI_YUKHAP) {
    if (b === p || b === q) {
      out.yukhap = JIJI_ZH[Math.min(p, q)] + JIJI_ZH[Math.max(p, q)];
      break;
    }
  }
  // 암합(暗合): 참조 데이터와 동일 — 고정 쌍 子戌·丑寅·寅未·午亥만 사용, 天干地支는 해당 주의 천간+지지
  const amhapPairs = [];
  for (const [p, q] of JIJI_AMHAP) {
    if (b !== p && b !== q) continue;
    const diDi = JIJI_ZH[Math.min(p, q)] + JIJI_ZH[Math.max(p, q)];
    const tianDi = stemIdx != null ? CHEONGAN_ZH[stemIdx] + JIJI_ZH[b] : null;
    amhapPairs.push({ tianDi, diDi });
  }
  if (amhapPairs.length) {
    const parts = [];
    for (const { tianDi, diDi } of amhapPairs) {
      if (pillarKey === 'hour' || pillarKey === 'year') {
        parts.push(tianDi ?? diDi, diDi, diDi);
      } else if (pillarKey === 'day') {
        parts.push(diDi, diDi);
      } else {
        parts.push(diDi, tianDi ?? diDi, diDi);
      }
    }
    out.amhap = parts.join(',');
  }

  // 충(冲): 참조와 동일 — 해당 지지의 冲 쌍을 항상 표시 (子午, 寅申 등)
  for (const [p, q] of JIJI_CHUNG) {
    if (b === p || b === q) {
      out.chung = JIJI_ZH[p] + JIJI_ZH[q];
      break;
    }
  }
  // 형(刑): 自刑(亥亥)·二刑(子卯)은 항상 표시, 三刑(寅巳申·丑未戌)은 상대가 사주에 있을 때만 (참조: 시주/연주 子卯, 일주 비움)
  for (const arr of JIJI_HYENG) {
    if (arr.length === 1 && arr[0] === b) out.hyeong = JIJI_ZH[b] + JIJI_ZH[b];
    if (arr.length === 2 && arr.includes(b)) out.hyeong = arr.map((i) => JIJI_ZH[i]).join('');
    if (arr.length >= 3 && arr.includes(b) && arr.some((x) => x !== b && has(x))) out.hyeong = arr.map((i) => JIJI_ZH[i]).join('');
  }
  // 해(害): 참조와 동일 — 해당 지지의 害 쌍을 항상 표시 (子未, 寅巳 등)
  for (const [p, q] of JIJI_HAE) {
    if (b === p || b === q) {
      out.hae = JIJI_ZH[p] + JIJI_ZH[q];
      break;
    }
  }
  // 파(破): 참조와 동일 — 해당 지지의 破 쌍을 항상 표시 (子酉, 寅亥 등)
  for (const [p, q] of JIJI_PA) {
    if (b === p || b === q) {
      out.pa = JIJI_ZH[p] + JIJI_ZH[q];
      break;
    }
  }
  out.wonjin = out.hae;
  // 귀문(鬼门): 子酉 寅戌 巳亥 (참조·천라지망 기준, 破와 별도)
  for (const [p, q] of JIJI_GWEEMUN) {
    if (b === p || b === q) {
      out.gweemun = JIJI_ZH[p] + JIJI_ZH[q];
      break;
    }
  }
  return out;
}

/** 십이신살: 역마/도화/화개 (年支·日支 기준으로 각 주 지지가 해당 신살인지). 타입별 중복 제거 */
function sinsal12ForBranch(branchIdx, yearBranchIdx, dayBranchIdx) {
  const refs = [yearBranchIdx, dayBranchIdx].filter((r) => r != null);
  const seen = new Set();
  const list = [];
  for (const ref of refs) {
    for (let g = 0; g < SINSAL_SAMHAP.length; g++) {
      if (!SINSAL_SAMHAP[g].includes(ref)) continue;
      if (SINSAL_IKMA[g] === branchIdx && !seen.has('ikma')) {
        seen.add('ikma');
        list.push({ ko: '역마', zh: '驿马', type: 'ikma' });
      }
      if (SINSAL_DOHWA[g] === branchIdx && !seen.has('dohwa')) {
        seen.add('dohwa');
        list.push({ ko: '도화', zh: '桃花', type: 'dohwa' });
      }
      if (SINSAL_HWAGAE[g] === branchIdx && !seen.has('hwagae')) {
        seen.add('hwagae');
        list.push({ ko: '화개', zh: '华盖', type: 'hwagae' });
      }
    }
  }
  return list.length ? list : null;
}

/** 간지 문자열에서 천간 인덱스(0-9) 추출 */
function getStemIndex(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  if (s.length < 1) return null;
  const firstZh = s[0];
  const idxZh = CHEONGAN_ZH.indexOf(firstZh);
  if (idxZh >= 0) return idxZh;
  const firstKo = s.slice(0, 1);
  const idxKo = CHEONGAN_KO.indexOf(firstKo);
  if (idxKo >= 0) return idxKo;
  return null;
}

/** 간지 문자열에서 지지 인덱스(0-11) 추출 (한글 1글자 또는 한자 1글자) */
function getBranchIndex(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  if (s.length < 2) return null;
  const secondZh = s[1];
  const idxZh = JIJI_ZH.indexOf(secondZh);
  if (idxZh >= 0) return idxZh;
  const secondKo = s.length >= 2 ? s[1] : '';
  const idxKo = JIJI_KO.indexOf(secondKo);
  if (idxKo >= 0) return idxKo;
  return null;
}

/** 일주(일간)에서 일간 인덱스 추출 (천간 0-9). "庚辰日" 또는 "경진일" 형태 */
function getDayStemIndex(dayPillar) {
  return getStemIndex(dayPillar);
}

/** 오행 인덱스 → 한글/한자 */
function ohangLabel(idx) {
  if (idx == null || idx < 0 || idx > 4) return null;
  return { ko: OHANG_KO[idx], zh: OHANG_ZH[idx] };
}

/** 천간·지지 인덱스로 오행 분포 계산 (목화토금수 개수) */
function computeOhangDistribution(stemIndices, branchIndices) {
  const count = [0, 0, 0, 0, 0];
  for (const i of stemIndices) {
    if (i != null && i >= 0 && i <= 9) count[CHEONGAN_TO_OHANG[i]]++;
  }
  for (const i of branchIndices) {
    if (i != null && i >= 0 && i <= 11) count[JIJI_TO_OHANG[i]]++;
  }
  return {
    목: count[0],
    화: count[1],
    토: count[2],
    금: count[3],
    수: count[4],
    wood: count[0],
    fire: count[1],
    earth: count[2],
    metal: count[3],
    water: count[4],
  };
}

/** 일간(D) 대비 타천간(T)의 십성 인덱스. 同五行同阴阳=比肩0 异=劫财1 日生他同=食神2 异=伤官3 日克他同=偏财4 异=正财5 他克日同=偏官6 异=正官7 他生日同=偏印8 异=正印9 */
function sipseongIndex(dayStemIdx, otherStemIdx) {
  if (dayStemIdx == null || otherStemIdx == null) return null;
  const d = dayStemIdx % 10;
  const t = otherStemIdx % 10;
  const dOhang = CHEONGAN_TO_OHANG[d];
  const tOhang = CHEONGAN_TO_OHANG[t];
  const dYang = d % 2 === 0;
  const tYang = t % 2 === 0;
  const sameYinyang = dYang === tYang;

  if (dOhang === tOhang) return sameYinyang ? 0 : 1; // 比肩 / 劫财

  const sheng = (x) => (x + 1) % 5; // 木→火→土→金→水→木
  const ke = [2, 3, 4, 0, 1]; // 木克土 火克金 土克水 金克木 水克火 → ohang index

  if (sheng(dOhang) === tOhang) return sameYinyang ? 2 : 3; // 食神 / 伤官
  if (ke[dOhang] === tOhang) return sameYinyang ? 4 : 5; // 偏财 / 正财
  if (ke[tOhang] === dOhang) return sameYinyang ? 6 : 7; // 偏官 / 正官
  if (sheng(tOhang) === dOhang) return sameYinyang ? 8 : 9; // 偏印 / 正印
  return null;
}

/** 일간 대비 지지의 12운성 인덱스. 陽干長生=亥(11) 陰干長生=午(6) 등 */
function unseong12Index(dayStemIdx, branchIdx) {
  if (dayStemIdx == null || branchIdx == null) return null;
  const cs = CHANGSAENG_BRANCH[dayStemIdx % 10];
  const diff = (branchIdx - cs + 12) % 12;
  return diff;
}

/**
 * 사주 4주(연월일시)에서 천간·지지 인덱스 배열 추출 (한/중 동일 인덱스)
 * @param {object} gapja - gapjaKorean or gapjaChinese with year, month, day, hour(optional)
 * @param {boolean} useChinese - true면 한자에서 파싱
 * @returns {{ stemIndices: number[], branchIndices: number[] }}
 */
function getPillarIndices(gapja, useChinese = true) {
  const src = useChinese ? gapja?.gapjaChinese : gapja?.gapjaKorean;
  if (!src) return { stemIndices: [], branchIndices: [] };
  const keys = ['year', 'month', 'day', 'hour'];
  const stemIndices = [];
  const branchIndices = [];
  for (const k of keys) {
    const v = src[k];
    if (v) {
      const si = getStemIndex(v);
      const bi = getBranchIndex(v);
      if (si != null) stemIndices.push(si);
      if (bi != null) branchIndices.push(bi);
    }
  }
  return { stemIndices, branchIndices };
}

/**
 * 기본 saju 객체에 오행분포·십성·12운성 계산 결과를 붙여 반환 (참조 페이지 결과 항목 보관용)
 * @param {object} saju - solarToSaju / lunarToSaju 반환값
 * @returns {object} saju (같은 객체에 ohang, sipseong, unseong12 필드 추가)
 */
export function enrichSajuWithResults(saju) {
  if (!saju || (!saju.gapjaKorean && !saju.gapjaChinese)) return saju;

  const gapja = saju.gapjaChinese || saju.gapjaKorean;
  const keys = ['year', 'month', 'day', 'hour'];
  const stemIndices = [];
  const branchIndices = [];

  for (const k of keys) {
    const v = gapja[k];
    if (v) {
      const si = getStemIndex(v);
      const bi = getBranchIndex(v);
      stemIndices.push(si);
      branchIndices.push(bi);
    }
  }

  const dayStemIdx = getStemIndex(gapja.day);
  if (dayStemIdx == null) return saju;

  // 오행 분포
  saju.ohang = {
    distribution: computeOhangDistribution(stemIndices, branchIndices),
  };

  // 주별 오행 (연월일시 각 주의 천간·지지 오행)
  const pillarsOhang = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (stemIndices[i] != null || branchIndices[i] != null) {
      const stemOhang = stemIndices[i] != null ? ohangLabel(CHEONGAN_TO_OHANG[stemIndices[i]]) : null;
      const branchOhang = branchIndices[i] != null ? ohangLabel(JIJI_TO_OHANG[branchIndices[i]]) : null;
      pillarsOhang[k] = { stem: stemOhang, branch: branchOhang };
    }
  });
  saju.ohang.pillars = pillarsOhang;

  // 십성 (연월일시 천간에 대해 일간 기준)
  const sipseong = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (stemIndices[i] != null) {
      const idx = sipseongIndex(dayStemIdx, stemIndices[i]);
      sipseong[k] = idx != null ? { ko: SIPEONG_KO[idx], zh: SIPEONG_ZH[idx], index: idx } : null;
    }
  });
  saju.sipseong = sipseong;

  // 12운성 (연월일시 지지에 대해 일간 기준)
  const unseong12 = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (branchIndices[i] != null) {
      const idx = unseong12Index(dayStemIdx, branchIndices[i]);
      unseong12[k] = idx != null ? { ko: UNSEONG12_KO[idx], zh: UNSEONG12_ZH[idx], index: idx } : null;
    }
  });
  saju.unseong12 = unseong12;

  // 천간 특수관계 (연월일시 천간끼리 合/冲)
  const cheonganRelationList = { year: [], month: [], day: [], hour: [] };
  keys.forEach((k, i) => {
    if (stemIndices[i] == null) return;
    const rels = [];
    keys.forEach((k2, j) => {
      if (i === j || stemIndices[j] == null) return;
      const r = cheonganRelation(stemIndices[i], stemIndices[j]);
      if (r) rels.push({ ...r, withPillar: k2, withStem: CHEONGAN_ZH[stemIndices[j]] });
    });
    cheonganRelationList[k] = rels;
  });
  saju.cheonganRelation = cheonganRelationList;

  // 지지 형충회합 (참조 사이트와 동일: 지장간·방합·삼합·반합·가합·육합·암합·충·형·파·해·원진·귀문) 주별
  const jijiRelation = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (branchIndices[i] != null) {
      const labels = jijiRelationLabels(branchIndices[i], branchIndices.filter((x) => x != null), k, stemIndices[i]);
      const ko = {
        jangan: labels.jangan ?? null,
        banghap: labels.banghap ?? null,
        samhap: labels.samhap ?? null,
        banhap: labels.banhap ?? null,
        gahap: labels.gahap ?? null,
        yukhap: labels.yukhap ?? null,
        amhap: labels.amhap ?? null,
        chung: labels.chung ?? null,
        hyeong: labels.hyeong ?? null,
        pa: labels.pa ?? null,
        hae: labels.hae ?? null,
        wonjin: labels.wonjin ?? null,
        gweemun: labels.gweemun ?? null,
      };
      jijiRelation[k] = { ...labels, ko };
    }
  });
  saju.jijiRelation = jijiRelation;

  // 십이신살 (역마/도화/화개) 주별 — 年支·日支 기준
  const yearBranch = branchIndices[0];
  const dayBranch = branchIndices[2];
  const sinsal12 = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (branchIndices[i] != null) {
      const list = sinsal12ForBranch(branchIndices[i], yearBranch, dayBranch);
      sinsal12[k] = list;
    }
  });
  saju.sinsal12 = sinsal12;

  // 십이신살 행(참조): 주별 재살/지살/겁살 (천간십성 기준)
  const sinsal12Pillar = { year: null, month: null, day: null, hour: null };
  keys.forEach((k, i) => {
    if (sipseong[k] != null && sipseong[k].index != null) {
      const name = SIPEONG_TO_SINSAL[sipseong[k].index];
      if (name) sinsal12Pillar[k] = name;
    }
  });
  saju.sinsal12Pillar = sinsal12Pillar;

  // 신살 종합 (참조: 재살/지살/겁살 + 월덕귀인 + 역마/도화/화개 + 건록/정록)
  const sinsalCombined = { year: [], month: [], day: [], hour: [] };
  const gweeinBranches = GWEEIN_BRANCHES[dayStemIdx] || [];
  keys.forEach((k, i) => {
    const list = [];
    if (sinsal12Pillar[k]) list.push(sinsal12Pillar[k]);
    if (branchIndices[i] != null && gweeinBranches.includes(branchIndices[i])) list.push('월덕귀인');
    if (sinsal12[k]?.length) sinsal12[k].forEach((s) => list.push(s.ko));
    if (unseong12[k]?.index === 3) list.push('건록');
    if (sipseong[k]?.index === 9) list.push('정록');
    if (list.length) sinsalCombined[k] = list;
  });
  saju.sinsalCombined = sinsalCombined;

  // 대운·세운·월운 (성별·연도 있을 때)
  const gender = saju.gender;
  const solarYear = saju.solar?.year;
  const monthStem = stemIndices[1];
  const monthBranch = branchIndices[1];
  if (solarYear != null && monthStem != null && monthBranch != null && gender) {
    const yearStemIdx = stemIndices[0];
    const isYangYear = yearStemIdx != null && yearStemIdx % 2 === 0;
    const forward = (gender === 'M' && isYangYear) || (gender === 'F' && !isYangYear);
    const month60 = pillarTo60(monthStem, monthBranch);
    if (month60 != null) {
      const daeunSteps = [];
      for (let step = 0; step < 10; step++) {
        const delta = forward ? step + 1 : -(step + 1);
        const i60 = (month60 + delta + 60) % 60;
        const p = sixtyToPillar(i60);
        if (p) {
          const stemSi = sipseongIndex(dayStemIdx, p.stemIdx);
          const branchJangan = JIJI_JANGAN[p.branchIdx];
          const jiStemIdx = branchJangan && branchJangan[0] != null ? branchJangan[0] : null;
          const sipseongJi = jiStemIdx != null ? sipseongIndex(dayStemIdx, jiStemIdx) : null;
          const sinsalName = SEUN_SINSAL_BY_BRANCH[p.branchIdx] ?? null; // 大运地支 기준 (참조: 流年과 동일)
          daeunSteps.push({
            age: [7, 17, 27, 37, 47, 57, 67, 77, 87, 97][step],
            gapja: `${CHEONGAN_ZH[p.stemIdx]}${JIJI_ZH[p.branchIdx]}`,
            gapjaKo: `${CHEONGAN_KO[p.stemIdx]}${JIJI_KO[p.branchIdx]}`,
            sipseong: stemSi != null ? { ko: SIPEONG_KO[stemSi], zh: SIPEONG_ZH[stemSi] } : null,
            sipseongJi: sipseongJi != null ? { ko: SIPEONG_KO[sipseongJi], zh: SIPEONG_ZH[sipseongJi] } : null,
            sinsal: sinsalName ?? null,
            unseong12: unseong12Index(dayStemIdx, p.branchIdx) != null ? { ko: UNSEONG12_KO[unseong12Index(dayStemIdx, p.branchIdx)], zh: UNSEONG12_ZH[unseong12Index(dayStemIdx, p.branchIdx)] } : null,
          });
        }
      }
      saju.daeun = { forward, steps: daeunSteps, note: '한국천문연구원 기준, 起运岁数는 절기 데이터 필요' };
    }
    // 세운(流年): 현재 연도(한국 기준) 중심 전후 5년
    const currentYearKorea = (() => {
      try {
        const s = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Seoul' });
        const y = parseInt(s.split('-')[0] || s.split('/')[0], 10);
        if (Number.isFinite(y) && y >= 1900 && y <= 2100) return y;
      } catch (_) {}
      return new Date().getFullYear();
    })();
    const seunYears = [];
    for (let y = currentYearKorea - 4; y <= currentYearKorea + 5; y++) {
      const i60 = (y - 4) % 60;
      const i60norm = ((i60 % 60) + 60) % 60;
      const p = sixtyToPillar(i60norm);
      if (p) {
        const stemSi = sipseongIndex(dayStemIdx, p.stemIdx);
        const branchJangan = JIJI_JANGAN[p.branchIdx];
        const jiStemIdx = branchJangan && branchJangan[0] != null ? branchJangan[0] : null;
        const sipseongJi = jiStemIdx != null ? sipseongIndex(dayStemIdx, jiStemIdx) : null;
        const sinsalName = SEUN_SINSAL_BY_BRANCH[p.branchIdx] ?? null; // 참조: 流年地支 기준 신살
        seunYears.push({
          year: y,
          gapja: `${CHEONGAN_ZH[p.stemIdx]}${JIJI_ZH[p.branchIdx]}`,
          gapjaKo: `${CHEONGAN_KO[p.stemIdx]}${JIJI_KO[p.branchIdx]}`,
          sipseong: stemSi != null ? { ko: SIPEONG_KO[stemSi], zh: SIPEONG_ZH[stemSi] } : null,
          sipseongJi: sipseongJi != null ? { ko: SIPEONG_KO[sipseongJi], zh: SIPEONG_ZH[sipseongJi] } : null,
          sinsal: sinsalName ?? null,
          unseong12: unseong12Index(dayStemIdx, p.branchIdx) != null ? { ko: UNSEONG12_KO[unseong12Index(dayStemIdx, p.branchIdx)], zh: UNSEONG12_ZH[unseong12Index(dayStemIdx, p.branchIdx)] } : null,
        });
      }
    }
    saju.seun = seunYears;
    // 월운(流月): 당해년(현재 연도, 한국 기준) 五虎遁, 양력 1월=丑月 … 12월=子月
    // 1월은 입춘 전이므로 전년(干支)의 丑月 → 1월만 전년 年干으로 月干 계산
    const yuezhiByMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; // 1월→丑 … 12월→子
    const woleun = [];
    for (let m = 0; m < 12; m++) {
      const b = yuezhiByMonth[m]; // 月支 (丑寅卯…子)
      const yearForMonth = m === 0 ? currentYearKorea - 1 : currentYearKorea;
      const i60Woleun = ((yearForMonth - 4) % 60 + 60) % 60;
      const yearStemForMonth = i60Woleun % 10;
      const yueganFirst = [2, 4, 6, 8, 0][yearStemForMonth % 5]; // 寅月天干 (五虎遁)
      const s = (yueganFirst + (b - 2 + 12) % 12) % 10;
      const stemSi = sipseongIndex(dayStemIdx, s);
      const branchJangan = JIJI_JANGAN[b];
      const jiStemIdx = branchJangan && branchJangan[0] != null ? branchJangan[0] : null;
      const sipseongJi = jiStemIdx != null ? sipseongIndex(dayStemIdx, jiStemIdx) : null;
      const sinsalName = WOLUN_SINSAL_KO[m]; // 참조: 월별 고정 신살
      woleun.push({
        month: m + 1,
        gapja: `${CHEONGAN_ZH[s]}${JIJI_ZH[b]}`,
        gapjaKo: `${CHEONGAN_KO[s]}${JIJI_KO[b]}`,
        sipseong: stemSi != null ? { ko: SIPEONG_KO[stemSi], zh: SIPEONG_ZH[stemSi] } : null,
        sipseongJi: sipseongJi != null ? { ko: SIPEONG_KO[sipseongJi], zh: SIPEONG_ZH[sipseongJi] } : null,
        sinsal: sinsalName ?? null,
        unseong12: unseong12Index(dayStemIdx, b) != null ? { ko: UNSEONG12_KO[unseong12Index(dayStemIdx, b)], zh: UNSEONG12_ZH[unseong12Index(dayStemIdx, b)] } : null,
      });
    }
    saju.woleun = woleun;
  }

  return saju;
}

/**
 * 시주(時柱) 계산: 일간(日干) + 출생시각 → 시천간·시지
 * 日上起时: 甲己日 甲子时, 乙庚日 丙子时, 丙辛日 戊子时, 丁壬日 庚子时, 戊癸日 壬子时
 * 시지(참조 만세력): 子0-1 丑2-3 寅4-5 … 亥22-23 (branchIdx = floor(hour/2))
 */
function computeHourPillar(dayPillar, birthTime) {
  if (!dayPillar || !birthTime || !/^\d{1,2}:\d{2}$/.test(birthTime.trim())) return null;
  const dayStemIdx = getDayStemIndex(dayPillar);
  if (dayStemIdx == null) return null;
  const [hStr] = birthTime.trim().split(':');
  const hour = parseInt(hStr, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;

  // 시지: 참조(만세력) 기준 0~1시=子, 2~3시=丑, … 22~23시=亥 (branchIdx = floor(hour/2))
  const branchIdx = Math.floor(hour / 2);
  const ziStemIdx = [0, 2, 4, 6, 8][dayStemIdx % 5];
  const hourStemIdx = (ziStemIdx + branchIdx) % 10;

  return {
    gapjaKorean: `${CHEONGAN_KO[hourStemIdx]}${JIJI_KO[branchIdx]}시`,
    gapjaChinese: `${CHEONGAN_ZH[hourStemIdx]}${JIJI_ZH[branchIdx]}时`,
    stemIndex: hourStemIdx,
    branchIndex: branchIdx,
  };
}

/**
 * 양력 생년월일(·시간)·성별을 만세력(음력, 사주4주)으로 변환
 * @param {string} birthDate - YYYY-MM-DD
 * @param {string} [birthTime] - HH:mm (시주 계산용)
 * @param {string} [gender] - M|F|X (성별, 대운 등 활용)
 * @returns {object|null}
 */
export function solarToSaju(birthDate, birthTime, gender) {
  if (!birthDate || typeof birthDate !== 'string') return null;

  const parts = birthDate.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  try {
    const calendar = new KoreanLunarCalendar();
    const ok = calendar.setSolarDate(year, month, day);
    if (!ok) return null;

    const lunar = calendar.getLunarCalendar();
    const gapjaKorean = calendar.getKoreanGapja();
    const gapjaChinese = calendar.getChineseGapja();

    const saju = {
      solar: { year, month, day },
      lunar: {
        year: lunar?.year,
        month: lunar?.month,
        day: lunar?.day,
        intercalation: !!lunar?.intercalation,
      },
      gapjaKorean: gapjaKorean
        ? {
            year: gapjaKorean.year,
            month: gapjaKorean.month,
            day: gapjaKorean.day,
            intercalation: gapjaKorean.intercalation || '',
          }
        : null,
      gapjaChinese: gapjaChinese
        ? {
            year: gapjaChinese.year,
            month: gapjaChinese.month,
            day: gapjaChinese.day,
            intercalation: gapjaChinese.intercalation || '',
          }
        : null,
    };

    if (gender && ['M', 'F', 'X'].includes(gender)) {
      saju.gender = gender;
    }

    if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime.trim())) {
      saju.birthTime = birthTime.trim();
      const dayPillar = gapjaChinese?.day || gapjaKorean?.day;
      const hourPillar = computeHourPillar(dayPillar, birthTime.trim());
      if (hourPillar) {
        saju.gapjaKorean = saju.gapjaKorean ? { ...saju.gapjaKorean, hour: hourPillar.gapjaKorean } : null;
        saju.gapjaChinese = saju.gapjaChinese ? { ...saju.gapjaChinese, hour: hourPillar.gapjaChinese } : null;
      }
    }

    return enrichSajuWithResults(saju);
  } catch (err) {
    console.error('[saju] solarToSaju error:', err.message);
    return null;
  }
}

/**
 * 음력 생년월일을 만세력(양력, 사주4주)으로 변환
 * @param {string} birthDate - YYYY-MM-DD (음력)
 * @param {boolean} [isIntercalation=false] - 윤달 여부
 * @param {string} [birthTime] - HH:mm (시주 계산용)
 * @param {string} [gender] - M|F|X (성별)
 * @returns {object|null}
 */
export function lunarToSaju(birthDate, isIntercalation = false, birthTime, gender) {
  if (!birthDate || typeof birthDate !== 'string') return null;

  const parts = birthDate.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  try {
    const calendar = new KoreanLunarCalendar();
    const ok = calendar.setLunarDate(year, month, day, !!isIntercalation);
    if (!ok) return null;

    const solar = calendar.getSolarCalendar();
    const lunar = calendar.getLunarCalendar();
    const gapjaKorean = calendar.getKoreanGapja();
    const gapjaChinese = calendar.getChineseGapja();

    const saju = {
      solar: solar ? { year: solar.year, month: solar.month, day: solar.day } : null,
      lunar: {
        year: lunar?.year ?? year,
        month: lunar?.month ?? month,
        day: lunar?.day ?? day,
        intercalation: !!isIntercalation,
      },
      gapjaKorean: gapjaKorean
        ? {
            year: gapjaKorean.year,
            month: gapjaKorean.month,
            day: gapjaKorean.day,
            intercalation: gapjaKorean.intercalation || (isIntercalation ? '윤월' : ''),
          }
        : null,
      gapjaChinese: gapjaChinese
        ? {
            year: gapjaChinese.year,
            month: gapjaChinese.month,
            day: gapjaChinese.day,
            intercalation: gapjaChinese.intercalation || (isIntercalation ? '閏月' : ''),
          }
        : null,
    };

    if (gender && ['M', 'F', 'X'].includes(gender)) {
      saju.gender = gender;
    }

    if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime.trim())) {
      saju.birthTime = birthTime.trim();
      const dayPillar = gapjaChinese?.day || gapjaKorean?.day;
      const hourPillar = computeHourPillar(dayPillar, birthTime.trim());
      if (hourPillar) {
        saju.gapjaKorean = saju.gapjaKorean ? { ...saju.gapjaKorean, hour: hourPillar.gapjaKorean } : null;
        saju.gapjaChinese = saju.gapjaChinese ? { ...saju.gapjaChinese, hour: hourPillar.gapjaChinese } : null;
      }
    }

    return enrichSajuWithResults(saju);
  } catch (err) {
    console.error('[saju] lunarToSaju error:', err.message);
    return null;
  }
}
