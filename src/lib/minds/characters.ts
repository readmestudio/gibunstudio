/**
 * 무료 "마음 확인"(/minds) 캐릭터 캐스팅 + 역할 라인업.
 *
 * 마음들을 인사이드 아웃 / 드라마 인물 소개처럼 캐릭터화한다. 미리 만들어 둔
 * *고정 캐스팅*(10명)에 테스트 결과(PartsMap.parts)를 매핑해, 시각 자산(초상)은
 * 재사용하면서 "내 답에서" 인용만 개인화한다.
 *
 * 카드 본문은 영역(설명·원하는 것·자주 하는 말·두려워하는 것·발동되는 순간)으로
 * 나누되, 각 영역 안은 단답이 아니라 *풀어쓴 문장*으로 쓴다 — "사람이 나를 읽고
 * 있구나" 싶은, 상담가가 써 준 분석 글의 톤(~에요/~습니다).
 *
 * 무료/유료 경계:
 *  - 무료: 각 마음의 캐릭터 카드(이름·초상·영역별 설명·"내 답에서" 인용)
 *  - 유료: 역할 배역표(누가 리더·빌런·관리자·추방자인지) + 관계 역학(누가 누구와 부딪치는지)
 *  → FREE_CHARACTER_COUNT / 아웃트로 카드 한 곳에서 경계를 옮길 수 있다.
 *
 * 초상(portrait): 배역별 캐릭터 일러스트(/public/minds/cast/{배역}.png) 5종을 쓴다.
 * 같은 배역(roleSlot)을 맡은 캐릭터는 같은 일러스트를 공유한다(리더·빌런·난봉꾼·관리자·추방자).
 *
 * 용어 정책: 무료 /minds 는 드라마 배역명(리더/빌런/난봉꾼/관리자/추방자)을 그대로
 * 노출한다. (유료 워크북의 IFS_TERM_BAN_RULES 와 별개 — 그쪽은 자연어 유지.)
 */

import type { PartRole } from "@/lib/self-workshop/ifs-parts-data";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";

/** 무료로 공개하는 캐릭터 카드 수. 3명(최대한 유저 답변으로) + 이후 요약 카드 1장. */
export const FREE_CHARACTER_COUNT = 3;

/* ─────────────────── 역할 슬롯 (유료 배역표) ───────────────────
 *
 * "내 마음 속 리더 / 빌런 / 난봉꾼 / 관리자 / 추방자"처럼, 드라마 배역으로
 * 각 마음이 어떤 역할을 맡는지 보여주는 유료 리포트의 뼈대.
 */
export interface RoleSlot {
  key: string;
  /** 화면 라벨. */
  label: string;
  /** 이 배역이 마음 안에서 하는 일 한 줄. */
  blurb: string;
  /** 이 배역에 가까운 내부 PartRole(매핑 힌트). */
  affinity: PartRole;
}

export const ROLE_SLOTS: RoleSlot[] = [
  {
    key: "leader",
    label: "리더",
    blurb: "지금 내 삶의 주된 정서를 만들어내며, 무대를 끌고 가는 마음",
    affinity: "manager",
  },
  {
    key: "villain",
    label: "빌런",
    blurb: "주기적으로 나를 다그치고 괴롭히지만, 사실은 나를 지키려는 마음",
    affinity: "self_critic",
  },
  {
    key: "rake",
    label: "난봉꾼",
    blurb: "평소엔 잠잠하다가, 위기의 순간 발작 버튼처럼 튀어나오는 마음",
    affinity: "firefighter",
  },
  {
    key: "manager",
    label: "관리자",
    blurb: "고통이 닥치기 전에 미리 차단하고, 아픈 사건·관계로부터 나를 지키려 애쓰는 마음",
    affinity: "manager",
  },
  {
    key: "exile",
    label: "추방자",
    blurb: "과거의 상처를 홀로 짊어진 채, 무의식 깊은 곳으로 밀려난 마음",
    affinity: "exile",
  },
];

/* ─────────────────── 캐스팅 (10 캐릭터) ───────────────────
 *
 * 성취 중독 맥락에서 자주 등장하는 마음 10가지. 각 캐릭터는 고정 이름·초상·설명을
 * 가지며, 테스트 결과의 한 part 가 여기에 매핑된다(evidence_quote만 개인화).
 */
export interface CharacterArchetype {
  id: string;
  /** 드라마식 캐릭터 이름. 예: "Mr.다그쳐" */
  name: string;
  /** 한 줄 별명/직함. 예: "내면의 엄격한 평가관" */
  tagline: string;
  /** 대표 한 줄(카드 상단 히어로 대사). */
  catchphrase: string;
  /** 설명 — 이 마음이 어떤 마음인지(2~3문장, 카드 도입부). */
  description: string;
  /** 원하는 것 — 이 마음이 진짜 바라는 것(문장형 2문장 안팎). */
  wants: string;
  /** 자주 하는 말 — 이 마음이 자주 내뱉는 대사(인용 2~3개). */
  sayings: string[];
  /** 두려워하는 것 — 이 마음이 가장 무서워하는 것(문장형 2문장 안팎). */
  fears: string;
  /** 발동되는 순간 — 이 마음이 언제 깨어나는지(문장형 1~2문장). */
  triggers: string;
  /** 배역별 캐릭터 일러스트 경로(/minds/cast/{배역}.png). */
  portrait: string;
  /** 기본 역할 슬롯 key(매핑·배역표 힌트). */
  roleSlot: string;
  /** 내부 PartRole(비노출). */
  role: PartRole;
}

export const CHARACTER_CAST: CharacterArchetype[] = [
  {
    id: "mr_drive",
    name: "Mr.다그쳐",
    tagline: "한순간도 봐주지 않는 내면의 감독관",
    catchphrase: "더 해야 해. 이대론 부족해.",
    description:
      "이 마음은 한순간도 당신을 가만히 두지 않아요. 무언가를 잘 해낸 날에도 잘한 부분보다 빈틈을 먼저 찾아내고, ‘이 정도로 만족하면 도태된다’며 끊임없이 다음 목표를 들이밉니다. 겉으로는 냉정하고 가혹해 보이지만, 사실 그 모든 채찍질의 끝에는 ‘네가 무너지지 않았으면 좋겠다’는 마음이 숨어 있어요.",
    wants:
      "이 마음이 진짜 바라는 건 의외로 단순해요. 당신이 무너지지 않는 것, 누구에게도 무시당하지 않을 만큼 단단해지는 것이죠. 그래서 늘 한발 앞서 당신을 몰아붙이며, 안전하다고 느낄 만큼의 성취를 손에 쥐려 합니다.",
    sayings: [
      "더 해야 해. 이대론 부족해.",
      "이 정도로 만족하면 도태돼.",
      "남들 다 달리는데 너만 처지고 있잖아.",
    ],
    fears:
      "가장 두려워하는 건 당신이 긴장을 푸는 순간이에요. 잠깐이라도 느슨해지면, 사실은 형편없는 사람이었다는 게 만천하에 들통날 것만 같거든요. 그래서 좀처럼 쉬는 법을 허락하지 못합니다.",
    triggers:
      "누군가와 비교될 때, 혹은 무언가를 잘 해낸 직후의 짧은 여유가 찾아올 때 가장 크게 깨어나요. 평가나 피드백을 앞둔 순간에도 어김없이 목소리를 높입니다.",
    portrait: "/minds/cast/villain.png",
    roleSlot: "villain",
    role: "self_critic",
  },
  {
    id: "ms_perfect",
    name: "완벽주의 여사",
    tagline: "빈틈을 못 견디는 깐깐한 설계자",
    catchphrase: "완벽하게. 빈틈없이.",
    description:
      "모든 일을 빈틈없이 통제하려는 마음이에요. 계획표를 짜고, 몇 번이고 점검하고, 일어나지도 않은 만일의 상황까지 미리 대비하죠. 덕분에 실수는 눈에 띄게 줄지만, 정작 쉬는 시간조차 ‘제대로 쉬어야 한다’는 또 하나의 과제로 만들어 버리곤 해요.",
    wants:
      "이 마음이 바라는 건 모든 것이 자기 손안에서 예측 가능하게 흘러가는 거예요. 변수 없이 안전하다고 느껴질 때에야 비로소 잠깐 숨을 돌립니다. 통제는 이 마음에게 곧 안심이거든요.",
    sayings: [
      "완벽하게. 빈틈없이.",
      "이것도 점검해야 안심이 돼.",
      "쉬더라도 제대로 쉬어야지.",
    ],
    fears:
      "가장 두려운 건 통제의 끈을 놓치는 순간이에요. 손을 놓는 순간 애써 쌓아 둔 모든 것이 한꺼번에 무너져 내릴 것 같은 불안이, 늘 그 아래 깊이 깔려 있습니다.",
    triggers:
      "계획이 어긋나거나 예상 못 한 변수가 생길 때, 또는 누군가에게 중요한 일을 맡겨야 할 때 가장 예민하게 곤두섭니다.",
    portrait: "/minds/cast/manager.png",
    roleSlot: "manager",
    role: "manager",
  },
  {
    id: "needy",
    name: "인정받고파氏",
    tagline: "박수 소리로 숨 쉬는 마음",
    catchphrase: "인정받아야 내가 있어.",
    description:
      "누군가 알아봐 줄 때 비로소 살아있다고 느끼는 마음입니다. 인정을 받으면 날아갈 듯 기뻐하지만, 반응이 미지근하거나 아무도 알아주지 않으면 금세 ‘난 별 거 아닌가’ 하며 쪼그라들어요. 그래서 늘 다른 사람의 표정과 반응을 살피느라 마음이 분주합니다.",
    wants:
      "이 마음이 가장 원하는 건 인정, 그리고 내 존재가 누군가에게 확인받는 순간의 안도예요. 박수와 시선이 닿을 때에야 ‘내가 여기 있어도 되는구나’ 하고 겨우 안심합니다.",
    sayings: [
      "인정받아야 내가 있어.",
      "이만하면 괜찮았지? 그치?",
      "아무 반응 없으면 어쩌지.",
    ],
    fears:
      "가장 두려운 건 아무도 자신을 알아봐 주지 않는 거예요. 결국 별 거 아닌 사람으로 조용히 잊히는 상상이, 이 마음을 한순간도 가만히 두지 못하게 합니다.",
    triggers:
      "공들인 성과를 내보일 때, 그에 대한 반응이 없거나 미지근할 때, 또는 누군가가 나보다 더 주목받는 순간에 크게 흔들립니다.",
    portrait: "/minds/cast/leader.png",
    roleSlot: "leader",
    role: "manager",
  },
  {
    id: "rest",
    name: "쉬고싶어氏",
    tagline: "구석에서 작게 손 흔드는 마음",
    catchphrase: "이제 좀 쉬어도 되지 않을까.",
    description:
      "‘이제 그만, 좀 쉬자’라고 조용히 속삭이는 마음이에요. 목소리가 워낙 작아서 다그치는 마음에 늘 묻히지만, 그래도 포기하지 않고 꾸준히 신호를 보냅니다. 다만 이 마음을 계속 외면하면, 어느 날 번아웃이라는 훨씬 큰 목소리가 되어 돌아오기도 해요.",
    wants:
      "이 마음이 바라는 건 거창하지 않아요. 잠깐의 멈춤, 그리고 아무것도 하지 않아도 괜찮은 시간이면 충분합니다. 죄책감 없이 온전히 쉬어도 된다는 허락을 늘 기다리고 있어요.",
    sayings: [
      "이제 좀 쉬어도 되지 않을까.",
      "이러다 정말 지쳐버릴 것 같아.",
      "지금 안 멈추면 나중에 더 크게 멈추게 돼.",
    ],
    fears:
      "가장 두려운 건 끝까지 무시당하는 거예요. 작은 신호로는 끝내 닿지 못해서, 결국 번아웃이라는 극단적인 방식으로만 존재를 증명하게 될까 봐 두려워합니다.",
    triggers:
      "몸이 먼저 피로 신호를 보낼 때, 주말이나 연휴처럼 빈 시간이 생길 때 조용히 손을 흔듭니다. 다만 쉬어도 죄책감이 들 때면 다시 슬그머니 숨어 버려요.",
    portrait: "/minds/cast/exile.png",
    roleSlot: "exile",
    role: "exile",
  },
  {
    id: "runaway",
    name: "도망가",
    tagline: "위기의 순간 딴짓으로 빠지는 탈주범",
    catchphrase: "에라 모르겠다, 일단 딴거.",
    description:
      "압박이 턱밑까지 차오르면, 슬그머니 다른 곳으로 새어 버리는 마음입니다. 영상, 게임, 폭풍 검색, 과식… 무엇이든 붙잡고 잠깐이라도 숨통을 틔워 주죠. 얼핏 게으름처럼 보이지만, 사실은 너무 아픈 순간에서 당신을 잠시 떼어 놓으려는 응급처치에 가까워요.",
    wants:
      "이 마음이 원하는 건 지금 당장의 숨통이에요. 버거운 감정에서 잠깐이라도 멀어져, 아픔을 잠시 미뤄 둘 수 있기를 바랍니다. 길게 내다보는 대신, 지금 이 순간을 견디게 해 주는 게 이 마음의 방식이에요.",
    sayings: [
      "에라 모르겠다, 일단 딴거.",
      "딱 5분만, 영상 하나만 보고.",
      "지금은 아무 생각도 하기 싫어.",
    ],
    fears:
      "가장 두려운 건 도망칠 곳마저 사라지는 거예요. 어디로도 피하지 못한 채 고통을 정면으로 마주해야 하는 상황을, 이 마음은 무엇보다 무서워합니다.",
    triggers:
      "해야 할 일이 막막하게 느껴질 때, 압박이 한계까지 차오를 때, 또는 감정이 감당하기 버거워질 때 가장 빠르게 튀어나옵니다.",
    portrait: "/minds/cast/rake.png",
    roleSlot: "rake",
    role: "firefighter",
  },
  {
    id: "anxious",
    name: "불안이",
    tagline: "최악을 먼저 그려보는 척후병",
    catchphrase: "잘못되면 어떡해.",
    description:
      "‘잘못되면 어떡하지’를 가장 먼저 떠올리는 마음이에요. 모두가 안심하고 있을 때 혼자 비상구의 위치를 살피고, 빠뜨린 건 없는지 몇 번이고 되짚습니다. 피곤한 마음처럼 보이지만, 덕분에 당신은 크게 휘청일 뻔한 순간들을 여러 번 무사히 넘겨 오기도 했어요.",
    wants:
      "이 마음이 바라는 건 단 하나, 안전이에요. 모든 변수가 미리 대비되어 아무 사고 없이 하루가 지나가기를, 그래서 마음 놓고 한숨 돌릴 수 있기를 늘 바랍니다.",
    sayings: [
      "잘못되면 어떡해.",
      "이거 빠뜨린 거 없나?",
      "혹시 모르니까 한 번만 더 확인하자.",
    ],
    fears:
      "가장 두려운 건 방심한 사이에 최악이 현실이 되는 거예요. 잠깐 마음을 놓은 그 틈을 비집고 사고가 터질까 봐, 좀처럼 긴장을 풀지 못합니다.",
    triggers:
      "상황이 불확실할 때, 중요한 일을 코앞에 두었을 때, 또는 남들은 다 안심하는데 어쩐지 나만 불안할 때 가장 분주해집니다.",
    portrait: "/minds/cast/manager.png",
    roleSlot: "manager",
    role: "exile",
  },
  {
    id: "unfair",
    name: "억울이",
    tagline: "혼자만 손해 본다고 느끼는 마음",
    catchphrase: "왜 나만 이래.",
    description:
      "‘왜 나만 이래’가 울컥 올라오는 마음이에요. 똑같이, 때로는 더 애썼는데도 인정은 자꾸 남에게로 가고 책임만 나에게 돌아올 때 속이 부글거립니다. 화가 난 것처럼 보이지만, 그 안에는 ‘내 몫을 제대로 알아봐 줘’라는 간절한 외침이 들어 있어요.",
    wants:
      "이 마음이 진짜 바라는 건 공정함이에요. 내가 들인 노력과 감내한 희생이 있는 그대로 인정받는 것, 그래서 ‘나만 손해 보는 게 아니구나’ 하고 안심하는 것을 원합니다.",
    sayings: [
      "왜 나만 이래.",
      "똑같이 했는데 왜 나만 손해야.",
      "아무도 내 몫을 몰라주잖아.",
    ],
    fears:
      "가장 두려운 건 내 노력과 희생이 끝내 누구에게도 인정받지 못한 채 사라지는 거예요. 묵묵히 감당해 온 것들이 그저 당연한 일로만 여겨질 때, 이 마음은 가장 크게 아파합니다.",
    triggers:
      "인정이 자꾸 남에게로 돌아갈 때, 책임만 나에게 떠넘겨질 때, 또는 내가 들인 노력이 당연시될 때 가장 크게 발동합니다.",
    portrait: "/minds/cast/rake.png",
    roleSlot: "rake",
    role: "firefighter",
  },
  {
    id: "compare",
    name: "비교돌이",
    tagline: "남의 트랙만 쳐다보는 옆자리 주자",
    catchphrase: "남들은 다 하는데.",
    description:
      "늘 남들과 나를 나란히 놓고 재는 마음이에요. SNS 사진 한 장에도 ‘쟤는 벌써 저만큼 갔구나’ 하며 초조해지고, 어느새 내 자리를 남의 기준으로 가늠합니다. 때로는 이 마음이 당신을 분발하게 만들기도 하지만, 동시에 내 속도와 내 길을 자꾸 잊게 만들기도 해요.",
    wants:
      "이 마음이 원하는 건 뒤처지지 않았다는 확신이에요. 적어도 남들만큼은 가고 있다는 안도, 가능하다면 한 걸음 앞서 있다는 확인을 통해 비로소 마음을 놓고 싶어 합니다.",
    sayings: [
      "남들은 다 하는데.",
      "쟤는 벌써 저만큼 갔네.",
      "나만 제자리인 것 같아.",
    ],
    fears:
      "가장 두려운 건 남들 다 가는 길에서 나 혼자만 낙오되는 거예요. 모두가 앞으로 나아가는 동안 나만 멈춰 있을까 봐, 끊임없이 주위를 두리번거립니다.",
    triggers:
      "SNS나 주변 사람의 성취를 마주할 때, 또래의 소식이 들려올 때, 또는 내 속도가 유난히 느리게 느껴질 때 크게 반응합니다.",
    portrait: "/minds/cast/villain.png",
    roleSlot: "villain",
    role: "self_critic",
  },
  {
    id: "numb",
    name: "무기력씨",
    tagline: "시작 전에 먼저 주저앉는 마음",
    catchphrase: "어차피 안 될 거야.",
    description:
      "‘어차피 안 될 거야’라며 미리 스위치를 꺼 버리는 마음입니다. 시작도 하기 전에 기대를 접고, 힘을 빼 두죠. 게을러서가 아니에요. 기대를 품지 않으면 실망할 일도 없으니까, 더 다치지 않으려고 스스로를 미리 보호하는 거예요.",
    wants:
      "이 마음이 바라는 건 더 이상 다치지 않는 거예요. 부푼 기대 끝에 찾아오는 실망의 통증으로부터, 지칠 대로 지친 자신을 지켜 내고 싶어 합니다.",
    sayings: [
      "어차피 안 될 거야.",
      "해봤자 똑같지 뭐.",
      "그냥 기대를 접는 게 마음 편해.",
    ],
    fears:
      "가장 두려운 건 또다시 기대했다가 무너지는 거예요. 애써 일으켜 세운 마음이 다시 한번 꺾이고, 그 실망을 또 견뎌 내야 하는 상황을 무엇보다 피하고 싶어 합니다.",
    triggers:
      "지난 실패의 기억이 떠오를 때, 큰 노력이 필요한 일을 앞두었을 때, 또는 이미 몸과 마음이 지쳐 있을 때 스르륵 올라옵니다.",
    portrait: "/minds/cast/exile.png",
    roleSlot: "exile",
    role: "exile",
  },
  {
    id: "mediator",
    name: "중재가",
    tagline: "싸움을 말리는 가장 어른스러운 마음",
    catchphrase: "둘 다 일리가 있어. 천천히.",
    description:
      "‘둘 다 일리가 있어, 천천히 가자’라고 말하는 차분한 마음이에요. 평소엔 목소리가 작지만, 한 번 깨어나면 서로 다그치고 부딪치는 마음들 사이를 부드럽게 이어 줍니다. 어쩌면 워크북에서 가장 키우고 싶은, 당신 안의 가장 어른스러운 마음일지도 몰라요.",
    wants:
      "이 마음이 바라는 건 균형이에요. 어떤 마음도 미워하거나 내쫓지 않고, 저마다 제자리를 찾아 함께 살아갈 수 있기를 바랍니다. 누구의 편도 들지 않으면서, 모두의 사정을 들어 주려 해요.",
    sayings: [
      "둘 다 일리가 있어. 천천히.",
      "지금 네 마음도 충분히 이해돼.",
      "한 박자만 쉬었다 가자.",
    ],
    fears:
      "가장 두려운 건 자신의 목소리가 끝내 묻히는 거예요. 워낙 조용한 탓에, 시끄럽게 다투는 다른 마음들 사이에서 아무에게도 가닿지 못할까 봐 늘 염려합니다.",
    triggers:
      "마음들이 서로 부딪쳐 시끄러울 때, 당신이 스스로를 지나치게 몰아세울 때, 또는 잠시 숨을 고르며 멈추는 순간에 조용히 깨어납니다.",
    portrait: "/minds/cast/leader.png",
    roleSlot: "leader",
    role: "unclear",
  },
];

/* ─────────────────── 매핑 ─────────────────── */

/**
 * 화면용 캐릭터 뷰 — 표시 콘텐츠는 *LLM 생성 우선, 캐스팅은 fallback*.
 *
 * 하이브리드(B) 정책: 시각 자산(초상)은 고정 캐스팅을 role로 재사용하지만,
 * 이름·본문은 LLM 이 사용자 답변에서 생성한 값을 우선 쓴다. LLM 이 그 필드를
 * 안 줬을 때만 캐스팅의 고정 텍스트로 메운다(분석 실패 폴백 등). → 같은 역할이라도
 * 사람마다 다른 카드가 나온다.
 */
export interface CharacterView {
  /** 초상·roleSlot·key 제공용 캐스팅(고정 시각 자산). */
  archetype: CharacterArchetype;
  /**
   * 유저 답변에서 도출된 마음인지 여부.
   *  - true(확신): 답변 기반 LLM 캐릭터 → 카드에서 확신 톤.
   *  - false(가정): 답변 근거 없이 채운 캐스팅 → 카드에서 "이런 마음도 함께 있을 수 있어요" 가정 톤.
   */
  derived: boolean;
  /* 아래 표시 필드는 모두 LLM 값 우선, 없으면 archetype fallback. */
  name: string;
  tagline: string;
  catchphrase: string;
  description: string;
  wants: string;
  sayings: string[];
  fears: string;
  triggers: string;
  /** 사용자 답에서 그대로 인용(없으면 빈 문자열). */
  evidenceQuote: string;
}

/** 공백/undefined면 fallback 으로 넘어가는 문자열 선택기. */
function pickText(llm: string | undefined, fallback: string): string {
  const v = (llm ?? "").trim();
  return v ? v : fallback;
}

/**
 * PartsMap.parts 를 화면용 뷰로 변환한다. 초상은 role 친화도로 캐스팅을 골라
 * 중복 없이 소비하고(부족하면 남은 캐스팅으로 채움), 이름·본문은 LLM 값 우선으로
 * 병합한다. 항상 최소 FREE_CHARACTER_COUNT 명을 채워 카드가 비지 않게 한다.
 */
export function buildCharacterViews(partsMap: PartsMap): CharacterView[] {
  const used = new Set<string>();
  const views: CharacterView[] = [];

  const take = (
    archetype: CharacterArchetype,
    part: PartsMap["parts"][number] | undefined,
    derived: boolean
  ) => {
    used.add(archetype.id);
    views.push({
      archetype,
      derived,
      name: pickText(part?.name, archetype.name),
      tagline: pickText(part?.tagline, archetype.tagline),
      catchphrase: pickText(part?.catchphrase, archetype.catchphrase),
      description: pickText(part?.description, archetype.description),
      wants: pickText(part?.wants, archetype.wants),
      sayings: part?.sayings && part.sayings.length ? part.sayings : archetype.sayings,
      fears: pickText(part?.fears, archetype.fears),
      triggers: pickText(part?.triggers, archetype.triggers),
      evidenceQuote: (part?.evidence_quote ?? "").trim(),
    });
  };

  // 1) 유저 답변에서 나온 마음 — 확신 캐릭터. 최대 FREE_CHARACTER_COUNT 까지만.
  for (const part of partsMap.parts) {
    if (views.length >= FREE_CHARACTER_COUNT) break;
    const match =
      CHARACTER_CAST.find((c) => !used.has(c.id) && c.role === part.role) ??
      CHARACTER_CAST.find((c) => !used.has(c.id));
    if (match) take(match, part, true);
  }

  // 2) 모자라면 캐스팅으로 채우되 '가정' 캐릭터로 표시(답변 근거 없음 → 카드에서 가정 톤).
  for (const c of CHARACTER_CAST) {
    if (views.length >= FREE_CHARACTER_COUNT) break;
    if (!used.has(c.id)) take(c, undefined, false);
  }

  return views;
}

/** roleSlot key → 라벨/설명 조회. */
export function roleSlotByKey(key: string): RoleSlot | undefined {
  return ROLE_SLOTS.find((r) => r.key === key);
}
