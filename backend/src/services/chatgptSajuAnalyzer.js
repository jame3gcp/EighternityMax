/**
 * 사주 데이터를 ChatGPT에 요청해 상세 분석 결과(JSON) 생성
 * 출력 형식 고정으로 저장 데이터 일관성 확보. 파싱 실패 시 null 반환.
 */
import { getOpenAIClient } from './openaiClient.js';
import { config } from '../config/index.js';

const PROMPT_VERSION = '1';
const DEFAULT_MODEL = 'gpt-4o-mini';

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
const PILLAR_LABELS = { year: '연', month: '월', day: '일', hour: '시' };

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
export async function analyzeSajuWithChatGPT(saju) {
  const client = getOpenAIClient();
  if (!client) return null;

  const summary = sajuToPromptSummary(saju);
  if (!summary.trim()) return null;

  const systemPrompt = `당신은 한국 전통 사주(명리학) 해석 전문가입니다. 주어진 사주 정보를 바탕으로 상세한 해석을 JSON으로만 답변하세요. 
다른 설명 없이 반드시 유효한 JSON 하나만 출력합니다. 
JSON 구조: { "summary": "전체 요약 (2~3문장)", "personality": "성향 요약", "strengths": ["강점1","강점2"], "weaknesses": ["약점1"], "life_phases": "대운/인생국면 요약", "recommendations": ["추천1","추천2"] }
한국어로 작성하고, 격식 있는 말투를 사용하세요.`;

  const userPrompt = `다음 사주를 분석해 JSON 하나만 출력하세요.\n\n${summary}`;

  const model = config.openaiModel || DEFAULT_MODEL;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.5,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content);
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
