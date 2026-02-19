/**
 * 대한민국 행정구역: 시·도 → 구·군 (시·군 단위)
 * 거주 지역 선택용. 선택사항이므로 빈 값 허용.
 */
export interface RegionSido {
  name: string
  sigungu: string[]
}

export const REGION_SIDO_GUN: RegionSido[] = [
  { name: '서울특별시', sigungu: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'] },
  { name: '부산광역시', sigungu: ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'] },
  { name: '대구광역시', sigungu: ['남구', '달서구', '동구', '북구', '서구', '수성구', '중구', '달성군'] },
  { name: '인천광역시', sigungu: ['계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'] },
  { name: '광주광역시', sigungu: ['광산구', '남구', '동구', '북구', '서구'] },
  { name: '대전광역시', sigungu: ['대덕구', '동구', '서구', '유성구', '중구'] },
  { name: '울산광역시', sigungu: ['남구', '동구', '북구', '중구', '울주군'] },
  { name: '세종특별자치시', sigungu: [] },
  { name: '경기도', sigungu: ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'] },
  { name: '강원특별자치도', sigungu: ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'] },
  { name: '충청북도', sigungu: ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '진천군', '청주시', '충주시', '증평군'] },
  { name: '충청남도', sigungu: ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'] },
  { name: '전북특별자치도', sigungu: ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'] },
  { name: '전라남도', sigungu: ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'] },
  { name: '경상북도', sigungu: ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'] },
  { name: '경상남도', sigungu: ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'] },
  { name: '제주특별자치도', sigungu: ['서귀포시', '제주시'] },
]

/** 저장용 문자열 생성: "시도 구군" (구군 없으면 시도만) */
export function formatRegionValue(sido: string, sigungu: string): string {
  if (!sido) return ''
  if (!sigungu) return sido
  return `${sido} ${sigungu}`
}

function normalizeSidoForMatch(name: string): string {
  return name.replace('특별시', '시').replace('광역시', '시').replace('특별자치시', '시').replace('특별자치도', '도')
}

/** 저장된 region 문자열을 [시도, 구군]으로 파싱 (기존 "서울시 강남구" 등도 처리) */
export function parseRegionValue(region: string | null | undefined): [string, string] {
  if (!region || !region.trim()) return ['', '']
  const trimmed = region.trim()
  const firstSpace = trimmed.indexOf(' ')
  if (firstSpace === -1) {
    const matched = REGION_SIDO_GUN.find(s => s.name === trimmed || normalizeSidoForMatch(s.name) === trimmed)
    if (matched) return [matched.name, '']
    return [trimmed, '']
  }
  const part1 = trimmed.slice(0, firstSpace).trim()
  const part2 = trimmed.slice(firstSpace + 1).trim()
  const normalizedSido = REGION_SIDO_GUN.find(s => s.name === part1 || normalizeSidoForMatch(s.name) === part1)?.name ?? part1
  return [normalizedSido, part2]
}
