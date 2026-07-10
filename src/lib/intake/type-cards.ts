/**
 * 16가지 내면 아이 유형 지식 카드 (핸드오프 §5 — 상담사 리포트 생성용 고정 데이터).
 *
 * 자체 설계·저작권 독립 콘텐츠. 리포트에 그대로 주입되므로 문구 임의 수정 금지.
 * 키는 child_id (schema-map.ts 매핑과 1:1).
 */

import type { TypeCard } from "./types";

export const TYPE_CARDS: Record<string, TypeCard> = {
  hungry_child: {
    child_id: "hungry_child",
    child_name: "허기진 아이",
    schema_code: "S01",
    schema_name: "정서적 결핍",
    one_line: "아무리 채워도 마음 한구석이 늘 허전한 아이",
    core_belief: "\"내 마음을 진짜로 알아주는 사람은 없을 거야\"",
    inner_voice: "\"어차피 말해도 몰라줘.\"",
    traits:
      "정서적 돌봄·공감·보호를 받은 경험의 결핍. 관계 안에서도 만성적 허기·공허감. 욕구를 말하지 않으면서 알아주지 않으면 서운해지는 패턴",
    triggers: "위로가 필요한 순간에 혼자일 때 / 상대가 내 마음을 못 알아챌 때",
    coping: {
      surrender: "정서적 거리가 있는 상대 선택·기대 접기",
      avoidance: "아예 기대 안 함, 혼자 해결",
      overcompensation: "끊임없이 요구하다 관계 소진",
    },
  },
  waiting_child: {
    child_id: "waiting_child",
    child_name: "문 앞에서 기다리는 아이",
    schema_code: "S02",
    schema_name: "유기·버림받음",
    one_line: "소중한 사람이 떠날까 봐 늘 문 쪽을 바라보는 아이",
    core_belief: "\"소중한 관계는 언제든 끊어질 수 있어\"",
    inner_voice: "\"결국 다들 떠나. 눈을 떼면 안 돼.\"",
    traits:
      "관계 안정성 감지 시스템 과발달. 반응 지연·기분 변화에 과민. 매달림과 선제적 밀어내기 왕복",
    triggers: "답장 지연 / 관계가 깊어지는 전환점 / 원인 불명의 기분 변화",
    coping: {
      surrender: "매달림·확인 요구",
      avoidance: "깊은 관계 자체를 회피",
      overcompensation: "먼저 떠나기·시험하기",
    },
  },
  guarded_child: {
    child_id: "guarded_child",
    child_name: "등을 벽에 붙인 아이",
    schema_code: "S03",
    schema_name: "불신·학대",
    one_line: "언제 공격당할지 몰라 등을 벽에 붙이고 서 있는 아이",
    core_belief: "\"사람들은 결국 나를 이용하거나 해칠 거야\"",
    inner_voice: "\"방심하면 당해.\"",
    traits:
      "호의의 이면을 탐색. 약점 노출 회피. 만성 경계로 인한 피로. 신뢰 형성에 매우 긴 시간",
    triggers:
      "호의·친절을 받을 때 / 약점이 노출됐을 때 / 통제권이 상대에게 있을 때",
    coping: {
      surrender: "학대적 관계 감내",
      avoidance: "깊은 관계 차단",
      overcompensation: "선제 공격·통제",
    },
  },
  outside_child: {
    child_id: "outside_child",
    child_name: "창밖의 아이",
    schema_code: "S04",
    schema_name: "사회적 고립",
    one_line: "모두가 모인 방을 창밖에서 바라보는 아이",
    core_belief: "\"나는 근본적으로 사람들과 달라. 어디에도 속하지 못해\"",
    inner_voice: "\"여긴 내 자리가 아니야.\"",
    traits: "집단 안에서의 이질감·겉도는 느낌. 소속 경험 빈약. 군중 속 고독",
    triggers: "모임·회식·단체 활동 / 소속을 전제로 한 대화(\"우리\")",
    coping: {
      surrender: "주변부에 머묾",
      avoidance: "모임 자체 회피",
      overcompensation: "카멜레온식 과잉 적응",
    },
  },
  hidden_child: {
    child_id: "hidden_child",
    child_name: "숨어버린 아이",
    schema_code: "S05",
    schema_name: "결함·수치심",
    one_line: "들키면 안 되는 게 있다고 믿어 숨어버린 아이",
    core_belief: "\"진짜 나를 알면 아무도 나를 사랑하지 않을 거야\"",
    inner_voice: "\"들키면 끝이야.\"",
    traits:
      "만성 수치심. 칭찬 수용 불가(\"모르고 하는 말\"). 친밀해질수록 노출 공포 상승",
    triggers: "깊어지는 관계 / 평가 상황 / 비판·지적",
    coping: {
      surrender: "비판적 상대 선택·자기비하",
      avoidance: "친밀감 회피·가면",
      overcompensation: "완벽한 이미지 구축",
    },
  },
  fallen_child: {
    child_id: "fallen_child",
    child_name: "주저앉은 아이",
    schema_code: "S06",
    schema_name: "실패",
    one_line: "시도하기도 전에 \"난 안 돼\"라며 주저앉은 아이",
    core_belief: "\"나는 근본적으로 능력이 부족해\"",
    inner_voice: "\"어차피 해도 안 될 거야.\"",
    traits:
      "성취 장면에서의 만성 열등감. 성공의 내부 귀인 실패(운·요행). 시작 전 포기",
    triggers: "새 도전 / 비교 상황 / 평가·피드백",
    coping: {
      surrender: "낮은 목표 고수",
      avoidance: "도전 회피·미루기",
      overcompensation: "과로로 증명 시도",
    },
  },
  clinging_child: {
    child_id: "clinging_child",
    child_name: "손을 놓지 못하는 아이",
    schema_code: "S07",
    schema_name: "의존·무능감",
    one_line: "혼자서는 못 할 것 같아 잡은 손을 놓지 못하는 아이",
    core_belief: "\"혼자서는 해낼 수 없어\"",
    inner_voice: "\"누가 좀 정해줘.\"",
    traits:
      "판단 자신감 결여. 결정 위임 습관. 확인 요구. 독립 장면에서의 무력감",
    triggers: "단독 결정 / 새로운 환경 / 의지하던 대상의 부재",
    coping: {
      surrender: "의존 관계 유지",
      avoidance: "결정 자체 회피",
      overcompensation: "과잉 독립 선언(도움 거부)",
    },
  },
  trembling_child: {
    child_id: "trembling_child",
    child_name: "떨고 있는 아이",
    schema_code: "S08",
    schema_name: "위험·질병 취약성",
    one_line: "곧 나쁜 일이 닥칠 것 같아 떨고 있는 아이",
    core_belief: "\"재앙은 언제든 일어날 수 있고, 나는 견디지 못할 거야\"",
    inner_voice: "\"조심해. 뭔가 잘못될 거야.\"",
    traits: "건강·재정·안전 파국화. 과도한 대비 행동. 이완 곤란",
    triggers: "신체 감각 변화 / 뉴스·사고 소식 / 통제 불가능한 상황",
    coping: {
      surrender: "불안에 지배된 생활 반경 축소",
      avoidance: "위험 정보 차단·회피",
      overcompensation: "강박적 대비·통제",
    },
  },
  shadow_child: {
    child_id: "shadow_child",
    child_name: "그림자 아이",
    schema_code: "S09",
    schema_name: "융합·미발달 자기",
    one_line: "다른 사람의 그림자 속에서 자기 모양을 잃은 아이",
    core_belief: "\"나만의 삶이라는 건 없어\"",
    inner_voice: "\"네가 원하는 게 곧 내가 원하는 거야.\"",
    traits: "자기 욕구 인식 곤란. 분리에 대한 죄책감. 정체성 감각 희미",
    triggers:
      "\"네 생각은 어때?\"라는 질문 / 가족 기대와 다른 선택 / 독립 이슈",
    coping: {
      surrender: "융합 유지",
      avoidance: "자기 탐색 회피",
      overcompensation: "급진적 단절 시도",
    },
  },
  bowed_child: {
    child_id: "bowed_child",
    child_name: "고개 숙인 아이",
    schema_code: "S10",
    schema_name: "복종",
    one_line: "미움받지 않으려 고개를 숙인 채 \"네\"라고 말하는 아이",
    core_belief: "\"내 뜻을 내세우면 보복당하거나 버려질 거야\"",
    inner_voice: "\"그냥 맞추자. 그게 안전해.\"",
    traits:
      "거절 불능. 갈등 회피적 순응. 억눌린 분노의 간헐적 폭발 또는 수동공격",
    triggers: "부당한 요구 / 권위자 / 갈등 조짐",
    coping: {
      surrender: "순응 반복",
      avoidance: "요구 상황 자체 회피",
      overcompensation: "간헐적 반항·폭발",
    },
  },
  early_grown_child: {
    child_id: "early_grown_child",
    child_name: "너무 일찍 어른이 된 아이",
    schema_code: "S11",
    schema_name: "자기희생",
    one_line: "자기가 아이라는 걸 잊을 만큼 일찍 어른이 되어버린 아이",
    core_belief: "\"내가 챙기지 않으면 안 돼. 내 욕구는 나중이야\"",
    inner_voice: "\"내가 해야지, 누가 해.\"",
    traits:
      "과responsibility. 받는 것의 불편함. 돌봄 후 소진·억울함. 자기 욕구 후순위 고착",
    triggers: "타인의 어려움 목격 / 도움 요청 / 자기만을 위한 시간·소비",
    coping: {
      surrender: "돌봄 역할 고착",
      avoidance: "사람들과 거리 두며 소진 방어",
      overcompensation: "희생 후 보상 요구·원망",
    },
  },
  frozen_child: {
    child_id: "frozen_child",
    child_name: "얼어붙은 아이",
    schema_code: "S12",
    schema_name: "정서적 억제",
    one_line: "감정을 들키지 않으려 표정을 지운 채 얼어붙은 아이",
    core_belief: "\"감정을 드러내면 수치스럽거나 통제를 잃게 돼\"",
    inner_voice: "\"티 내지 마. 흔들리면 안 돼.\"",
    traits:
      "정서 표현 차단. 이성 과가동. '차갑다'는 평가. 친밀감 형성의 정서적 재료 부족",
    triggers: "감정 표현 요구 상황 / 애정 표현 / 눈물이 날 것 같은 순간",
    coping: {
      surrender: "감정 없는 역할 수행",
      avoidance: "정서 유발 상황 회피",
      overcompensation: "과장된 쾌활함 연기",
    },
  },
  whip_child: {
    child_id: "whip_child",
    child_name: "채찍 든 아이",
    schema_code: "S13",
    schema_name: "엄격한 기준·과잉비판",
    one_line: "혼나지 않으려 스스로에게 채찍을 든 아이",
    core_belief: "\"이 정도로는 부족해. 완벽해야 안전해\"",
    inner_voice: "\"겨우 이거야? 더 해.\"",
    traits:
      "성취 후에도 만족 부재. 휴식 죄책감. 자기비판의 만성화. 번아웃 취약",
    triggers: "성과 평가 / 휴식·여가 / 타인의 성취 소식",
    coping: {
      surrender: "끝없는 과로 수용",
      avoidance: "시작 미루기(완벽 불가능 회피)",
      overcompensation: "타인에게도 가혹한 기준 적용",
    },
    special_note:
      "※ S18(처벌) 동반 상승 시: 자기비판이 자기처벌 수준 — 세션에서 우선 다룰 것",
  },
  crowned_child: {
    child_id: "crowned_child",
    child_name: "왕관 쓴 아이",
    schema_code: "S14",
    schema_name: "특권의식·과대성",
    one_line: "특별함을 인정받아야만 안전하다고 믿는, 왕관을 쓴 아이",
    core_belief: "\"나는 특별해. 일반적인 제약은 나의 것이 아니야\"",
    inner_voice: "\"왜 내가 참아야 해?\"",
    traits:
      "제약·규칙에 대한 답답함. 우선권 욕구. 이면에 결핍·열등감이 숨어 있는 경우가 많음(방어적 과대성) — 세션에서 이면 탐색 가치 높음",
    triggers: "대기·순서·규칙 준수 요구 / 특별 대우 부재 / 비교 열위",
    coping: {
      surrender: "드묾",
      avoidance: "경쟁 장면 회피",
      overcompensation: "지배·과시(가장 흔함)",
    },
  },
  stage_child: {
    child_id: "stage_child",
    child_name: "무대 위의 아이",
    schema_code: "S16",
    schema_name: "승인·인정 추구",
    one_line: "박수가 멎으면 자기가 사라진다고 믿는, 무대 위의 아이",
    core_belief: "\"인정받아야 나는 가치가 있어\"",
    inner_voice: "\"다들 나를 어떻게 보고 있지?\"",
    traits: "외부 반응에 연동된 자존감. 결정 기준의 외부화. 주목 부재 시 공허",
    triggers: "SNS 반응 / 평가·발표 / 주목받지 못하는 자리",
    coping: {
      surrender: "타인 기준에 맞춘 삶",
      avoidance: "평가 장면 회피",
      overcompensation: "과시·인정 투쟁",
    },
  },
  worried_child: {
    child_id: "worried_child",
    child_name: "걱정을 끌어안은 아이",
    schema_code: "S17",
    schema_name: "부정성·비관주의",
    one_line: "좋은 일 뒤에 숨은 나쁜 일부터 찾는, 걱정을 끌어안은 아이",
    core_belief: "\"결국엔 잘 안 될 거야. 실망하기 전에 대비해야 해\"",
    inner_voice: "\"너무 좋아하지 마. 곧 무너져.\"",
    traits:
      "긍정 정서 차단(김빼기). 리스크 우선 지각. 만성 걱정. 기대 자체의 회피",
    triggers: "좋은 일이 생겼을 때 / 계획·시작 단계 / 불확실성",
    coping: {
      surrender: "비관에 맞춘 축소된 삶",
      avoidance: "새 시도 회피",
      overcompensation: "강박적 플랜B 준비",
    },
  },
};
