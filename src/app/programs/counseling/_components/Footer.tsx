import Link from "next/link";
import { PROGRAMS_HREF } from "../content";

/**
 * 페이지 하단 푸터 — 프로그램 목록으로 돌아가기.
 */
export function Footer() {
  return (
    <div className="foot">
      <Link href={PROGRAMS_HREF}>← 프로그램 목록으로</Link>
    </div>
  );
}
