"use client";

/**
 * [개발 미리보기] /dev/inner-child-en
 *
 * 영어 무료 리포트(InnerChildEnFreeReport)를 로그인·DB 없이 16유형별로 확인한다.
 * 밤하늘 시네마틱 서사 브릿지 + 라벤더/다크세피아 톤(KR 개편과 정렬)을 육안 검수하기 위함.
 * free={null} 이면 리포트가 staticPortrait 등 카드 폴백으로 채운다(실서비스 폴백과 동일).
 * (배포 화면과 무관, 언제든 삭제 가능.)
 */

import { useState, type CSSProperties } from "react";
import { InnerChildEnFreeReport } from "@/components/minds/inner-child/en/report/InnerChildEnFreeReport";
import { EN_TYPE_CARDS, getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";

const IDS = Object.keys(EN_TYPE_CARDS);

export default function InnerChildEnDevPage() {
  const [id, setId] = useState(IDS[0]);
  const card = getEnTypeCard(id);

  return (
    <div style={{ position: "relative" }}>
      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        style={selectStyle}
      >
        {IDS.map((s) => (
          <option key={s} value={s}>
            {getEnTypeCard(s)?.child_name ?? s}
          </option>
        ))}
      </select>

      {card ? (
        <InnerChildEnFreeReport key={id} card={card} free={null} leadId="preview" />
      ) : (
        <div style={{ height: "100dvh", background: "#15120D", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <p style={{ color: "#EDE4D3", fontFamily: "'Pretendard',sans-serif", textAlign: "center" }}>
            (type card not written — {id})
          </p>
        </div>
      )}
    </div>
  );
}

const selectStyle: CSSProperties = {
  position: "fixed",
  top: 12,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 80,
  background: "#211D18",
  color: "#EDE4D3",
  border: "1px solid rgba(237,228,211,.25)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "ui-monospace,Menlo,monospace",
};
