/**
 * 내면 아이 유형별 캐릭터 동그라미 프로필.
 *
 * 무료(InnerChildFreeReport)·유료(InnerChildPaidView) 리포트 첫 카드에서 공용으로 쓴다.
 * 에셋: `public/inner-child/types/{schema_id}.png` (Higgsfield 손그림 blob 16종, 크림 배경 1:1).
 * 이미지가 없는(미지원) 유형이면 아무것도 렌더하지 않는다 → 호출부는 그냥 넣기만 하면 된다.
 */
import { innerChildIllustration } from "@/lib/minds/inner-child/type-cards";

export function TypeAvatar({
  schemaId,
  alt,
  size = 92,
}: {
  schemaId: string;
  alt: string;
  size?: number;
}) {
  const src = innerChildIllustration(schemaId);
  if (!src) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: "hidden",
        // 일러스트 배경(크림색)에 맞춰 원 바탕도 크림으로 — 여백이 비쳐도 이질감이 없다.
        background: "#FBF7EE",
        border: "1px solid rgba(255,255,255,.16)",
        boxShadow: "0 10px 26px -10px rgba(255,90,31,.55)",
        flex: "0 0 auto",
      }}
    >
      {/* 여백이 많은 정사각 원본을 살짝 확대해 캐릭터가 원을 더 채우게 한다. */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.16)", display: "block" }}
      />
    </div>
  );
}
