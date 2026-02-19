import { and, eq, ne } from 'drizzle-orm';
import { db } from '../models/db.js';
import { siteContents } from '../models/schema.js';

const TERMS_OF_SERVICE_HTML = `
<h2>제1조 (목적)</h2>
<p>본 약관은 Eighternity(이하 "서비스")가 제공하는 AI 기반 에너지 웰니스 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

<h2>제2조 (서비스의 성격 및 목적)</h2>
<p>본 서비스는 생년월일시, 성별 등 개인 정보를 기반으로 AI가 분석한 에너지 패턴을 제공하는 라이프 인텔리전스 서비스입니다.</p>
<h3>중요한 법적 고지</h3>
<ul>
  <li>본 서비스는 라이프 패턴 분석 기반의 <strong>참고용 가이드</strong>입니다.</li>
  <li>의료, 투자, 법률 판단을 대체하지 않습니다.</li>
  <li>행운 번호 추천은 <strong>오락용</strong>이며, 실제 로또 당첨을 보장하지 않습니다.</li>
  <li>모든 추천 및 가이드는 참고용으로만 활용하시기 바랍니다.</li>
</ul>

<h2>제3조 (용어의 정의)</h2>
<ul>
  <li><strong>서비스:</strong> Eighternity가 제공하는 모든 기능 및 콘텐츠</li>
  <li><strong>이용자:</strong> 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원</li>
  <li><strong>회원:</strong> 서비스에 가입하여 계정을 보유한 이용자</li>
  <li><strong>Life Profile:</strong> AI가 분석한 개인 에너지 프로필</li>
  <li><strong>에너지 웰니스:</strong> 개인의 에너지 패턴을 분석하여 제공하는 웰니스 정보</li>
</ul>

<h2>제4조 (서비스의 제공 및 변경)</h2>
<h3>서비스 제공 내용</h3>
<ul>
  <li>AI Personal Energy Modeling (에너지 프로필 분석)</li>
  <li>일일 에너지 가이드</li>
  <li>에너지 예보 (30일)</li>
  <li>인생 방향 가이드</li>
  <li>에너지 스팟 추천</li>
  <li>행운 번호 추천 (오락용)</li>
</ul>
<p>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검, 서버 증설 및 교체, 네트워크 불안정 등의 경우 서비스 제공이 일시 중단될 수 있습니다.</p>

<h2>제5조 (회원가입 및 계정 관리)</h2>
<ul>
  <li>회원가입은 OAuth 제공자(Kakao, Google 등)를 통한 소셜 로그인으로 진행됩니다.</li>
  <li>서비스 이용을 위해 생년월일, 성별 등 최소한의 정보 입력이 필요합니다.</li>
  <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
  <li>타인의 정보를 도용하여 가입한 경우 서비스 이용이 제한될 수 있습니다.</li>
</ul>

<h2>제6조 (서비스 이용)</h2>
<ul>
  <li>이용자는 서비스를 본래의 목적에 맞게 이용해야 합니다.</li>
  <li>서비스의 모든 콘텐츠는 참고용이며, 의사결정의 전적인 근거로 사용해서는 안 됩니다.</li>
  <li>이용자는 서비스를 이용하여 얻은 정보를 상업적 목적으로 이용할 수 없습니다.</li>
  <li>서비스 이용 중 발생한 모든 책임은 이용자에게 있습니다.</li>
</ul>

<h2>제7조 (지적재산권)</h2>
<p>서비스에 게재된 모든 콘텐츠(텍스트, 그래픽, 로고, 아이콘 등)는 서비스의 지적재산권 및 소유권에 속합니다. 이용자는 서비스의 명시적 허가 없이 콘텐츠를 복제, 전송, 배포, 수정할 수 없습니다.</p>

<h2>제8조 (면책 조항)</h2>
<p>서비스는 다음의 경우에 대해 책임을 지지 않습니다:</p>
<ul>
  <li>서비스 제공 중단으로 인한 손해</li>
  <li>이용자가 서비스 정보를 잘못 해석하여 발생한 손해</li>
  <li>서비스의 추천이나 가이드를 근거로 한 의사결정으로 인한 손해</li>
  <li>행운 번호 추천을 실제 로또 구매에 활용하여 발생한 손해</li>
  <li>천재지변, 전쟁, 기간통신사업자의 회선 장애 등 불가항력으로 인한 손해</li>
</ul>

<h2>제9조 (서비스 이용의 제한 및 해지)</h2>
<p>서비스는 다음의 경우 이용자의 서비스 이용을 제한하거나 계약을 해지할 수 있습니다:</p>
<ul>
  <li>타인의 정보를 도용하여 가입한 경우</li>
  <li>서비스의 안정적 운영을 방해하는 경우</li>
  <li>법령 또는 본 약관을 위반한 경우</li>
  <li>기타 서비스가 정한 이용 제한 사유에 해당하는 경우</li>
</ul>

<h2>제10조 (약관의 변경)</h2>
<p>본 약관은 법령의 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경사항은 서비스 홈페이지에 공지함으로써 효력을 발생합니다. 변경된 약관에 이의가 있는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</p>

<h2>제11조 (분쟁의 해결)</h2>
<p>서비스와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법을 적용하며, 관할법원은 서비스의 본사 소재지를 관할하는 법원으로 합니다.</p>
`.trim();

const PRIVACY_POLICY_HTML = `
<h2>1. 개인정보의 수집 및 이용 목적</h2>
<p>Eighternity(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
<ul>
  <li>AI Personal Energy Modeling을 통한 개인화된 에너지 분석 제공</li>
  <li>맞춤형 일일 가이드 및 에너지 예보 제공</li>
  <li>서비스 이용 기록 분석 및 서비스 개선</li>
  <li>고객 문의 및 불만 처리</li>
</ul>

<h2>2. 수집하는 개인정보 항목</h2>
<h3>필수 수집 항목</h3>
<ul>
  <li>생년월일</li>
  <li>성별</li>
  <li>OAuth 제공자 정보 (Kakao, Google 등)</li>
  <li>서비스 이용 기록 (에너지 사이클, 일일 기록 등)</li>
</ul>
<h3>선택 수집 항목</h3>
<ul>
  <li>출생 시간</li>
  <li>거주 지역</li>
</ul>
<h3>자동 수집 항목</h3>
<ul>
  <li>IP 주소, 쿠키, 접속 로그</li>
  <li>기기 정보, 브라우저 정보</li>
</ul>

<h2>3. 개인정보의 보관 및 이용 기간</h2>
<p>서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
<ul>
  <li>회원 탈퇴 시: 즉시 삭제 (단, 법적 의무 보관 기간이 있는 경우 해당 기간 보관)</li>
  <li>법적 의무 보관 기간: 관련 법령에 따라 일정 기간 보관 후 파기</li>
  <li>서비스 이용 기록: 회원 탈퇴 시까지 보관</li>
</ul>

<h2>4. 개인정보의 제3자 제공</h2>
<p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
<p>다만, 다음의 경우에는 예외로 합니다:</p>
<ul>
  <li>이용자가 사전에 동의한 경우</li>
  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
</ul>

<h2>5. 개인정보 처리 위탁</h2>
<p>서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁할 수 있습니다.</p>
<p>현재 개인정보 처리 위탁 업체는 없습니다. 향후 위탁이 필요한 경우, 사전에 공지하고 이용자의 동의를 받겠습니다.</p>

<h2>6. 이용자의 권리 및 행사 방법</h2>
<p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
<ul>
  <li>개인정보 열람 요구</li>
  <li>개인정보 정정·삭제 요구</li>
  <li>개인정보 처리정지 요구</li>
  <li>개인정보 수집 및 이용 동의 철회</li>
</ul>
<p>위 권리 행사는 마이페이지에서 직접 처리하거나, 고객센터를 통해 요청할 수 있습니다.</p>

<h2>7. 개인정보의 파기</h2>
<p>서비스는 개인정보 보관기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
<p><strong>파기 방법:</strong></p>
<ul>
  <li>전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
  <li>기록물, 인쇄물, 서면 등: 분쇄하거나 소각</li>
</ul>

<h2>8. 개인정보 보호책임자</h2>
<p>서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
<p><strong>개인정보 보호책임자</strong><br />이메일: privacy@eighternity.com<br />문의: 마이페이지의 문의하기 메뉴를 통해 연락 가능</p>

<h2>9. 개인정보 처리방침 변경</h2>
<p>이 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 홈페이지의 공지사항을 통하여 고지할 것입니다.</p>
`.trim();

const LEGAL_SEEDS = [
  {
    id: 'sc_terms_of_service_v1_0_0',
    contentKey: 'terms_of_service',
    title: '서비스 이용약관',
    contentMarkdown: TERMS_OF_SERVICE_HTML,
    version: '1.0.0',
  },
  {
    id: 'sc_privacy_policy_v1_0_0',
    contentKey: 'privacy_policy',
    title: '개인정보 처리방침',
    contentMarkdown: PRIVACY_POLICY_HTML,
    version: '1.0.0',
  },
];

async function seedLegalContent() {
  const now = new Date();

  for (const item of LEGAL_SEEDS) {
    await db.transaction(async (tx) => {
      await tx.update(siteContents)
        .set({ status: 'archived', updatedAt: now })
        .where(and(
          eq(siteContents.contentKey, item.contentKey),
          eq(siteContents.status, 'active'),
          ne(siteContents.version, item.version)
        ));

      await tx.insert(siteContents)
        .values({
          ...item,
          status: 'active',
          effectiveAt: now,
          publishedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [siteContents.contentKey, siteContents.version],
          set: {
            title: item.title,
            contentMarkdown: item.contentMarkdown,
            status: 'active',
            effectiveAt: now,
            publishedAt: now,
            updatedAt: now,
          },
        });
    });

    console.log(`Seeded ${item.contentKey}@${item.version} as active.`);
  }
}

seedLegalContent()
  .then(() => {
    console.log('Legal content seed completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Legal content seed failed:', error);
    process.exit(1);
  });
