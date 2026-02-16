/**
 * 참조 사이트(https://beta-ybz6.onrender.com/) 비교용 테스트 데이터
 * 각 케이스: 입력 + 우리 결과 + 참조(알려진 값 또는 수동 확인용)
 */
export const TEST_CASES = [
  {
    id: 'README-solar-2017',
    description: 'korean-lunar-calendar README: 양력 2017-06-24',
    input: { birthDate: '2017-06-24', birthTime: null, calendarType: 'solar', isIntercalation: false, gender: 'M' },
    reference: {
      lunar: { year: 2017, month: 5, day: 1, intercalation: true },
      gapjaKorean: { year: '정유년', month: '병오월', day: '임오일' },
      gapjaChinese: { year: '丁酉年', month: '丙午月', day: '壬午日' },
      source: 'korean-lunar-calendar README',
    },
  },
  {
    id: 'README-lunar-1956',
    description: 'korean-lunar-calendar README: 음력 1956-01-21(평달)',
    input: { birthDate: '1956-01-21', birthTime: null, calendarType: 'lunar', isIntercalation: false, gender: 'F' },
    reference: {
      solar: { year: 1956, month: 3, day: 3 },
      gapjaKorean: { year: '병신년', month: '경인월', day: '기사일' },
      gapjaChinese: { year: '丙申年', month: '庚寅月', day: '己巳日' },
      source: 'korean-lunar-calendar README',
    },
  },
  {
    id: 'with-time-1990',
    description: '양력 1990-05-15 14:30 남 (시주·오행·십성·12운성 포함)',
    input: { birthDate: '1990-05-15', birthTime: '14:30', calendarType: 'solar', isIntercalation: false, gender: 'M' },
    reference: {
      gapjaKorean: { year: '경오년', month: '신사월', day: '경진일', hour: '계미시' },
      gapjaChinese: { year: '庚午年', month: '辛巳月', day: '庚辰日', hour: '癸未时' },
      ohangDistribution: { 목: 0, 화: 2, 토: 2, 금: 3, 수: 1 },
      sipseongKo: { year: '비견', month: '겁재', day: '비견', hour: '상관' },
      source: '일간 庚 → 年庚比肩 月辛劫财 日庚比肩 时癸伤官(庚生癸 日生他); 오행 庚辛庚癸+午巳辰未',
    },
  },
  {
    id: 'with-time-2000',
    description: '양력 2000-01-01 09:00 여 (참조 사이트 비교용)',
    input: { birthDate: '2000-01-01', birthTime: '09:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
    reference: { source: '수동 확인: beta-ybz6.onrender.com 에서 양력 2000-01-01 09시 여 입력 후 연·월·일·시주 비교' },
  },
  {
    id: 'solar-1988-02-17',
    description: '양력 1988-02-17 08:00 남 (참조 사이트 비교용)',
    input: { birthDate: '1988-02-17', birthTime: '08:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
    reference: { source: '수동 확인: beta-ybz6.onrender.com 에서 양력 1988-02-17 08시 남 입력 후 비교' },
  },
  {
    id: 'lunar-with-time',
    description: '음력 1985-08-15 20:00 남 (추석)',
    input: { birthDate: '1985-08-15', birthTime: '20:00', calendarType: 'lunar', isIntercalation: false, gender: 'M' },
    reference: { source: '수동 확인: beta-ybz6.onrender.com 에서 음력 1985-08-15 20시 입력 후 비교' },
  },
];
