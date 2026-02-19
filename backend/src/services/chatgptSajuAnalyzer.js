/**
 * 사주 데이터를 ChatGPT에 요청해 상세 분석 결과(JSON) 생성
 * 출력 형식 고정으로 저장 데이터 일관성 확보. 파싱 실패 시 null 반환.
 */
import { getOpenAIClient } from './openaiClient.js';
import { config } from '../config/index.js';
import { db } from '../models/db.js';
import { aiUsageLogs } from '../models/schema.js';

const PROMPT_VERSION = '1';
const DEFAULT_MODEL = 'gpt-4o-mini';

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
const PILLAR_LABELS = { year: '연', month: '월', day: '일', hour: '시' };

async function logAiUsage({ userId, feature, model, promptTokens, completionTokens, totalTokens }) {
  try {
    const inputCostCents = promptTokens * (15 / 1000000);
    const outputCostCents = completionTokens * (60 / 1000000);
    const totalCostCents = Math.ceil((inputCostCents + outputCostCents) * 10000) / 10000;

    await db.insert(aiUsageLogs).values({
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      feature,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      costCents: Math.ceil(totalCostCents),
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn('⚠️ Failed to log AI usage:', error.message);
  }
}

/**
 * 사주 객체에서 프롬프트용 요약 텍스트 생성 (개인 식별 최소화)
 * 사주·오행·십성·12운성·십이신살·신살·대운·세운·월운 모두 포함.
 */
function sajuToPromptSummary(saju) {
  if (!saju || typeof saju !== 'object') return '';
  const lines = [];
  const g = saju.gapjaKorean || saju.gapjaChinese;
  if (g) {
    lines.push(`사주팔자: 연 ${g.year || '-'} 월 ${g.month || '-'} 일 ${g.day || '-'} 시 ${g.hour || '-'}`);
  }
  if (saju.ohang?.distribution) {
    const d = saju.ohang.distribution;
    lines.push(`오행: 목${d.목 ?? 0} 화${d.화 ?? 0} 토${d.토 ?? 0} 금${d.금 ?? 0} 수${d.수 ?? 0}`);
  }
  if (saju.sipseong) {
    const s = saju.sipseong;
    const arr = [s.year?.ko, s.month?.ko, s.day?.ko, s.hour?.ko].filter(Boolean);
    if (arr.length) lines.push(`십성(연월일시): ${arr.join(', ')}`);
  }
  if (saju.unseong12) {
    const u = saju.unseong12;
    const arr = [u.year?.ko, u.month?.ko, u.day?.ko, u.hour?.ko].filter(Boolean);
    if (arr.length) lines.push(`12운성: ${arr.join(', ')}`);
  }
  if (saju.sinsal12 && typeof saju.sinsal12 === 'object') {
    const parts = PILLAR_KEYS.map((k) => {
      const list = saju.sinsal12[k];
      const names = Array.isArray(list) ? list.map((x) => x?.ko).filter(Boolean).join(', ') : '-';
      return `${PILLAR_LABELS[k]}주 ${names}`;
    }).filter(Boolean);
    if (parts.length) lines.push(`십이신살: ${parts.join(' | ')}`);
  }
  if (saju.sinsalCombined && typeof saju.sinsalCombined === 'object') {
    const parts = PILLAR_KEYS.map((k) => {
      const list = saju.sinsalCombined[k];
      const str = Array.isArray(list) ? list.join(', ') : (list || '-');
      return `${PILLAR_LABELS[k]}주 ${str}`;
    }).filter(Boolean);
    if (parts.length) lines.push(`신살(종합): ${parts.join(' | ')}`);
  }
  if (saju.daeun?.steps?.length) {
    const stepLines = saju.daeun.steps.map((x, i) => {
      const age = x.age ?? [7, 17, 27, 37, 47, 57, 67, 77, 87, 97][i];
      const g = x.gapjaKo || x.gapja;
      const sp = x.sipseong?.ko ?? '';
      const ss = x.sinsal ?? '';
      const u12 = x.unseong12?.ko ?? '';
      return `${age}세 ${g} 십성:${sp} 신살:${ss} 12운:${u12}`.trim();
    });
    lines.push('대운: ' + stepLines.join(' / '));
  }
  if (saju.seun?.length) {
    const recent = saju.seun.slice(-10);
    const stepLines = recent.map((x) => {
      const g = x.gapjaKo || x.gapja;
      const sp = x.sipseong?.ko ?? '';
      const ss = x.sinsal ?? '';
      return `${x.year} ${g} 십성:${sp} 신살:${ss}`.trim();
    });
    lines.push('세운(최근' + recent.length + '년): ' + stepLines.join(' / '));
  }
  if (saju.woleun?.length) {
    const sorted = [...saju.woleun].sort((a, b) => a.month - b.month);
    const stepLines = sorted.map((x) => {
      const g = x.gapjaKo || x.gapja;
      const sp = x.sipseong?.ko ?? '';
      const ss = x.sinsal ?? '';
      return x.month + '월 ' + g + (sp ? ' 십성:' + sp : '') + (ss ? ' 신살:' + ss : '');
    });
    lines.push('월운: ' + stepLines.join(' / '));
  }
  return lines.join('\n');
}

/** 응답 JSON 최소 스키마: summary 필드만 있어도 유효 */
function isValidAnalysis(obj) {
  return obj && typeof obj === 'object' && (typeof obj.summary === 'string' || Array.isArray(obj.sections));
}

/**
 * ChatGPT로 사주 상세 분석 요청
 * @param {object} saju - profile.saju
 * @returns {Promise<{ analysis: object, model: string } | null>} 파싱 성공 시 분석 객체와 모델명, 실패 시 null
 */
export async function analyzeSajuWithChatGPT(saju, userId = null) {
  const client = getOpenAIClient();
  if (!client) return null;

  const summary = sajuToPromptSummary(saju);
  if (!summary.trim()) return null;

  // 전달된 각 줄의 첫 토큰(항목명)을 추출하고, item_interpretations용 표준 키로 매핑
  const rawKeys = summary
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(':');
      return colonIdx > 0 ? line.slice(0, colonIdx).trim() : line.split(/\s/)[0] || '';
    })
    .filter(Boolean);
  const keyAliases = { '십성(연월일시)': '십성', '12운성': '12운성', '신살(종합)': '신살', '십이신살': '십이신살', '월운': '월운', '세운(최근10년)': '세운' };
  const expectedItemKeys = rawKeys.map((r) => keyAliases[r] || r.replace(/\([^)]*\)$/, '').trim() || r);
  const uniqueExpectedKeys = [...new Set(expectedItemKeys)];

  const systemPrompt = `당신은 한국 전통 사주(명리학) 해석 전문가입니다. 주어진 사주 정보를 바탕으로 **전체 분량을 2배로 길게**, 그리고 **정보로 전달된 각 항목마다 별도 해석**을 포함해 JSON으로만 답변하세요.
다른 설명 없이 반드시 유효한 JSON 하나만 출력합니다.

JSON 구조와 작성 기준 (모든 필드 분량을 이전 기준의 약 2배로 작성하세요):

1) "item_interpretations": 객체. 사용자 메시지 맨 위에 나열된 **필수 키 목록**에 있는 **모든 키**에 대해, 각 키당 **최소 3~5문장 이상**의 상세 해석을 반드시 작성하세요. 키 이름은 필수 키 목록과 정확히 동일하게 하세요. 한 개라도 빠지면 안 됩니다.
   - 사주팔자: 연월일시 각 기둥의 의미와 조합 해석
   - 오행: 목화토금수 분포의 의미와 성향·운세 해석
   - 십성(연월일시): 키는 "십성" — 십성의 의미와 관계 해석
   - 12운성: 키는 "12운성" — 각 기둥의 12운성 해석
   - 십이신살: 신살이 미치는 영향 해석
   - 신살(종합): 키는 "신살" — 종합 신살 해석
   - 대운: 10년 단위 대운별 상세 해석 (각 대운 2~3문장)
   - 세운(최근N년): 키는 "세운" — 최근 세운 흐름 해석
   - 월운: 키는 "월운" — 월운 참고 해석

2) "summary": 전체 요약. **최소 8~12문장**으로, item_interpretations에서 해석한 내용을 종합한 상세 요약.

3) "personality": 성향. **4~6문단 분량**으로, 성격·사고방식·대인관계·행동 특성 구체적 서술.

4) "strengths": 강점 배열. **각 항목을 2~3문장으로 설명** (최소 6~8개).

5) "weaknesses": 약점·주의점 배열. **각 항목을 2~3문장으로 설명** (최소 5~7개).

6) "life_phases": 대운·인생 국면. **6문단 이상**, 10년 단위 대운별 흐름과 시기별 조언을 매우 상세히.

7) "recommendations": 추천(운명 개선·활용법). **각 항목을 2~3문장으로 설명** (최소 6~8개).

한국어, 격식 있는 말투. **item_interpretations에는 필수 키 목록의 모든 항목**을 빠짐없이 포함하세요.`;

  const requiredKeysLine = uniqueExpectedKeys.length > 0
    ? `[필수 키 목록 — item_interpretations에 아래 키를 모두 포함할 것: ${uniqueExpectedKeys.join(', ')}]\n\n`
    : '';
  const userPrompt = `다음 사주 정보를 분석하세요.\n\n${requiredKeysLine}(1) **item_interpretations**에는 위 필수 키 목록에 있는 **모든 키**에 대해, 각각 3~5문장 이상의 항목별 상세 해석을 반드시 포함하세요. (2) summary, personality, strengths, weaknesses, life_phases, recommendations도 전체가 2배 길게 작성하세요. 유효한 JSON 하나만 출력하세요.\n\n${summary}`;

  const model = config.openaiModel || DEFAULT_MODEL;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 16000,
      temperature: 0.5,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    
    if (userId && completion.usage) {
      logAiUsage({
        userId,
        feature: 'saju_analysis',
        model: completion.model || model,
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      });
    }

    if (!content) return null;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      return null;
    }

    if (!isValidAnalysis(parsed)) return null;

    return {
      analysis: parsed,
      model: completion.model || model,
    };
  } catch (err) {
    if (config.nodeEnv !== 'production') {
      console.warn('[chatgptSajuAnalyzer] OpenAI request failed:', err.message);
    }
    return null;
  }
}

export const PROMPT_VERSION_EXPORT = PROMPT_VERSION;
