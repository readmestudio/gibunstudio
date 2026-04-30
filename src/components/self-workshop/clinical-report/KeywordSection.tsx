"use client";

import type {
  BeliefEvidence,
  BeliefKeyword,
} from "@/lib/self-workshop/analysis-report";
import { V2TopMeta } from "./shared/V2TopMeta";
import { V2TitleBlock } from "./shared/V2TitleBlock";
import { V2BottomStrip } from "./shared/V2BottomStrip";
import { Eyebrow } from "./shared/Eyebrow";
import { Mono } from "./shared/Mono";

/**
 * V2 인스펙터 톤의 핵심 신념 키워드 섹션.
 * 핸드오프 more-v2.jsx의 CoreBeliefsV2를 본 디자인의 단일 진실로 삼아 재현.
 *
 * graceful degradation:
 * - evidence[].id / stage / classificationEn 누락 시 derive 또는 생략
 * - implication 없으면 IMPL 푸터 생략
 */
export function KeywordSection({
  keywords,
  caseId,
  figureNumber,
  sectionTitle,
  eyebrow,
  title,
  subtitle,
}: {
  keywords: BeliefKeyword[];
  caseId: string;
  figureNumber: string;
  sectionTitle: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const total = keywords.length;
  const figureNum = parseInt(figureNumber, 10) || 2;

  return (
    <section
      style={{
        fontFamily: "var(--font-clinical-body)",
        background: "var(--v2-paper)",
        color: "var(--v2-ink)",
        border: "1px solid var(--v2-line)",
      }}
    >
      <V2TopMeta
        caseId={caseId}
        docId="doc/fig-02.beliefs"
        sectionNum={figureNum}
        sectionAnchor={sectionTitle}
        ts="depth-2 layer"
      />
      <V2TitleBlock
        idx={figureNum}
        eyebrowEn={eyebrow}
        headlineKr={title}
        headlineEn="The skeleton of beliefs, distilled into keywords"
        sub={subtitle}
      />

      <div>
        {keywords.map((k, i) => (
          <div key={`kw-${i}`}>
            <KeywordCardV2 keyword={k} index={i} total={total} />
            {i < keywords.length - 1 && (
              <div
                aria-hidden
                style={{ height: 12, background: "var(--v2-bg)" }}
              />
            )}
          </div>
        ))}
      </div>

      <V2BottomStrip
        caption={`${total} keywords · ranked by activation`}
        figureNumber={String(figureNum).padStart(2, "0")}
      />
    </section>
  );
}

function KeywordCardV2({
  keyword,
  index,
  total,
}: {
  keyword: BeliefKeyword;
  index: number;
  total: number;
}) {
  const priority = derivePriority(index);
  // clinical_name이 "한글 (English)" 형식이면 분리, 아니면 한글만
  const { classification, classificationEn } = splitClinicalName(keyword.clinical_name);

  return (
    <article
      style={{
        background: "var(--v2-paper)",
      }}
    >
      {/* 카드 헤더 — line3 light. KW 코드 자리에 한글 분류명을 직접 노출 */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "1fr auto",
          padding: "14px 20px",
          borderBottom: "1px solid var(--v2-line)",
          background: "var(--v2-line3)",
          gap: 16,
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              background: "var(--v2-ink)",
              borderRadius: 6,
            }}
          />
          <Eyebrow size={9.5} weight={600} color="var(--v2-body2)" tracked="0.16em">
            KEYWORD
          </Eyebrow>
          <span
            aria-hidden
            style={{ width: 1, height: 10, background: "var(--v2-line)" }}
          />
          <span
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--v2-ink)",
            }}
          >
            {classification}
          </span>
          {classificationEn && (
            <span
              style={{
                fontFamily: "var(--font-clinical-eyebrow)",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--v2-mute)",
                letterSpacing: "-0.005em",
                fontStyle: "italic",
              }}
            >
              {classificationEn}
            </span>
          )}
          <span
            style={{
              padding: "2px 6px",
              background: "var(--v2-paper)",
              border: "1px solid var(--v2-line)",
              fontFamily: "var(--font-clinical-mono)",
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--v2-body2)",
              letterSpacing: "0.04em",
            }}
          >
            {priority}
          </span>
        </div>
        <Mono size={10} color="var(--v2-mute)">
          {pad2(index + 1)} / {pad2(total)}
        </Mono>
      </div>

      {/* STMT row */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "52px 1fr",
          gap: 16,
          padding: "20px 20px 22px",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
          STMT
        </Eyebrow>
        <div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.4,
              color: "var(--v2-ink)",
              textWrap: "balance",
            }}
          >
            <span
              style={{
                color: "var(--v2-mute2)",
                fontFamily: "var(--font-clinical-mono)",
                fontWeight: 400,
                marginRight: 4,
              }}
            >
              &ldquo;
            </span>
            {keyword.proposition}
            <span
              style={{
                color: "var(--v2-mute2)",
                fontFamily: "var(--font-clinical-mono)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              &rdquo;
            </span>
          </div>
          {keyword.explanation && (
            <div
              style={{
                marginTop: 14,
                fontFamily: "var(--font-clinical-body)",
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "var(--v2-body)",
                letterSpacing: "-0.015em",
                maxWidth: 580,
                textWrap: "pretty",
              }}
            >
              {keyword.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Table */}
      {keyword.evidence.length > 0 && (
        <>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "52px 1fr",
              gap: 16,
              padding: "12px 20px 10px",
              background: "var(--v2-line3)",
              borderBottom: "1px solid var(--v2-line)",
            }}
          >
            <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
              ID
            </Eyebrow>
            <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
              SELF-REPORT
            </Eyebrow>
          </div>
          <div>
            {keyword.evidence.map((e, i) => (
              <EvidenceRow
                key={`${e.source_code}-${i}`}
                evidence={e}
                index={i}
              />
            ))}
          </div>
        </>
      )}

      {/* IMPL footer — ink 배경 */}
      {keyword.insight_close && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "52px 1fr",
            gap: 16,
            padding: "18px 20px",
            background: "var(--v2-ink)",
            color: "#fff",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <Eyebrow size={9.5} weight={600} color="var(--v2-mute2)" tracked="0.16em">
            IMPL
          </Eyebrow>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 13.5,
              lineHeight: 1.7,
              color: "#E5E6EA",
              letterSpacing: "-0.015em",
              maxWidth: 580,
              textWrap: "pretty",
            }}
          >
            {keyword.insight_close}
          </div>
        </div>
      )}
    </article>
  );
}

function EvidenceRow({
  evidence,
  index,
}: {
  evidence: BeliefEvidence;
  index: number;
}) {
  const id = evidence.id ?? deriveEvidenceId(evidence.source_code);
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "52px 1fr",
        gap: 16,
        padding: "14px 20px",
        borderTop: "1px solid var(--v2-line2)",
      }}
    >
      <div>
        <Mono size={11} weight={600} color="var(--v2-ink)">
          {id}
        </Mono>
        <Mono size={9.5} color="var(--v2-mute2)" style={{ display: "block", marginTop: 4 }}>
          row.{pad2(index + 1)}
        </Mono>
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-clinical-body)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.55,
            color: "var(--v2-ink)",
            textWrap: "pretty",
          }}
        >
          <span
            style={{
              color: "var(--v2-mute)",
              fontFamily: "var(--font-clinical-mono)",
              fontWeight: 400,
              marginRight: 2,
            }}
          >
            &ldquo;
          </span>
          {evidence.quote}
          <span
            style={{
              color: "var(--v2-mute)",
              fontFamily: "var(--font-clinical-mono)",
              fontWeight: 400,
              marginLeft: 2,
            }}
          >
            &rdquo;
          </span>
        </div>
        {evidence.reasoning && (
          <div
            className="mt-1.5 grid"
            style={{ gridTemplateColumns: "14px 1fr", gap: 8 }}
          >
            <Mono size={11} color="var(--v2-mute)" style={{ marginTop: 1 }}>
              ↳
            </Mono>
            <div
              style={{
                fontFamily: "var(--font-clinical-body)",
                fontSize: 12.5,
                lineHeight: 1.65,
                color: "var(--v2-body2)",
                letterSpacing: "-0.01em",
                textWrap: "pretty",
              }}
            >
              {evidence.reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function derivePriority(index: number): string {
  return `P${index}`;
}

/**
 * "조건부 자기 가치 (Conditional Self-Worth)" 형식의 LLM 응답을
 * 한글 / 영문 두 줄로 분리. 영문 괄호가 없으면 한글 전체 + en undefined.
 */
function splitClinicalName(raw: string): {
  classification: string;
  classificationEn?: string;
} {
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) {
    return { classification: m[1].trim(), classificationEn: m[2].trim() };
  }
  return { classification: raw.trim() };
}

function deriveEvidenceId(sourceCode: string): string {
  const sct = sourceCode.match(/^([A-D])(\d)$/i);
  if (sct) return sourceCode.toUpperCase();
  const stepMatch = sourceCode.match(/Step\s*(\d)/i);
  if (stepMatch) return `S${stepMatch[1]}`;
  return sourceCode.slice(0, 3).toUpperCase();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
