"use client";

import Link from "next/link";
import type { Workbook, WorkbookPatch } from "@/lib/mind-spill/types";

type Props = { wb: Workbook; onPatch: (p: WorkbookPatch) => void };

/**
 * Closing — 코치 리포트 한 장.
 *   vii. 단계에서 "리포트 보러가기" 누르면 LLM이 coach_note / prescriptions 채움.
 *   이 영역은 그 결과를 표시하는 자리.
 */
export function ClosingReport({ wb }: Pick<Props, "wb">) {
  return (
    <section className="ms-closing-report">
      <div className="ms-container">
        <div className="ms-closing-report-head">
          <span className="ms-eyebrow">Coach&apos;s report</span>
          <h2 className="ms-closing-report-title">
            한 회, <span className="accent">정리</span>
          </h2>
          <p className="ms-closing-report-sub">
            당신이 적은 모든 것을, 옆에서 본 사람의 시선으로 한 장에 정리했습니다.
          </p>
        </div>

        <CoachLetter wb={wb} />
      </div>
    </section>
  );
}

/* ============= Coach's Letter ============= */

function CoachLetter({ wb }: { wb: Workbook }) {
  const note = wb.coach_note;
  const prescriptions = wb.prescriptions ?? [];

  if (!note) {
    return (
      <div className="ms-closing-letter">
        <div className="ms-letter-head">
          <span className="label">Coach&apos;s note · 곧 도착</span>
          <span className="meta">Vol. {wb.volume_no}</span>
        </div>
        <h3 className="ms-letter-title">
          이번 회, <span className="accent">두 사람</span>이 같은 노트를 씁니다.
        </h3>
        <p className="ms-letter-lede">
          비우기와 채우기가 끝나면, 옆에서 본 사람의 관찰이 도착해요.
        </p>
        <div className="ms-letter-body">
          <p>
            <em>퍼포먼스 코치의 분석 노트 4개 + 코치가 제안하는 액션 아이템 3개</em>가
            자동으로 생성됩니다. 진단이 아닌 관찰, 명령이 아닌 제안입니다.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--ms-ink-3)",
            }}
          >
            vii. 강점 단계 끝의 <b>리포트 보러가기</b> 를 눌러주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-closing-letter">
      <div className="ms-letter-head">
        <span className="label">Coach&apos;s note · 이번 회의 관찰</span>
        <span className="meta">Vol. {wb.volume_no}</span>
      </div>

      <h3
        className="ms-letter-title"
        dangerouslySetInnerHTML={{ __html: note.title }}
      />
      <p
        className="ms-letter-lede"
        dangerouslySetInnerHTML={{ __html: note.lede }}
      />

      <div className="ms-letter-body">
        <p dangerouslySetInnerHTML={{ __html: note.intro }} />
        {note.findings.map((f) => (
          <p key={f.num}>
            <span className="num">{f.num}.</span>
            <span dangerouslySetInnerHTML={{ __html: f.text }} />
          </p>
        ))}
        {note.closing && (
          <p dangerouslySetInnerHTML={{ __html: note.closing }} />
        )}
      </div>

      {prescriptions.length > 0 && (
        <div className="ms-prescription-block">
          <div className="ms-prescription-block-head">
            <span className="label">Coach&apos;s action items</span>
            <span className="sub">· 코치가 제안하는 액션 아이템</span>
          </div>
          <p className="ms-prescription-intro">
            노트에는 적혀 있지 않았지만, 옆에서 본 사람이 적어두는 세 가지.
          </p>
          <div className="ms-prescription-list">
            {prescriptions.map((p) => (
              <div className="ms-prescription" key={p.num}>
                <div className="ms-prescription-num">Action · {p.num}</div>
                <h4
                  className="ms-prescription-title"
                  dangerouslySetInnerHTML={{ __html: p.title }}
                />
                <p
                  className="ms-prescription-body"
                  dangerouslySetInnerHTML={{ __html: p.body }}
                />
                <div className="ms-prescription-meta">
                  {p.meta.map((m, i) => (
                    <div className="ms-prescription-meta-row" key={i}>
                      <span className="key">{m.key}.</span>
                      <span
                        className="val"
                        dangerouslySetInnerHTML={{ __html: m.val }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="ms-letter-closing">
        이건 진단이 아니고, 제안도 명령이 아닙니다. 한 회의 노트를 옆에서 읽은
        사람의 관찰과 제안입니다. 동의되지 않는 부분이 있다면 — 그 한 줄이 다음 회
        노트의 시작입니다.
      </p>

      <div className="ms-letter-sign">
        <span className="name">— Performance Coach</span>
        <span className="vol">
          MIND SPILL · VOL. {String(wb.volume_no).padStart(2, "0")}
        </span>
      </div>

      {note.counseling && <CounselingBridge counseling={note.counseling} />}
    </div>
  );
}

/* ============= 심리 상담 연결 ============= */

function CounselingBridge({
  counseling,
}: {
  counseling: NonNullable<Workbook["coach_note"]>["counseling"];
}) {
  if (!counseling) return null;
  // 옛 리포트는 outcomes 없이 저장됐을 수 있음 — 배열이 아니면 빈 배열로.
  const outcomes = Array.isArray(counseling.outcomes)
    ? counseling.outcomes
    : [];
  return (
    <div className="ms-counseling-cta">
      <div className="ms-counseling-cta-head">
        <span className="label">상담 분석 완료</span>
      </div>

      <h3 className="ms-counseling-headline">
        워크북을 통해 <em>당신에게 필요한 상담</em>을 분석했습니다.
        <br />
        1급 심리 상담사와 함께 1:1 상담을 진행해보세요.
      </h3>

      <dl className="ms-counseling-rows">
        <div className="ms-counseling-row">
          <dt>워크북을 통해 발견한 심리적 과제</dt>
          <dd dangerouslySetInnerHTML={{ __html: counseling.issue }} />
        </div>
        <div className="ms-counseling-row">
          <dt>상담 주제</dt>
          <dd
            className="topic"
            dangerouslySetInnerHTML={{ __html: counseling.topic }}
          />
        </div>
        <div className="ms-counseling-row">
          <dt>상담 시간</dt>
          <dd>50분</dd>
        </div>
        {outcomes.length > 0 && (
          <div className="ms-counseling-row">
            <dt>이런 것들을 해결할 수 있어요</dt>
            <dd>
              <ul className="ms-counseling-outcomes">
                {outcomes.map((o, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: o }} />
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      <Link href="/payment/counseling/mind-spill" className="ms-counseling-btn">
        <span className="ms-counseling-btn-label">상담 신청하기</span>
        <span className="ms-counseling-btn-meta">50분 · 99,000원 →</span>
      </Link>

      <p className="ms-counseling-note">
        한국상담심리학회 1급 심리 상담사와의 1:1 Zoom 상담이에요.
      </p>
    </div>
  );
}
