"use client";

import { MeshGradient } from "@paper-design/shaders-react";

/**
 * 히어로 배경에 깔리는 "일렁이는" 셰이더 모션.
 * - WebGL을 쓰므로 클라이언트 컴포넌트로 분리 (Hero는 서버 컴포넌트 유지).
 * - 레퍼런스 영상 기준 파스텔(세이지·틸·피치·라임·크림) 팔레트 + 데모 모션(distortion 1.2 / speed 0.8).
 * - 흰 글씨 가독성은 mesh-veil(가운데 옅은 스크림) + 글자 그림자로 확보.
 */
export function MeshGradientBg() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <MeshGradient
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
        colors={["#72b9bb", "#b5d9d9", "#ffd1bd", "#ffebe0", "#8cc5b8", "#dbf4a4"]}
        distortion={1.2}
        swirl={0.6}
        grainMixer={0}
        grainOverlay={0}
        speed={0.8}
        offsetX={0.08}
      />
      {/* 흰 글씨 가독성을 위한 어두운 베일 */}
      <div className="mesh-veil" />
    </div>
  );
}
