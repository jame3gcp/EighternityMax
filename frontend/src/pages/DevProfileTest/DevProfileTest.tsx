import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { userApi, profileApi } from '@/services/api'
import Card from '@/components/Card/Card'
import type { Profile } from '@/types'

/**
 * 개발 단계 결과 테스트 및 확인용 임시 페이지.
 * 가입 시 입력한 프로필·사주 결과를 확인하고, 참조 사이트 비교용 입력을 제공합니다.
 */
const DevProfileTest: React.FC = () => {
  const { user, setUser } = useUserStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        try {
          const u = await userApi.getCurrentUser()
          setUser(u)
        } catch {
          setLoading(false)
          return
        }
      }
      try {
        const p = await profileApi.getProfile()
        setProfile(p ?? null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, setUser])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 rounded-lg">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          🧪 개발 단계 결과 테스트 및 확인용 임시 페이지입니다. 배포 전 제거하거나 비공개로 전환하세요.
        </p>
        <Link to="/mypage" className="text-sm text-amber-700 dark:text-amber-300 underline mt-2 inline-block">
          마이페이지로 이동
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">프로필 · 결과 테스트</h1>

      {/* 사용자 정보 */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">사용자 정보</h2>
        {user ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500 dark:text-gray-400">이름</dt>
            <dd className="font-medium">{user.name}</dd>
            <dt className="text-gray-500 dark:text-gray-400">이메일</dt>
            <dd className="font-medium">{user.email ?? '-'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">ID</dt>
            <dd className="font-mono text-xs break-all">{user.id}</dd>
          </dl>
        ) : (
          <p className="text-gray-500">로그인된 사용자 정보가 없습니다.</p>
        )}
      </Card>

      {/* 가입 시 입력한 프로필 정보 */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">가입 시 입력한 프로필 정보</h2>
        {profile ? (
          <>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
              <dt className="text-gray-500 dark:text-gray-400">입력 기준 (양력/음력)</dt>
              <dd className="font-medium">
                {profile.saju?.calendarType === 'lunar'
                  ? `음력${profile.saju?.isIntercalation ? ' (윤달)' : ''}`
                  : '양력'}
              </dd>
              <dt className="text-gray-500 dark:text-gray-400">생년월일</dt>
              <dd className="font-medium">{profile.birthDate}</dd>
              <dt className="text-gray-500 dark:text-gray-400">출생 시간</dt>
              <dd className="font-medium">{profile.birthTime ?? '-'}</dd>
              <dt className="text-gray-500 dark:text-gray-400">성별</dt>
              <dd className="font-medium">{profile.gender === 'M' ? '남' : profile.gender === 'F' ? '여' : '기타'}</dd>
              <dt className="text-gray-500 dark:text-gray-400">거주 지역</dt>
              <dd className="font-medium">{profile.region ?? '-'}</dd>
            </dl>

            {/* 참조 사이트 비교용 입력 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                참조 사이트 비교용 입력 (beta-ybz6.onrender.com)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                아래 값을 참조 사이트에 그대로 입력하면 우리 계산 결과와 비교할 수 있습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">양력/음력</th>
                      <th className="px-3 py-2 text-left">생년월일</th>
                      <th className="px-3 py-2 text-left">시간</th>
                      <th className="px-3 py-2 text-left">성별</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2">
                        {profile.saju?.calendarType === 'lunar'
                          ? `음력${profile.saju?.isIntercalation ? ' (윤달)' : ''}`
                          : '양력'}
                      </td>
                      <td className="px-3 py-2 font-mono">{profile.birthDate}</td>
                      <td className="px-3 py-2 font-mono">{profile.birthTime ?? '-'}</td>
                      <td className="px-3 py-2">{profile.gender === 'M' ? '남' : profile.gender === 'F' ? '여' : '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">저장된 프로필이 없습니다. 마이페이지에서 프로필을 입력해주세요.</p>
        )}
      </Card>

      {/* 사주 결과 (계산 결과 테스트용) */}
      {profile?.saju && (
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">사주 결과 (테스트 확인용)</h2>

          {profile.saju.gapjaKorean && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">사주 4주</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">한글</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.year ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.month ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.day ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.hour ?? '-'}</td>
                    </tr>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium">한자</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.year ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.month ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.day ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.hour ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.saju.ohang?.distribution && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">오행 분포</h3>
              <p className="text-sm">
                목 {profile.saju.ohang.distribution.목 ?? 0} · 화 {profile.saju.ohang.distribution.화 ?? 0} · 토{' '}
                {profile.saju.ohang.distribution.토 ?? 0} · 금 {profile.saju.ohang.distribution.금 ?? 0} · 수{' '}
                {profile.saju.ohang.distribution.수 ?? 0}
              </p>
            </div>
          )}

          {(profile.saju.sipseong || profile.saju.unseong12) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">십성 &amp; 12운성</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju.sipseong && (
                      <tr>
                        <td className="px-3 py-2 font-medium">십성</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.year?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.month?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.day?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.hour?.ko ?? '-'}</td>
                      </tr>
                    )}
                    {profile.saju.unseong12 && (
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                        <td className="px-3 py-2 font-medium">12운성</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.year?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.month?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.day?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.hour?.ko ?? '-'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.saju.cheonganRelation && Object.values(profile.saju.cheonganRelation).some((arr) => arr?.length) && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">천간 특수관계</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">천간 합/冲</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((k) => (
                        <td key={k} className="px-3 py-2">
                          {profile.saju.cheonganRelation![k]?.length
                            ? profile.saju.cheonganRelation![k].map((r, i) => (
                                <span key={i}>{r.typeKo}{r.withStem} </span>
                              ))
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(profile.saju.sinsal12Pillar || profile.saju.sinsalCombined || profile.saju.sinsal12) && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">십이신살·신살 종합</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">십이신살</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((p) => (
                        <td key={p} className="px-3 py-2">
                          {profile.saju.sinsal12?.[p]?.map((s) => s.ko).join(', ') ?? '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium">신살</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((p) => (
                        <td key={p} className="px-3 py-2">
                          {profile.saju.sinsalCombined?.[p]?.join(', ') ?? '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.saju.daeun?.steps?.length && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">대운</h3>
              {profile.saju.daeun.note && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{profile.saju.daeun.note}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">대운나이</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju.daeun.steps.map((s, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-3 py-2">{s.age ?? [7, 17, 27, 37, 47, 57, 67, 77, 87, 97][i]}세</td>
                        <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                        <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                        <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.saju.seun?.length && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">세운(년운)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">현재 연도 중심, 올해 행 강조.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">연도</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju.seun.map((s, i) => {
                      const isCurrentYear = s.year === new Date().getFullYear();
                      return (
                        <tr
                          key={i}
                          className={`border-t border-gray-200 dark:border-gray-600 ${isCurrentYear ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-400 dark:ring-green-600' : ''}`}
                        >
                          <td className="px-3 py-2 font-medium">{s.year}{isCurrentYear ? ' (올해)' : ''}</td>
                          <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                          <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                          <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.saju.woleun?.length && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">월운</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">당해년 기준, 12월→1월 순 (참조 사이트와 동일)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">월운월</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...profile.saju.woleun]
                      .sort((a, b) => b.month - a.month)
                      .map((s) => (
                        <tr key={s.month} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-3 py-2">{s.month}월</td>
                          <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                          <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                          <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Raw JSON (개발 확인용) */}
      <Card className="mb-6">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {showRaw ? '▼' : '▶'} Raw JSON (개발 확인용)
        </button>
        {showRaw && (
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify({ user, profile }, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  )
}

export default DevProfileTest
