import React from 'react'
import Card from '@/components/Card/Card'

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          서비스 이용약관
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          최종 수정일: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제1조 (목적)</h2>
        <p className="text-gray-700 dark:text-gray-300">
          본 약관은 Eighternity(이하 "서비스")가 제공하는 AI 기반 에너지 웰니스 서비스의 이용과 관련하여
          서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제2조 (서비스의 성격 및 목적)</h2>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            본 서비스는 생년월일시, 성별 등 개인 정보를 기반으로 AI가 분석한 에너지 패턴을 제공하는
            라이프 인텔리전스 서비스입니다.
          </p>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              ⚠️ 중요한 법적 고지
            </h3>
            <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
              <li>• 본 서비스는 라이프 패턴 분석 기반의 <strong>참고용 가이드</strong>입니다.</li>
              <li>• 의료, 투자, 법률 판단을 대체하지 않습니다.</li>
              <li>• 행운 번호 추천은 <strong>오락용</strong>이며, 실제 로또 당첨을 보장하지 않습니다.</li>
              <li>• 모든 추천 및 가이드는 참고용으로만 활용하시기 바랍니다.</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제3조 (용어의 정의)</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>서비스:</strong> Eighternity가 제공하는 모든 기능 및 콘텐츠</li>
          <li><strong>이용자:</strong> 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원</li>
          <li><strong>회원:</strong> 서비스에 가입하여 계정을 보유한 이용자</li>
          <li><strong>Life Profile:</strong> AI가 분석한 개인 에너지 프로필</li>
          <li><strong>에너지 웰니스:</strong> 개인의 에너지 패턴을 분석하여 제공하는 웰니스 정보</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제4조 (서비스의 제공 및 변경)</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">서비스 제공 내용</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>AI Personal Energy Modeling (에너지 프로필 분석)</li>
              <li>일일 에너지 가이드</li>
              <li>에너지 예보 (30일)</li>
              <li>인생 방향 가이드</li>
              <li>에너지 스팟 추천</li>
              <li>행운 번호 추천 (오락용)</li>
            </ul>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검, 서버 증설 및
            교체, 네트워크 불안정 등의 경우 서비스 제공이 일시 중단될 수 있습니다.
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제5조 (회원가입 및 계정 관리)</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>회원가입은 OAuth 제공자(Kakao, Google 등)를 통한 소셜 로그인으로 진행됩니다.</li>
          <li>서비스 이용을 위해 생년월일, 성별 등 최소한의 정보 입력이 필요합니다.</li>
          <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
          <li>타인의 정보를 도용하여 가입한 경우 서비스 이용이 제한될 수 있습니다.</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제6조 (서비스 이용)</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>이용자는 서비스를 본래의 목적에 맞게 이용해야 합니다.</li>
          <li>서비스의 모든 콘텐츠는 참고용이며, 의사결정의 전적인 근거로 사용해서는 안 됩니다.</li>
          <li>이용자는 서비스를 이용하여 얻은 정보를 상업적 목적으로 이용할 수 없습니다.</li>
          <li>서비스 이용 중 발생한 모든 책임은 이용자에게 있습니다.</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제7조 (지적재산권)</h2>
        <p className="text-gray-700 dark:text-gray-300">
          서비스에 게재된 모든 콘텐츠(텍스트, 그래픽, 로고, 아이콘 등)는 서비스의 지적재산권 및
          소유권에 속합니다. 이용자는 서비스의 명시적 허가 없이 콘텐츠를 복제, 전송, 배포, 수정할 수 없습니다.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제8조 (면책 조항)</h2>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            서비스는 다음의 경우에 대해 책임을 지지 않습니다:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>서비스 제공 중단으로 인한 손해</li>
            <li>이용자가 서비스 정보를 잘못 해석하여 발생한 손해</li>
            <li>서비스의 추천이나 가이드를 근거로 한 의사결정으로 인한 손해</li>
            <li>행운 번호 추천을 실제 로또 구매에 활용하여 발생한 손해</li>
            <li>천재지변, 전쟁, 기간통신사업자의 회선 장애 등 불가항력으로 인한 손해</li>
          </ul>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제9조 (서비스 이용의 제한 및 해지)</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 다음의 경우 이용자의 서비스 이용을 제한하거나 계약을 해지할 수 있습니다:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>타인의 정보를 도용하여 가입한 경우</li>
          <li>서비스의 안정적 운영을 방해하는 경우</li>
          <li>법령 또는 본 약관을 위반한 경우</li>
          <li>기타 서비스가 정한 이용 제한 사유에 해당하는 경우</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제10조 (약관의 변경)</h2>
        <p className="text-gray-700 dark:text-gray-300">
          본 약관은 법령의 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며,
          변경사항은 서비스 홈페이지에 공지함으로써 효력을 발생합니다.
          변경된 약관에 이의가 있는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">제11조 (분쟁의 해결)</h2>
        <p className="text-gray-700 dark:text-gray-300">
          서비스와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법을 적용하며,
          관할법원은 서비스의 본사 소재지를 관할하는 법원으로 합니다.
        </p>
      </Card>
    </div>
  )
}

export default TermsOfService
