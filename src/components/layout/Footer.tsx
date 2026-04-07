import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[var(--foreground)]">
      <div className="px-5 py-12 mx-auto max-w-7xl sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-white/40">
          <div>
            <p className="font-semibold text-white/60 mb-2">고객센터</p>
            <p className="mt-1">
              카카오톡 채널 gibun_studio 로 문의해주세요
            </p>
            <p className="mt-2">
              월-금 10:00 - 18:00<br />
              lunch 12:00 - 13:00<br />
              토,일요일 및 공휴일 OFF
            </p>
          </div>
          <div>
            <p className="font-semibold text-white/60 mb-2">COMPANY INFO</p>
            <p>올핸즈라운지 | 대표 김지안</p>
            <p>사업자등록번호 : 335-25-01567</p>
            <p>통신판매업신고 : 2024-서울은평-0870</p>
            <p>ADD 서울특별시 은평구 가좌로7나길 30, 103동 806층(응암동, 응암우성아파트)</p>
            <p>TEL 070-7954-9188</p>
            <p>E-MAIL allhandslounge@gmail.com</p>
            <div className="flex gap-3 mt-3">
              <Link href="/privacy" className="underline hover:text-white/60">
                개인정보 처리방침
              </Link>
              <Link href="/terms" className="underline hover:text-white/60">
                이용약관
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
