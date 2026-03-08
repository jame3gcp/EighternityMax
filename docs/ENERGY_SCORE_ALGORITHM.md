# 에너지 점수 알고리즘 검증 및 문서

홈·데일리 가이드에 표시되는 **오늘의 에너지 점수**, **에너지/감정/집중도**, **트렌드(유지·상승)** 의 계산 방식과 근거, 한계를 정리한 문서입니다.

---

## 1. 표시 값과 데이터 소스

| 표시 | 데이터 소스 | 백엔드 |
|------|-------------|--------|
| 오늘의 에너지 점수 (예: 75) | `dailyGuide.energy_index` | `backend/src/controllers/guide.js` `getDailyGuide` |
| Energy Index (오늘의 기운 상태 카드) | 동일 `dailyGuide.energy_index` | 동일 |
| 에너지 / 감정 / 집중도 (예: 60, 80, 64) | `currentPhase.energy`, `.emotion`, `.focus` | `backend/src/controllers/cycle.js` `getCycle` |
| 유지 / 상승 트렌드 | 프론트 고정값 | `frontend/src/pages/Home/Home.tsx` (trend 하드코딩) |

---

## 2. 알고리즘 검증 결과

### 2.1 오늘의 에너지 점수 (Energy Index)

**구성**

- **기준값**: `energyIndex = 75` (고정).
- **보정**: 최근 **기록 3건** (`records` 테이블의 `energy` 필드) 평균만 사용.
  - `avgRecentEnergy < 40` → `energyIndex -= 10` (65)
  - `avgRecentEnergy > 80` → `energyIndex += 5` (80)
  - 그 외 → 75 유지

**계산 식 요약**

- 입력: `records` 최근 3건의 `energy` 값.
- 출력: 65 / 75 / 80 중 하나 (기록 없으면 75).

**근거**

- “최근 사용자 입력(에너지 기록)이 낮으면 오늘 지수를 낮게, 높으면 약간 높게” 하는 **규칙 기반 보정**만 적용됨.
- Life Profile, 사주, 요일/시간대, 계절 등은 **반영되지 않음**.

**한계**

- summary / do / avoid / relationships는 **전부 하드코딩** 문자열이라, 사용자·날짜·상황과 무관하게 동일 문구가 노출됨.

**참고 코드**: `backend/src/controllers/guide.js`, `backend/src/services/energyScoreFromProfile.js` (1차: Life Profile의 balance·recommendations·cycleDescription 기반으로 energy_index·summary·do 산출, 사주 용어/원문 노출 없음).

---

### 2.2 에너지 / 감정 / 집중도 (phase별 수치)

**구성**

- **현재 phase**: `currentPhase = Math.floor((now.getHours() / 24) * 8) % 8`  
  → **현재 시간**만으로 8단계(새벽 ~ 준비) 중 하나 선택.
- **phase별 energy / emotion / focus**: **삼각함수(sin/cos)** 로 phase 인덱스에 따라 계산, 0~100 클램프.
  - `energy = 50 + sin((index/8)*2π)*30` + (현재 phase면 +10)
  - `emotion = 50 + cos((index/8)*2π)*30`
  - `focus = 50 + sin((index/8)*2π + 0.5)*30`
- **개인 차이 없음**: Life Profile·사주·사용자별 리듬 **미반영**.

**계산 식 요약**

- 입력: 현재 시각(`now.getHours()`), phase 인덱스 0~7.
- 출력: 각 phase별 energy, emotion, focus (0~100 정수).

**근거**

- “하루를 8구간으로 나누고, 구간별로 에너지/감정/집중이 파형처럼 변한다”는 **일반적 패턴**을 수식으로 구현한 것.
- 문서/연구 인용 없음. **휴리스틱(경험적) 공식**에 가깝고, 개인화는 없음.

**한계**

- 모든 사용자에게 동일한 sin/cos 곡선 적용. Life Profile의 에너지 리듬 타입(활동형/안정형/창의형 등)이 반영되지 않음.

**참고 코드**: `backend/src/controllers/cycle.js`, `backend/src/services/energyScoreFromProfile.js` (1차: Life Profile의 patterns.morning/afternoon/evening 기반으로 phase별 energy/emotion/focus 산출, 사주 용어 노출 없음).

---

### 2.3 트렌드 (유지 / 상승)

- **1차 반영**: `getCycle` 응답에 `trends: { energy, emotion, focus }` 포함. 최근 기록 6건을 최신 3건 vs 이전 3건으로 비교해 평균 차이가 ±5 이상이면 상승/하락, 아니면 유지. 데이터 부족 시 `stable`. [backend/src/services/energyScoreFromProfile.js](backend/src/services/energyScoreFromProfile.js) `computeTrendsFromRecords`, [backend/src/controllers/cycle.js](backend/src/controllers/cycle.js).
- `frontend/src/pages/Home/Home.tsx`의 StatusCard는 `currentCycle.trends` 사용, 없으면 `stable`.

---

## 3. 기획서와의 관계

`docs/1. 서비스기획.md`에는 다음이 명시되어 있음:

- **Life Profile**이 “사이클 패턴 기준값 생성”, “예보 알고리즘 파라미터 설정”의 기준이 되어야 함.
- **AI Personal Energy Modeling** 기반 개인화.

**현재 구현**

- Life Profile에는 `backend/src/services/lifeProfileGenerator.js`에 **에너지 리듬 타입별 패턴**(활동형/안정형/창의형/균형형/야행형, morning/afternoon/evening의 energy·focus·emotion)이 정의되어 있으나, **getCycle / getDailyGuide 쪽에서는 이 값을 사용하지 않음.**

**정리**

- “어떤 근거로 알고리즘을 구성했는지”에 대한 답:
  - **규칙 기반 휴리스틱**: 최근 기록 평균(에너지 점수), 시간대별 sin/cos(에너지/감정/집중도).
  - **문서/연구 인용 없음**. 개인화·Life Profile 반영은 **기획은 되어 있으나 미구현** 상태로 보는 것이 타당함.

---

## 4. 개선 방향 (선택)

- **A) getCycle 개인화**: Life Profile의 `energyType` + 해당 타입의 `patterns.morning/afternoon/evening`을 읽어, 현재 시간대에 맞는 energy/emotion/focus를 반환하도록 변경.
- **B) getDailyGuide 보강**: summary / do / avoid를 Life Profile의 recommendations, cycleDescription 또는 phase 해석과 연동.
- **C) 트렌드 계산**: 같은 날 이전 기록 또는 전날 기록과 비교해 실제 증감이 있으면 “상승/하락/유지”를 계산해 StatusCard에 전달.

**로드맵 요약**

- **단기**: 문서화로 “어떤 근거로 계산되는지”를 투명히 하고, “현재는 단순 규칙 기반”임을 명시.  
- **중기**: Life Profile을 사이클/데일리 가이드의 파라미터로 쓰도록 연결 (A, B).  
- **장기**: 실제 기록이 쌓이면 트렌드·예보를 기록 기반으로 보강 (C). 이후 **웨어러블 데이터**를 입력으로 추가해 계산 알고리즘을 확장할 수 있도록 설계해 둠.

---

## 5. 장기 로드맵: 웨어러블 데이터 연동

에너지 점수·트렌드·예보 알고리즘을 **확장 가능한 구조**로 유지하고, 장기적으로 웨어러블 데이터를 계산에 반영할 수 있도록 하는 방향을 정리한다.

**목표**

- 수면·심박·활동량 등 웨어러블/헬스 데이터를 **추가 입력**으로 받아, Energy Index·에너지/감정/집중도·트렌드 계산에 반영.
- 기존 입력(최근 기록, Life Profile, phase)은 유지하고, 웨어러블이 있을 때만 가중/보정하거나 별도 파이프라인으로 합성.

**고려 사항 (구현 전 검토)**

- **데이터 소스**: Apple Health / Google Fit / Garmin 등 연동 시 OAuth·API·동기화 주기.
- **저장 구조**: `records` 확장 또는 `wearable_snapshots` 같은 별도 테이블, 시계열 집계(일/주 단위).
- **알고리즘 설계**: 웨어러블 지표(수면 품질, 심박 변이, 걸음 수 등)를 에너지/집중도와 매핑하는 규칙 또는 간단한 모델. Life Profile·사용자 기록과의 결합 방식(가중 평균, 우선순위 규칙 등).
- **프라이버시**: 수집 항목·보관 기간·제3자 제공 금지 등 정책 명시 및 동의 플로우.

**문서/코드 정리**

- 새로운 데이터 소스나 계산 단계를 추가할 때 이 문서의 "표시 값과 데이터 소스" 절과 "알고리즘 검증 결과" 절을 갱신하여, **어떤 입력이 어떤 점수에 어떻게 반영되는지**를 계속 명시할 것.
