export function Footer() {
  return (
    <footer className="bg-[var(--foreground)]">
      <div className="px-5 py-12 mx-auto max-w-7xl sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-white/40">
          <div>
            <p className="font-semibold text-white/60 mb-2">고객센터</p>
            <p className="text-base font-bold text-white/80">070-7954-9188</p>
            <p className="mt-1">
              월-금 10:00 - 18:00<br />
              lunch 12:00 - 13:00<br />
              토,일요일 및 공휴일 OFF
            </p>
          </div>
          <div>
            <p className="font-semibold text-white/60 mb-2">COMPANY INFO</p>
            <p>주식회사 원모어스푼 CEO 손창민</p>
            <p>CPO 주식회사 원모어스푼 (2morespoons@gmail.com)</p>
            <p>NETWORK NO. 2025-서울마포-0668</p>
            <p>COMPANY NO. 143-88-03414</p>
            <p>ADD 서울특별시 마포구 마포대로 12 (마포동) 1606-씨13호</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
