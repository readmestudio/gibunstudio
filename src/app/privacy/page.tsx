import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 기분스튜디오",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">개인정보 처리방침</h1>

      <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground)]/80">
        {/* 1. 총칙 */}
        <section>
          <h2 className="text-base font-semibold mb-3">1. 총칙</h2>
          <p>
            올핸즈라운지(이하 &ldquo;회사&rdquo;)은 「개인정보 보호법」
            제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을
            신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보 처리방침을
            수립·공개합니다.
          </p>
        </section>

        {/* 2. 처리 목적 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            2. 개인정보의 처리 목적
          </h2>
          <p className="mb-2">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
            개인정보는 다음 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
            변경될 시에는 사전 동의를 구합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원가입 및 관리: 본인 확인, 서비스 부정 이용 방지</li>
            <li>
              서비스 제공: AI 기반 심리 분석 리포트 생성, 심리 검사 실시 및 결과
              제공, 1:1 심리 상담 예약·진행
            </li>
            <li>결제 처리: 유료 서비스 결제·환불 처리</li>
            <li>
              알림 서비스: 오픈 알림 신청 시 서비스 출시 안내 발송
            </li>
          </ul>
        </section>

        {/* 3. 수집 항목 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            3. 수집하는 개인정보 항목
          </h2>

          <h3 className="font-medium mt-4 mb-2">필수 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원가입: 이름, 이메일, 전화번호, 비밀번호</li>
            <li>카카오 소셜 로그인: 이메일, 프로필 정보(닉네임)</li>
          </ul>

          <h3 className="font-medium mt-4 mb-2">선택 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>배우자 검사: 생년월일(연·월·일), YouTube 구독 채널 목록</li>
            <li>심리 검사(TCI, 핵심 신념, 애착 검사 등): 설문 응답</li>
            <li>Phase 2 심층 분석: 설문 18문항 응답</li>
            <li>상담 예약: 고민 내용, 상담 목표, 희망 시간대</li>
          </ul>

          <h3 className="font-medium mt-4 mb-2">결제 관련</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>무통장 입금: 입금자명</li>
          </ul>

          <h3 className="font-medium mt-4 mb-2">자동 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 이용 과정에서 생성되는 인증 쿠키(세션 토큰)</li>
          </ul>
        </section>

        {/* 4. 보유 기간 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            4. 개인정보의 처리 및 보유 기간
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 정보: 회원 탈퇴 시 즉시 파기</li>
            <li>분석 리포트(Phase 1·2): 생성일로부터 1년간 보관 후 파기</li>
            <li>YouTube 구독 데이터: 분석 완료 후 1년간 보관 후 파기</li>
            <li>결제 기록: 「전자상거래법」에 따라 5년간 보관</li>
            <li>오픈 알림 신청 정보(이름, 전화번호): 서비스 출시 안내 발송 후 파기</li>
          </ul>
        </section>

        {/* 5. 제3자 제공 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            5. 개인정보의 제3자 제공
          </h2>
          <p className="mb-2">
            회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 서비스 제공을 위해 다음과 같이 제3자에게 정보가 전달될 수
            있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[var(--foreground)]/20 text-xs">
              <thead>
                <tr className="bg-[var(--foreground)]/5">
                  <th className="border border-[var(--foreground)]/20 px-3 py-2 text-left">
                    제공받는 자
                  </th>
                  <th className="border border-[var(--foreground)]/20 px-3 py-2 text-left">
                    제공 항목
                  </th>
                  <th className="border border-[var(--foreground)]/20 px-3 py-2 text-left">
                    제공 목적
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Google (YouTube API)
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Google 계정 인증 정보
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    YouTube 구독 채널 조회
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Google (Gemini AI)
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    구독 채널 목록, 설문 응답(비식별 처리)
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    AI 심리 분석 리포트 생성
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Kakao
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Kakao 계정 인증 정보
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    소셜 로그인
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. 처리 위탁 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            6. 개인정보 처리 위탁
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[var(--foreground)]/20 text-xs">
              <thead>
                <tr className="bg-[var(--foreground)]/5">
                  <th className="border border-[var(--foreground)]/20 px-3 py-2 text-left">
                    수탁업체
                  </th>
                  <th className="border border-[var(--foreground)]/20 px-3 py-2 text-left">
                    위탁 업무
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    Supabase Inc.
                  </td>
                  <td className="border border-[var(--foreground)]/20 px-3 py-2">
                    회원 인증 및 데이터 저장·관리
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. 정보주체 권리 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            7. 정보주체의 권리·의무 및 행사 방법
          </h2>
          <p className="mb-2">
            정보주체는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수
            있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리정지 요구</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 아래 개인정보 보호책임자에게 이메일 또는 카카오톡으로
            요청하실 수 있으며, 회사는 지체 없이 조치하겠습니다.
          </p>
        </section>

        {/* 8. 파기 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            8. 개인정보의 파기
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              파기 시기: 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이
              파기합니다.
            </li>
            <li>
              파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며,
              종이 문서는 분쇄하거나 소각합니다.
            </li>
          </ul>
        </section>

        {/* 9. 쿠키 */}
        <section>
          <h2 className="text-base font-semibold mb-3">9. 쿠키의 사용</h2>
          <p className="mb-2">
            회사는 다음의 목적으로 쿠키를 사용합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              인증 쿠키: 로그인 상태 유지를 위한 세션 토큰 저장 (Supabase Auth)
            </li>
            <li>
              리다이렉트 쿠키: 소셜 로그인 후 원래 페이지로 복귀하기 위한 경로
              저장 (최대 10분 후 자동 삭제)
            </li>
          </ul>
          <p className="mt-2">
            브라우저 설정을 통해 쿠키를 거부할 수 있으나, 이 경우 로그인이
            필요한 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        {/* 10. 안전성 확보 조치 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            10. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>비밀번호 암호화 저장</li>
            <li>SSL/TLS 암호화 통신</li>
            <li>접근 권한 관리 및 제한</li>
            <li>개인정보 접근 기록 보관</li>
          </ul>
        </section>

        {/* 11. 보호책임자 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            11. 개인정보 보호책임자
          </h2>
          <ul className="list-none space-y-1">
            <li>회사명: 올핸즈라운지 (대표 김지안)</li>
            <li>이메일: allhandslounge@gmail.com</li>
            <li>카카오톡: gibun_studio</li>
            <li>전화: 070-7954-9188</li>
          </ul>
        </section>

        {/* 12. 고충 처리 */}
        <section>
          <h2 className="text-base font-semibold mb-3">
            12. 권익침해 구제 방법
          </h2>
          <p className="mb-2">
            개인정보 침해에 대한 신고·상담이 필요하신 경우 아래 기관에 문의하실 수
            있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 침해신고센터: (국번없이) 118</li>
            <li>개인정보 분쟁조정위원회: 1833-6972</li>
            <li>대검찰청 사이버수사과: (국번없이) 1301</li>
            <li>경찰청 사이버안전국: (국번없이) 182</li>
          </ul>
        </section>

        {/* 13. 시행일 */}
        <section>
          <h2 className="text-base font-semibold mb-3">13. 시행일</h2>
          <p>본 개인정보 처리방침은 2026년 4월 3일부터 시행됩니다.</p>
        </section>
      </div>
    </main>
  );
}
