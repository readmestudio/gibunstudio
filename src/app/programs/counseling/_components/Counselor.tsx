import Image from "next/image";
import { COUNSELOR } from "../content";

/**
 * [4] COUNSELOR — 상담사 소개. 좌 정사각 프로필 + 우 카피/자격 리스트.
 * 배경 surface. ⚠️ 사진·이름·자격은 실제 상담사 정보로 교체 필요.
 */
export function Counselor() {
  return (
    <section className="section" style={{ background: "var(--surface)" }}>
      <div className="wrap-5">
        <div className="s-header">
          <span className="eyebrow plain f-up">
            <span className="dot" />
            COUNSELOR
          </span>
          <h2 className="f-up delay-1">
            당신의 마음을
            <br />
            <em>함께 들여다볼</em> 사람
          </h2>
          <p className="lede f-up delay-2">{COUNSELOR.lede}</p>
        </div>

        <div className="counselor f-up">
          <div className="counselor-photo">
            <Image
              src={COUNSELOR.photo}
              alt={`심리상담사 ${COUNSELOR.name}`}
              width={720}
              height={720}
              sizes="(max-width: 800px) 100vw, 420px"
            />
          </div>
          <div className="counselor-copy">
            <span className="role-badge">{COUNSELOR.roleBadge}</span>
            <h3>{COUNSELOR.name}</h3>
            <p className="intro">{COUNSELOR.intro}</p>
            <div className="counselor-quals">
              {COUNSELOR.quals.map((q) => (
                <div className="qual-row" key={q}>
                  <span className="qd" />
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
