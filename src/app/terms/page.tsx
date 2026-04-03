import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 이용약관 | 기분스튜디오",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">서비스 이용약관</h1>

      <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground)]/80">
        {/* 1. 목적 */}
        <section>
          <h2 className="text-base font-semibold mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 주식회사 원모어스푼(이하 &ldquo;회사&rdquo;)이 운영하는
            기분스튜디오 서비스(이하 &ldquo;서비스&rdquo;)의 이용 조건 및 절차,
            회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        {/* 2. 정의 */}
        <section>
          <h2 className="text-base font-semibold mb-3">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              &ldquo;서비스&rdquo;란 회사가 제공하는 AI 기반 심리 분석 리포트,
              심리 검사, 1:1 심리 상담 등 일체의 서비스를 말합니다.
            </li>
            <li>
              &ldquo;이용자&rdquo;란 본 약관에 동의하고 서비스를 이용하는
              회원 및 비회원을 말합니다.
            </li>
            <li>
              &ldquo;회원&rdquo;이란 회사에 개인정보를 제공하여 회원등록을 한
              자로서, 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
            </li>
          </ul>
        </section>

        {/* 3. 약관의 효력 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제3조 (약관의 효력 및 변경)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게
              공지함으로써 효력이 발생합니다.
            </li>
            <li>
              회사는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며,
              변경 시 시행일 7일 전부터 서비스 내 공지합니다.
            </li>
          </ul>
        </section>

        {/* 4. 서비스 내용 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제4조 (서비스의 내용)
          </h2>
          <p className="mb-2">회사가 제공하는 서비스는 다음과 같습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              내면 분석 리포트: YouTube 구독 데이터 및 설문 응답을 기반으로 한
              AI 심리 분석 리포트 (TCI/Enneagram/MBTI 기반)
            </li>
            <li>
              심리 검사: TCI 기질성격검사, 핵심 신념 검사, 연애 애착 검사 등
            </li>
            <li>1:1 심리 상담: Zoom 화상 상담 (1급 심리상담사 진행)</li>
            <li>기타 회사가 추가 개발하여 제공하는 서비스</li>
          </ul>
        </section>

        {/* 5. 회원가입 및 탈퇴 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제5조 (회원가입 및 탈퇴)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              이용자는 회사가 정한 양식에 따라 정보를 기입하고 본 약관에
              동의함으로써 회원가입을 신청합니다.
            </li>
            <li>
              회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를
              처리합니다.
            </li>
            <li>
              탈퇴 시 회원의 개인정보 및 분석 데이터는 개인정보 처리방침에 따라
              파기됩니다. 단, 법령에 따라 보관이 필요한 정보는 해당 기간 동안
              보관합니다.
            </li>
          </ul>
        </section>

        {/* 6. 서비스 이용 제한 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제6조 (서비스 이용 제한)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              내면 분석 리포트(배우자 검사)는 1인 1회 제공되며, 재분석은
              불가합니다.
            </li>
            <li>분석 리포트는 생성일로부터 1년간 보관됩니다.</li>
            <li>
              회사는 다음 사유에 해당하는 경우 서비스 이용을 제한하거나 회원
              자격을 상실시킬 수 있습니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>타인의 정보를 도용한 경우</li>
                <li>서비스 운영을 고의로 방해한 경우</li>
                <li>기타 관련 법령 또는 본 약관을 위반한 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* 7. 결제 및 환불 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제7조 (결제 및 환불)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              유료 서비스의 결제는 무통장 입금 등 회사가 정한 방법으로
              진행됩니다.
            </li>
            <li>
              <span className="font-medium">환불 정책:</span>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  Phase 2 심층 리포트: 설문(서베이) 제출 전 — 전액 환불 / 설문
                  제출 후 — 환불 불가
                </li>
                <li>
                  TCI·MMPI 심리 검사: 검사 링크 발송 전 — 전액 환불 / 검사
                  실시 후 — 환불 불가
                </li>
                <li>
                  1:1 심리 상담: 상담 진행 전 — 전액 환불 / 상담 진행 후 —
                  환불 불가
                </li>
              </ul>
            </li>
            <li>
              환불 신청은 카카오톡 <span className="font-medium">gibun_studio</span>로
              문의해주세요.
            </li>
          </ul>
        </section>

        {/* 8. 면책 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제8조 (면책 조항)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              본 서비스에서 제공하는 AI 분석 리포트 및 심리 검사 결과는 참고
              자료이며, <span className="font-medium">의료 진단이나 치료를 대체하지
              않습니다.</span>
            </li>
            <li>
              심각한 심리적 어려움이 있는 경우 반드시 전문 의료기관의 상담을
              받으시기 바랍니다.
            </li>
            <li>
              회사는 천재지변, 시스템 장애 등 불가항력으로 인해 서비스를 제공할
              수 없는 경우 책임이 면제됩니다.
            </li>
            <li>
              이용자가 자신의 개인정보를 부주의하게 관리하여 발생하는 문제에
              대해 회사는 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        {/* 9. 지적재산권 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제9조 (지적재산권)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              서비스 내 콘텐츠(분석 알고리즘, 리포트 양식, 디자인, 텍스트 등)에
              대한 저작권 및 지적재산권은 회사에 귀속됩니다.
            </li>
            <li>
              이용자는 서비스를 통해 제공받은 리포트를 개인 용도로만 사용할 수
              있으며, 회사의 사전 동의 없이 상업적으로 이용하거나 제3자에게
              제공할 수 없습니다.
            </li>
          </ul>
        </section>

        {/* 10. 분쟁 해결 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            제10조 (분쟁 해결)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              본 약관에 관한 분쟁은 대한민국 법률을 적용하며, 서울중앙지방법원을
              관할 법원으로 합니다.
            </li>
            <li>
              서비스 이용과 관련한 분쟁이 발생한 경우 회사와 이용자는 상호
              협의하여 해결하도록 노력합니다.
            </li>
          </ul>
        </section>

        {/* 부칙 */}
        <section>
          <h2 className="text-base font-semibold mb-3">부칙</h2>
          <p>본 약관은 2026년 4월 3일부터 시행됩니다.</p>
        </section>
      </div>
    </main>
  );
}
