import Link from "next/link";
import { PROGRAMS_HREF } from "../content";

/**
 * [0] 상단 sticky 백 바 — 좌: 프로그램 목록으로, 우: 브랜드 마크.
 */
export function BackBar() {
  return (
    <div className="backbar">
      <div className="backbar-inner">
        <Link href={PROGRAMS_HREF} className="back">
          <span className="arr">←</span> 프로그램 목록
        </Link>
        <span className="brand">
          <span className="mk" />
          기분 심리상담소
        </span>
      </div>
    </div>
  );
}
