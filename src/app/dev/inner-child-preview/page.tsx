"use client";

/**
 * [개발 미리보기] /dev/inner-child-preview
 *
 * 테스트/결제 없이 리포트 화면을 유형별로 바로 확인하기 위한 dev 전용 페이지.
 * 상단 컨트롤: (1) 무료/유료 전환 (2) 16유형 전환.
 * 무료(=결제 전환 랜딩)=InnerChildSalesPage, 유료=InnerChildPaidView 를 목 데이터로 렌더한다.
 * (프로필 일러스트 + 상단바 확인용. 배포 화면과 무관, 언제든 삭제 가능.)
 */

import { useState } from "react";
import { InnerChildSalesPage } from "@/components/minds/inner-child/report/InnerChildSalesPage";
import { InnerChildPaidView } from "@/app/inner-child/full/[id]/InnerChildPaidView";
import { TYPE_CARDS, getTypeCard } from "@/lib/minds/inner-child/type-cards";
import { devPersona } from "@/lib/minds/inner-child/dev-personas";
import type { ScoreResult } from "@/lib/minds/inner-child/types";
import type { PaidReportGenerated, FreeReportGenerated } from "@/lib/minds/inner-child/report-types";

const IDS = Object.keys(TYPE_CARDS);

// 대표 아이 = 선택 유형, 두 번째 아이 = 목록상 다음 유형(순환).
// SCT 는 **유형별** 페르소나를 쓴다(dev-personas.ts) — 예전엔 전 유형이 하나를 공유해서
// 드롭다운을 돌려도 늘 같은 사람 얘기가 나왔다.
function mockScore(schemaId: string): ScoreResult {
  const card = getTypeCard(schemaId)!;
  const secId = IDS[(IDS.indexOf(schemaId) + 1) % IDS.length];
  const secCard = getTypeCard(secId)!;
  return {
    test_version: "v2.0",
    crisis_flag: false,
    areas: {},
    primary_child: {
      schema_id: schemaId,
      child_name: card.child_name,
      score: 20,
      conditional: false,
      top_item_text: card.typical_scenes?.[0] ?? "",
    },
    secondary_children: [{ schema_id: secId, child_name: secCard.child_name, score: 12, conditional: false }],
    entitlement_score: 0,
    guardian: { type: "avoidance", label: "피하는 지킴이", answers: [] },
    sct: devPersona(schemaId),
  } as unknown as ScoreResult;
}

// ⚠️ 고정 목 portrait 은 두지 않는다. 예전엔 손으로 쓴 문장 하나를 박아뒀는데, 16유형 중
// 무엇을 골라도 같은 글이 떠서(목은 유형과 무관) 정작 이 화면의 목적인 "유형별 카피 검수"가
// 안 됐다. 대신:
//   · free={null} → 판매 페이지가 staticPortrait(card) 로 폴백한다. core_belief 기반이라
//     유형별로 실제 달라지고, 무엇보다 **실서비스가 쓰는 진짜 폴백 문구**다.
//   · "실제 LLM으로 생성" 버튼 → /api/dev/inner-child-portrait (dev 전용)가 실제 프롬프트로
//     뽑아준다. 진짜 필력은 이걸로만 확인할 수 있다.

const MOCK_PAID: PaidReportGenerated = {
  insight:
    "혼자 중요한 결정을 떠안아야 하는 순간, 유독 이 아이가 크게 깨어나요. 겉으로는 담담해 보여도, 사실은 기댈 곳이 없다는 오래된 감각이 되살아나는 거예요. 그럴 때 잠으로 물러나는 건 회피가 아니라, 감당하기 벅찬 순간에서 스스로를 지키려던 익숙한 방식이었어요. 그 방식이 지금까지 당신을 데려온 겁니다. 이제 그 익숙한 손길이 어떤 구조 안에서 움직이는지, 하나씩 펼쳐볼게요.",
  daily_prediction:
    "아마 이런 순간, 꽤 있지 않나요. 회식 자리에서 웃고 떠들다가도 어느 순간 한 발 물러나 관찰자처럼 지켜보고, 단톡방에서는 할 말을 몇 번이나 지웠다 쓰다 결국 안 보내죠. 주말엔 아무도 안 찾으면 편하면서도 어딘가 서운하고요. 매번 상황은 달라 보여도, 그 밑에서 움직이는 건 같은 아이예요.",
  daily_domains: {
    relationship:
      "가까워질수록 좋으면서도 불안이 함께 커집니다. 상대의 답장 속도, 말투, 표정의 미세한 변화까지 안테나를 세워 읽어내고, 조금이라도 온도가 식은 것 같으면 '내가 뭘 잘못했나'부터 떠올립니다. 서운함이 생겨도 바로 말하기보다 혼자 삼키다, 어느 순간 먼저 거리를 둬버려 상대를 어리둥절하게 만들기도 합니다. 정작 가장 가까워지고 싶을 때 물러서는 거예요.",
    work:
      "관계가 얽힌 협업에서 유독 에너지가 많이 듭니다. 성과 자체보다 '이 안에서 내가 어떻게 받아들여지는가'에 신경이 쏠려서, 정작 실력을 다 쓰기 전에 눈치를 보느라 지치기 쉽습니다. 피드백을 받으면 내용보다 말투를 먼저 곱씹기도 하고요.",
    self_care:
      "혼자 있을 때조차 관계 걱정이 배경에서 계속 돌아갑니다. 쉬어도 온전히 쉬어지지 않고, 답장이 없는 시간을 견디는 게 특히 어렵습니다. 그래서 잠으로 도망치거나 다른 자극으로 주의를 돌리며 그 불안을 눌러두려 하죠.",
  },
  loop_stages: {
    trigger:
      "대개 아주 작은 신호입니다. 답장이 평소보다 늦거나, 상대의 말투가 미묘하게 건조해지는 순간이죠. 남들은 그냥 지나칠 공백이, 이 아이에게는 '멀어짐의 신호'로 먼저 읽힙니다.",
    interpretation:
      "그 공백을 그냥 두지 못하고 '내가 뭘 잘못했나'부터 떠올립니다. 확실한 설명이 없으니 최악의 시나리오가 자동으로 재생되고, 머릿속에서는 이미 관계가 흔들리기 시작합니다.",
    action:
      "불안을 견디다 못해 확인하는 메시지를 보내거나, 반대로 상처받기 전에 먼저 거리를 둬버립니다. 가장 가까워지고 싶은 순간에 오히려 물러서는 거예요.",
    result:
      "상대는 영문을 모른 채 '왜 갑자기 이러지' 하고 당황하고, 관계는 실제로 조금 흔들리기 쉽습니다. 이 아이가 두려워하던 바로 그 결과가 벌어지는 거죠.",
    reinforcement:
      "그러면 이 아이는 '거봐, 역시 관계는 언제든 끊어질 수 있어' 하고 원래의 믿음을 더 확신하게 됩니다. 이 구조는 당신만의 것이 아니라, 마음이 스스로를 지키려는 보편적인 방식이에요. 그리고 이 흐름의 어느 지점에서, 익숙한 도피처로 향하는 또 하나의 시스템이 조용히 작동하기 시작합니다.",
  },
  guardian_anatomy: "이 지킴이는 고통이 올라올 것 같으면 재빨리 다른 데로 주의를 돌립니다. 관계에서 불안이 커지는 순간, 잠으로 도망치거나 다른 일에 몰두해 그 감정을 아예 느끼지 않게 만들죠. 단기적으로는 효과적입니다 — 당장의 불안은 가라앉으니까요. 하지만 그 대가로 불안뿐 아니라 친밀해질 기회까지 함께 차단됩니다. 감정을 느끼지 않으려다, 관계에서 진짜 가까워지는 순간마저 놓치게 되는 거예요. 이 지킴이는 당신을 지키려 앞장서지만, 때로는 위협이 지나간 뒤에도 필요 이상으로 오래 머뭅니다. 과제는 이 지킴이를 없애는 게 아니라, 언제 물러나도 되는지 알려주며 업데이트하는 것입니다.",
  conflict_problems:
    "가까운 사람에게 서운함이 생기면 바로 말하지 못하고 혼자 삼킵니다. 그러다 감정이 쌓이면 어느 날 갑자기 조용히 거리를 두게 되고, 상대는 영문도 모른 채 '내가 뭘 잘못했나' 하며 멀어졌다고 느낍니다. 관계는 큰 사건 없이도 이유 모르게 식어버리죠. 연애에서는 가장 좋을 때 오히려 불안이 커져 먼저 시비를 걸거나 상대를 밀어내는 일이 반복되기도 합니다. 일에서는 도움이 필요한 순간에도 먼저 손 내밀지 못해 혼자 끌어안다 번아웃에 이르기 쉽고요. 이 모든 마찰은 당신의 성격이 나빠서가 아니라, 이 아이가 상처받지 않으려고 미리 방어하다 생기는 부작용입니다.",
  second_child_relation: "두 번째 아이는 첫 번째 아이가 지칠 때 슬며시 올라옵니다. 관계에서 계속 확인하고 매달리는 게 버거워지면, 이번엔 아예 '아무것도 필요 없다'는 얼굴로 돌아서는 쪽으로 교대하는 거예요.",
  core_need_bridge: "이 아이가 정말 원했던 것은 '절대 떠나지 않는다는 보장'이 아니라, 지금 이 순간 곁에 있다는 감각이었습니다. 미래의 확실성이 아니라 현재의 연결이 채워질 때, 아이는 문에서 조금씩 물러설 수 있습니다.",
  getting_along:
    "이 아이가 물러나려 할 때, 침묵으로 사라지는 대신 상대에게 '나 지금 좀 정리할 시간이 필요해'라고 한마디만 남겨보세요. 같은 거리두기라도 상대에게는 전혀 다르게 다가갑니다. 서운함이 올라오면 하루 안에 아주 작게라도 말로 꺼내보고요 — 쌓였다 터지는 것보다 훨씬 안전합니다. 그리고 혼자 있고 싶은 마음이 들 때, 그게 이 아이가 보내는 신호임을 알아차리는 것만으로도 절반은 다스려집니다. 이 아이를 다그치지 말고, 데리고 함께 가는 연습이에요.",
  reparenting: {
    scene: "중요한 선택을 홀로 떠안아야 하는 순간 — 당신에게 그때가 가장 위태롭습니다. 다음에 그 순간이 다시 오면 —",
    steps: [
      { title: "알아차리는 신호", body: "가슴이 답답해질 때, 그게 신호예요." },
      { title: "그때 할 한 가지", body: "결정을 미루지 말고, 작은 것 하나만 스스로 정해보세요." },
    ],
  },
  closing: "당신은 이미 그 아이를 알아차렸습니다. 그것만으로 충분한 시작이에요.",
};

export default function Page() {
  const [id, setId] = useState(IDS[0]);
  const [paid, setPaid] = useState(false);
  // 실제 LLM 으로 뽑은 portrait — 유형별로 따로 캐시한다(같은 유형을 다시 눌러도 재호출 안 함).
  const [llm, setLlm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const card = getTypeCard(id)!;

  // free={null} 이면 판매 페이지가 staticPortrait(실서비스 폴백)로 떨어진다 — 유형별로 다르다.
  const free: FreeReportGenerated | null = llm[id] ? { portrait: llm[id] } : null;

  const generate = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/dev/inner-child-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaId: id, sct: mockScore(id).sct }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.portrait) throw new Error(json?.error || "생성 실패");
      setLlm((m) => ({ ...m, [id]: json.portrait }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "fixed",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 80,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(0,0,0,.6)",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 999,
          padding: "6px 10px",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.08)", borderRadius: 999, padding: 2 }}>
          {([["무료", false], ["유료", true]] as const).map(([label, v]) => (
            <button
              key={label}
              type="button"
              onClick={() => setPaid(v)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                cursor: "pointer",
                background: paid === v ? "#FF5A1F" : "transparent",
                color: paid === v ? "#fff" : "rgba(255,255,255,.7)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            background: "#141519",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.25)",
            borderRadius: 8,
            padding: "5px 8px",
            fontSize: 13,
          }}
        >
          {IDS.map((s) => (
            <option key={s} value={s}>
              {getTypeCard(s)!.child_name}
            </option>
          ))}
        </select>

        {/* portrait 실생성 — 판매 페이지일 때만. 목이 아니라 진짜 LLM 필력을 보는 유일한 길. */}
        {!paid && (
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy}
            title="이 유형으로 실제 프롬프트를 태워 portrait 을 뽑습니다 (dev 전용, ~20초)"
            style={{
              border: "1px solid rgba(255,138,76,.6)",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              cursor: busy ? "wait" : "pointer",
              background: llm[id] ? "rgba(255,90,31,.25)" : "transparent",
              color: busy ? "rgba(255,255,255,.5)" : "#FF8A4C",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "생성 중…" : llm[id] ? "↻ 다시 생성" : "⚡ 실제 LLM"}
          </button>
        )}
      </div>

      {/* 지금 보고 있는 portrait 의 출처 표시 — 폴백을 LLM 필력으로 착각하지 않도록. */}
      {!paid && (
        <div
          style={{
            position: "fixed",
            top: 46,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 80,
            fontSize: 11,
            fontFamily: "ui-monospace,Menlo,monospace",
            color: err ? "#ff8a8a" : llm[id] ? "#FF8A4C" : "rgba(255,255,255,.45)",
            background: "rgba(0,0,0,.6)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 999,
            padding: "3px 10px",
            whiteSpace: "nowrap",
          }}
        >
          {err
            ? `⚠ ${err}`
            : llm[id]
              ? "portrait: 실제 LLM 생성본"
              : "portrait: 정적 폴백 (실제는 LLM 생성 — ⚡ 눌러 확인)"}
        </div>
      )}

      {paid ? (
        <InnerChildPaidView
          key={`paid-${id}`}
          purchaseId="preview"
          status="confirmed"
          initialReport={MOCK_PAID}
          score={mockScore(id)}
        />
      ) : (
        <InnerChildSalesPage key={`free-${id}-${llm[id] ? "llm" : "static"}`} card={card} free={free} />
      )}
    </div>
  );
}
