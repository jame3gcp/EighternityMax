/**
 * 사주 서명(해시) 생성 — 동일 입력이면 동일 해시로 분석 재사용
 * profile.saju + calendar_type, is_intercalation, gender, birth_time 정규화 후 sha256
 */
import crypto from 'crypto';

/**
 * 사주 객체를 재현 가능한 문자열로 직렬화 (키 정렬)
 * @param {object} saju - profile.saju
 * @param {object} opts - { calendarType, isIntercalation, gender, birthTime, birthDate }
 * @returns {string}
 */
function serializeForSignature(saju, opts = {}) {
  const parts = [];
  if (opts.birthDate) parts.push(`birth:${opts.birthDate}`);
  if (opts.birthTime != null) parts.push(`time:${opts.birthTime || ''}`);
  if (opts.gender) parts.push(`gender:${opts.gender}`);
  if (opts.calendarType) parts.push(`cal:${opts.calendarType}`);
  parts.push(`intercal:${!!opts.isIntercalation}`);
  if (saju && typeof saju === 'object') {
    const g = saju.gapjaKorean || saju.gapjaChinese;
    if (g) {
      const str = [g.year, g.month, g.day, g.hour].filter(Boolean).join('|');
      parts.push(`gapja:${str}`);
    }
    if (saju.solar) {
      parts.push(`solar:${saju.solar.year}-${saju.solar.month}-${saju.solar.day}`);
    }
    if (saju.lunar) {
      parts.push(`lunar:${saju.lunar.year}-${saju.lunar.month}-${saju.lunar.day}-${!!saju.lunar.intercalation}`);
    }
  }
  return parts.join(';');
}

/**
 * 사주 서명(해시) 생성. 동일 입력이면 동일 값 반환.
 * @param {object} saju - profile.saju (만세력 계산 결과)
 * @param {object} opts - { calendarType?, isIntercalation?, gender?, birthTime?, birthDate? }
 * @returns {string} hex sha256 (짧게 사용 시 앞 32자만 써도 됨)
 */
export function computeSajuSignature(saju, opts = {}) {
  const str = serializeForSignature(saju, opts);
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}
