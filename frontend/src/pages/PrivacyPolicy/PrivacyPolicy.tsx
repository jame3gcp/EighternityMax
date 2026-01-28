import React from 'react'
import Card from '@/components/Card/Card'

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          개인정보 처리방침
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          최종 수정일: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">1. 개인정보의 수집 및 이용 목적</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Eighternity(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>AI Personal Energy Modeling을 통한 개인화된 에너지 분석 제공</li>
          <li>맞춤형 일일 가이드 및 에너지 예보 제공</li>
          <li>서비스 이용 기록 분석 및 서비스 개선</li>
          <li>고객 문의 및 불만 처리</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">2. 수집하는 개인정보 항목</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">필수 수집 항목</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>생년월일</li>
              <li>성별</li>
              <li>OAuth 제공자 정보 (Kakao, Google 등)</li>
              <li>서비스 이용 기록 (에너지 사이클, 일일 기록 등)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">선택 수집 항목</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>출생 시간</li>
              <li>거주 지역</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">자동 수집 항목</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>IP 주소, 쿠키, 접속 로그</li>
              <li>기기 정보, 브라우저 정보</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">3. 개인정보의 보관 및 이용 기간</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>회원 탈퇴 시: 즉시 삭제 (단, 법적 의무 보관 기간이 있는 경우 해당 기간 보관)</li>
          <li>법적 의무 보관 기간: 관련 법령에 따라 일정 기간 보관 후 파기</li>
          <li>서비스 이용 기록: 회원 탈퇴 시까지 보관</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">4. 개인정보의 제3자 제공</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          다만, 다음의 경우에는 예외로 합니다:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">5. 개인정보 처리 위탁</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁할 수 있습니다.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현재 개인정보 처리 위탁 업체는 없습니다. 향후 위탁이 필요한 경우,
            사전에 공지하고 이용자의 동의를 받겠습니다.
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">6. 이용자의 권리 및 행사 방법</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          이용자는 다음과 같은 권리를 행사할 수 있습니다:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>개인정보 열람 요구</li>
          <li>개인정보 정정·삭제 요구</li>
          <li>개인정보 처리정지 요구</li>
          <li>개인정보 수집 및 이용 동의 철회</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          위 권리 행사는 마이페이지에서 직접 처리하거나, 고객센터를 통해 요청할 수 있습니다.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">7. 개인정보의 파기</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 개인정보 보관기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
          지체 없이 해당 개인정보를 파기합니다.
        </p>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><strong>파기 방법:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
            <li>기록물, 인쇄물, 서면 등: 분쇄하거나 소각</li>
          </ul>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">8. 개인정보 보호책임자</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
          정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>개인정보 보호책임자</strong>
            <br />
            이메일: privacy@eighternity.com
            <br />
            문의: 마이페이지의 문의하기 메뉴를 통해 연락 가능
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">9. 개인정보 처리방침 변경</h2>
        <p className="text-gray-700 dark:text-gray-300">
          이 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
          변경사항의 시행 7일 전부터 서비스 홈페이지의 공지사항을 통하여 고지할 것입니다.
        </p>
      </Card>
    </div>
  )
}

export default PrivacyPolicy
