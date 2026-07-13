/**
 * Type-card assets — all 16 (HANDOFF-v2 ch.7), English edition.
 *
 * English translation of `../type-cards/index.ts`. Only the type matching a
 * user's result is injected into the prompt.
 *
 * Tone: non-judgmental language (no "problem/flaw/distortion" — instead "way of
 * working/strategy/interpretation"), strengths first, externalizing.
 * No claims of parental blame — origin_hypothesis describes environments only
 * ("often forms in ...").
 */

import type { TypeCard } from "../report-types";

const ABANDONMENT: TypeCard = {
  schema_id: "abandonment",
  child_name: "The Child Waiting by the Door",
  area: "disconnection",
  conditional: false,
  one_liner: "A child who keeps an eye on the door, afraid the people they love will leave.",
  core_belief: "The relationships I treasure could be cut off at any moment.",
  voice: "Everyone leaves in the end. So I can't take my eyes off you.",
  strength:
    "The ability to sense a shift in a relationship's temperature before anyone else. It's the source of your empathy and care.",
  traits:
    "This is a type whose radar for the stability of a relationship is highly developed. You read the smallest signals — someone's tone, how quickly they respond — and you pour that same attention into the relationship. The catch is that the radar rarely switches off, so you find yourself checking on the connection even in moments when it would be safe to relax.",
  auto_thoughts: [
    "No reply yet — what does that mean?",
    "Did I do something wrong?",
    "Don't get too attached. Hoping for too much only gets you hurt.",
  ],
  auto_thought_notes: [
    "A moment when even a small gap feels impossible to let pass, and you work to find meaning inside it.",
    "You turn the other person's silence into your own fault first, carrying the uncertainty of the relationship alone.",
    "The more you want to get close, the more you tap the brakes ahead of time to brace against being hurt.",
  ],
  gap_hint:
    "Outside: comes across as independent and unbothered by relationships / Inside: constantly monitoring the signals of the relationship",
  triggers: [
    "When someone is slow to respond",
    "At a turning point where the relationship deepens another notch",
    "When the other person's mood shifts for no clear reason",
  ],
  trigger_notes: [
    "This child reads a gap in a reply or reaction as a 'sign of drifting away' first. In reality the other person is just busy or occupied with something else, but during that silence a story of the relationship coming apart runs automatically, so the anxiety climbs fast.",
    "The closer you get, the more there is to lose, so the moment intimacy deepens can feel like the biggest threat. Affection and the fear that 'liking someone this much will hurt more later' rise at the same time, and you tap the brakes on yourself in the middle of joy.",
    "Faced with an expression or tone you can't explain, this child fills the blank with 'it might be because of me.' When there's no clear explanation, assuming the worst and bracing for it was, long ago, the way that reduced the hurt.",
  ],
  typical_scenes: [
    "When a reply is late, you reread the message you sent, searching for a reason.",
    "When you start to like someone too much, the anxiety makes you want to create distance first.",
  ],
  typical_scene_notes: [
    "You can't just leave the gap alone, so you turn over words you've already sent, looking for a clue about what you did wrong. The longer there's no answer, the more your imagination leans toward the worst.",
    "The closer you get, the more there is to lose, so you pull back to a safe distance before you can be hurt. That's why you can drift away at the very moment you want closeness most.",
  ],
  origin_hypothesis:
    "This often forms in environments where someone close disappeared without warning, or where — even when present — their moods swung so widely that you couldn't lean on them steadily. In an environment like that, keeping a constant watch on the other person becomes a reasonable strategy for protecting the relationship.",
  domains: {
    관계: "The closer you get, the more you check, and the smallest change in the other person shakes you deeply.",
    일: "In collaboration where relationships are involved, you become sensitive to signals, and your energy pours into managing the relationship.",
    자기관리: "Even in your time alone, worry about the relationship keeps running in the background, so your rest stays shallow.",
  },
  core_need:
    "What this child wanted was never a 'guarantee that no one will leave.' It's the felt sense that someone is here, right now. When present connection — not future certainty — is filled, the child can step back from the door a little at a time.",
  reparenting_line: "I'm right here. No one has left, not right now.",
  coping_cards: [
    "There are twenty reasons a reply is late, and nineteen of them have nothing to do with me.",
    "The urge to check belongs to the child. The strength to wait belongs to me.",
  ],
  metrics: [
    { name: "Relational Sensitivity", value: 92, tone: "hot", desc: "You pick up on subtle signals — someone's tone, how fast they respond — faster and more keenly than most." },
    { name: "Self-Checking Tendency", value: 87, tone: "hot", desc: "When something goes wrong in a relationship, your first move is to ask 'what did I do wrong.'" },
    { name: "Trust in Stability", value: 34, tone: "cool", desc: "The belief that a relationship will simply stay steady is relatively weak, so you always need to check." },
  ],
  symbol_action: "standing by the door",
  key_emotion: "watchfulness",
  surface_reaction: "keeps checking",
  guardian_cost: {
    surrender: "Equality in the relationship — always becoming the one who clings.",
    avoidance: "Intimacy — the chance to grow close gets shut out along with the anxiety.",
    overcompensation: "Stable relationships themselves — leave first and you can't be left.",
  },
};

const UNRELENTING_STANDARDS: TypeCard = {
  schema_id: "unrelenting_standards",
  child_name: "The Child with the Whip",
  area: "overvigilance",
  conditional: true,
  one_liner: "A child who drives themselves harder even after doing well, insisting it should be better.",
  core_belief: "Who I am right now is still not enough.",
  voice: "Don't settle for this. You can do more.",
  strength:
    "The drive to set a high bar and see it through to the end. It's the source of your diligence and the quality of your work.",
  traits:
    "This is a type whose system for setting standards of achievement and quality is highly developed. Even when the result is good, you see 'what's next' and 'what's missing' first. That's what keeps you growing steadily, but the bar rarely gets filled, so it's hard to give yourself credit for the moments you did well.",
  auto_thoughts: [
    "This still isn't enough.",
    "If I stop here, I'm being lazy.",
    "Other people are doing better.",
  ],
  auto_thought_notes: [
    "As you near completion, the missing 1% is what you see first, so it's hard to stop at 'this is good enough.'",
    "You read rest as laziness, so you rarely give yourself permission to pause.",
    "You keep the yardstick outside yourself, so even after doing well, comparison refills the sense of falling short.",
  ],
  gap_hint:
    "Outside: comes across as capable and reliably on top of things / Inside: no achievement stays satisfying for long",
  triggers: [
    "Right after something is finished well",
    "The moment you're compared to someone else",
    "When you're supposed to do nothing and rest",
  ],
  trigger_notes: [
    "The moment right after an achievement is, ironically, the most anxious one. To this child, 'done' isn't rest — it's a new baseline that says 'next time you have to surpass this.' Before you can enjoy the sense of having done well, the places you fell short are what catch your eye first.",
    "Because the yardstick always lives outside, seeing someone do better instantly re-rates everything you've achieved as 'still not enough.' Comparison isn't information for this child — it becomes grounds to drive yourself again.",
    "Because pausing gets read as laziness, rest fills up with guilt instead of ease. The voice of 'should I really be doing this' grows louder, so you tense up more at exactly the moment you need to recover.",
  ],
  typical_scenes: [
    "Even when you're praised, the 'still not enough' parts come to mind first.",
    "Even while resting, you can't settle because you feel like you're falling behind.",
  ],
  typical_scene_notes: [
    "Instead of fully taking in the recognition, the places you should do better next time catch your eye — so even good feedback turns into a new assignment rather than reassurance.",
    "Because you read pausing as laziness, rest fills with anxiety instead of recovery. Your body rests, but your head keeps preparing for what's next.",
  ],
  origin_hypothesis:
    "This often forms in environments where recognition and affection were conditionally tied to achievement. If a sense of security was given only when you did well, then continuing to do well becomes a reasonable strategy for being loved.",
  domains: {
    관계: "You work hard to meet others' expectations, and you tense up at the thought of not living up to them.",
    일: "You raise the quality, but you get stuck on 'a better version' rather than the deadline, and it drains you.",
    자기관리: "Even rest feels 'unproductive,' so it's hard to fully set things down.",
  },
  core_need:
    "What this child wanted was never 'to do better.' It's permission to be okay without doing well. When the person you are right now is accepted regardless of results, the child can set the whip down for a moment.",
  reparenting_line: "Just getting this far is enough. It's okay to put it down for a while.",
  coping_cards: [
    "It's not about lowering the bar — I am myself even without filling every mark.",
    "The driving voice belongs to the child. The strength to stop belongs to me.",
  ],
  metrics: [
    { name: "Achievement Standard", value: 94, tone: "hot", desc: "The bar you set for yourself is very high, so ordinary results don't reach satisfaction." },
    { name: "Self-Checking Tendency", value: 90, tone: "hot", desc: "Even when the result is good, you have a strong habit of inspecting what fell short first." },
    { name: "Self-Satisfaction", value: 28, tone: "cool", desc: "The sense of acknowledging and enjoying a job well done is relatively weak." },
  ],
  symbol_action: "holding a whip",
  key_emotion: "insufficiency",
  surface_reaction: "pushes harder",
  guardian_cost: {
    surrender: "Self-acknowledgment — staying forever in the seat of 'still not enough.'",
    avoidance: "The joy of achievement — moving on to the next before you feel the moment you did well.",
    overcompensation: "Ease and rest — you can't stop unless it's perfect.",
  },
};

const SELF_SACRIFICE: TypeCard = {
  schema_id: "self_sacrifice",
  child_name: "The Child Who Grew Up Too Soon",
  area: "other_directedness",
  conditional: true,
  one_liner: "A child who keeps putting their own turn off, busy taking care of everyone else first.",
  core_belief: "If I look after my own share, I become selfish.",
  voice: "It's fine, I'll go later. Right now it's their turn.",
  strength:
    "The ability to notice what someone needs and fill it before they ask. It's the source of your sense of responsibility and care.",
  traits:
    "This is a type whose system for sensing and meeting others' needs is highly developed. You're already moving before anyone asks, and people lean on you for it. But your own needs always get pushed to the back, so you finish caring for everyone and then quietly feel hurt, alone.",
  auto_thoughts: [
    "If I don't do it, who will?",
    "If I bring up my stuff too, it'll be a burden.",
    "I'm fine, really.",
  ],
  auto_thought_notes: [
    "Sensing the gaps first and filling them, until somehow every share ends up on you.",
    "Afraid that voicing your needs will weigh on the other person, you swallow them first.",
    "You cover your own struggle with 'I'm fine,' so caring for yourself always gets pushed to the back.",
  ],
  gap_hint:
    "Outside: comes across as dependable and deeply considerate / Inside: the ache that no one is actually looking after you",
  triggers: [
    "When someone looks like they need help",
    "The moment you'd have to name your own struggle first",
    "A situation where you have to say no to a request",
  ],
  trigger_notes: [
    "Because you sense someone's unmet need before others do, it's hard to just walk past it. A responsibility that says 'I noticed, so I can't not do it' switches on automatically, and even with your own work unfinished, the other person's need catches your eye first.",
    "Voicing your own need feels, to this child, like 'placing a burden on the other person.' So at the very moment you need help, the words get stuck, and you cover it with 'I'm fine' and shoulder it alone.",
    "Saying no feels like it will damage the relationship, so even knowing it's too much, you go along with it. The price of dodging that moment's discomfort comes back later as the share you carried alone, and the hurt.",
  ],
  typical_scenes: [
    "Even with your own work unfinished, you handle someone else's request first.",
    "After taking care of everyone, you turn around and wonder, 'who takes care of me?'",
  ],
  typical_scene_notes: [
    "When you see someone's need, putting your own turn off comes first. Caring like that, your own share always gets pushed back.",
    "You're used to giving but awkward receiving, so after giving it all away, a quiet hurt is left over. And you can't even express that hurt, so it piles up inside.",
  ],
  origin_hypothesis:
    "This often forms in situations where you had to take on a caretaking role early, or where showing your own needs made the environment unstable. In an environment like that, putting your own share off becomes a reasonable strategy for protecting the relationship.",
  domains: {
    관계: "A cycle repeats: you accommodate first, then quietly feel hurt later.",
    일: "You earn trust by taking on responsibility, but your share keeps growing and you burn out easily.",
    자기관리: "You keep putting time for yourself off to 'later,' so your recovery gets delayed.",
  },
  core_need:
    "What this child wanted was never 'to give more.' It's permission to receive, too. When receiving becomes as natural as giving, the child can hold on to their own turn.",
  reparenting_line: "You have a turn too. You're allowed to receive.",
  coping_cards: [
    "Looking after my own share isn't selfishness — it's what makes this sustainable.",
    "The urge to take care of others first belongs to the child. The strength to hold my own turn belongs to me.",
  ],
  metrics: [
    { name: "Care for Others", value: 93, tone: "hot", desc: "Your ability to sense and tend to others' needs and feelings first is very high." },
    { name: "Taking On Responsibility", value: 88, tone: "hot", desc: "When you see a gap, you strongly tend to think 'I should do it' and take it on." },
    { name: "Self-Care", value: 26, tone: "cool", desc: "The sense of tending to and voicing your own needs is relatively weak." },
  ],
  symbol_action: "taking care of others first",
  key_emotion: "quiet hurt",
  surface_reaction: "shoulders it all",
  guardian_cost: {
    surrender: "Your own share — staying in the seat that always gets pushed to the back.",
    avoidance: "Real intimacy — hiding your struggle keeps you from showing your inner self.",
    overcompensation: "The experience of leaning on someone — doing it all first leaves no room to be helped.",
  },
};

// ───────────────────────── Domain 1. Disconnection & Rejection ─────────────────────────

const MISTRUST_ABUSE: TypeCard = {
  schema_id: "mistrust_abuse",
  child_name: "The Child with Their Back to the Wall",
  area: "disconnection",
  conditional: false,
  one_liner: "A child who keeps their back to the wall, reading people so they won't get hurt.",
  core_belief: "People can end up using me or hurting me.",
  voice: "Don't trust all of it. The only one who'll protect me is me.",
  strength:
    "The ability to quickly read people's intentions and what's underneath. It's the source of your caution and discernment.",
  traits:
    "This is a type whose system for verifying others' intentions is highly developed. You quickly catch the gap between what someone says and does, and you're not easily fooled or swayed. But the verifying rarely ends, so even in front of someone you could trust, you keep one layer of yourself held back.",
  auto_thoughts: [
    "That thing they said — is it sincere?",
    "Show a weakness and someday it gets used against you.",
    "When someone's being nice is exactly when to be careful.",
  ],
  auto_thought_notes: [
    "Instead of taking kindness at face value, a moment when you check the intention behind it one more time.",
    "Revealing your inner self feels like handing over a weapon, so you lock it before you open it.",
    "The more unexpected the kindness, the louder the alarm — calculation arrives before gratitude.",
  ],
  gap_hint:
    "Outside: comes across as cool and firmly self-contained / Inside: keeps verifying the other person's intentions, unable to lower your guard",
  triggers: [
    "When someone is suddenly very kind",
    "The moment you'd have to share something personal",
    "When someone's words and actions don't line up",
  ],
  trigger_notes: [
    "This child reads kindness with no reason as a 'sign a price is coming.' The hand that was once generous later came back as a bill, so calculation of 'why are they doing that' runs before gratitude, and you can't settle.",
    "To this child, sharing what's inside feels less like connection and more like 'handing over a weakness.' There's a sense that someday those words could be turned against you, so as a conversation deepens, calculating how far to open takes a lot of energy.",
    "Even a small inconsistency becomes, to this child, evidence for an old conclusion — 'I knew it.' A mismatch, once sensed, doesn't erase easily, and the trust you'd built goes back under review in an instant, making the whole relationship feel shaky.",
  ],
  typical_scenes: [
    "When someone's kind, 'why are they doing that' comes to mind before gratitude.",
    "Even mid-conversation about something personal, you stop yourself at a certain line.",
  ],
  typical_scene_notes: [
    "You're not used to receiving, so when kindness comes, you calculate what you owe and what the hidden motive is. While you're scanning like that, the room for gratitude gets narrow.",
    "Even mid-story, an internal line gets drawn at 'this far.' That line has kept you from getting hurt often, but a loneliness remains — that you've never shown all of yourself to anyone.",
  ],
  origin_hypothesis:
    "This often forms in environments where someone you trusted hurt you, or where showing a soft side turned it into a weakness that came back at you. In an environment like that, never lowering your guard becomes a reasonable strategy for protecting yourself.",
  domains: {
    관계: "The closer you get, the more you verify, and even kindness gets read as calculation, so it's hard to feel at ease.",
    일: "In collaboration you don't easily give up information or your inner read, so the share you carry alone grows.",
    자기관리: "There's nowhere to fully relax, so the ease in your body and mind stays shallow.",
  },
  core_need:
    "What this child wanted was never 'safety through trusting no one.' It's the experience of being safe without staying on guard. As moments pile up where you give a little and don't get hurt, the child can lift their back off the wall.",
  reparenting_line: "It's safe here. You don't have to stand guard over everything.",
  coping_cards: [
    "Suspicion is a habit the past taught me, and this person right now is not that past.",
    "The watchful eye belongs to the child. The strength to decide to trust belongs to me.",
  ],
  metrics: [
    { name: "Reading Intentions", value: 92, tone: "hot", desc: "You catch mismatches between words and actions, and hidden motives, faster and more accurately than most." },
    { name: "Self-Protective Guard", value: 89, tone: "hot", desc: "Even as a relationship gets close, your guard over the last layer of your heart stays strong." },
    { name: "Leaning on Trust", value: 26, tone: "cool", desc: "The sense of resting on someone without verifying is relatively weak." },
  ],
  symbol_action: "keeping your back to the wall",
  key_emotion: "tension",
  surface_reaction: "measures the distance",
  guardian_cost: {
    surrender: "Ease — staying half-armed even inside a relationship.",
    avoidance: "Deep relationships — people move on before the verifying is done.",
    overcompensation: "The experience of receiving — testing and pushing away first leaves no opening for kindness to reach you.",
  },
};

const EMOTIONAL_DEPRIVATION: TypeCard = {
  schema_id: "emotional_deprivation",
  child_name: "The Hungry Child",
  area: "disconnection",
  conditional: false,
  one_liner: "A child carrying an unfilled hunger of the heart, waiting to be truly seen.",
  core_belief: "No one fully understands what's in my heart.",
  voice: "No point saying it — they won't get it. No one gives that much anyway.",
  strength:
    "The ability to recognize the emptiness and loneliness in others. It's the source of deep empathy.",
  traits:
    "This is a type whose system for sensing emotional hunger is highly developed. You quickly notice others' loneliness and fill it, but you don't put your own hunger into words. Waiting to be understood and then not being understood, you feel hurt alone, and return to the familiar conclusion, 'of course.'",
  auto_thoughts: [
    "If I have to say it, it already doesn't count.",
    "Even if I say it, I won't get that much back.",
    "Hurt this small — just swallow it.",
  ],
  auto_thought_notes: [
    "You count only 'being understood before you ask' as the real thing, so the door to expressing closes first.",
    "Memories of getting less back than you hoped pile up, so you lower your expectations before you even speak.",
    "Naming the hurt feels like it would make you look pathetic, so you fold the feeling and tuck it into an inner pocket.",
  ],
  gap_hint:
    "Outside: comes across as doing fine, wanting for nothing / Inside: soothing an unfilled hunger alone",
  triggers: [
    "When your feelings go unnoticed and get passed over",
    "When you pour yourself in and get back something shallow",
    "When you need comfort but get only a formulaic reply",
  ],
  trigger_notes: [
    "To this child, something you 'have to say to be understood' already feels like only half. There's a standard that being understood means being noticed before you ask, so a moment the other person absentmindedly passed over reconfirms the old conclusion — 'my heart doesn't reach.'",
    "This child gives first, in the way they want to receive. So when what comes back is shallow, it's not simple disappointment but a hunger that settles in — 'am I the only one giving this much' — and you can't even name that hurt, so you swallow it alone.",
    "When the feeling you barely managed to voice gets a shallow answer like 'hang in there,' this child chooses to close their mouth again. Voicing it and getting less back reinforces the strategy of 'better not to hope' one more time.",
  ],
  typical_scenes: [
    "Instead of saying you're hurt, you cover it with 'I'm okay' and chew on it alone.",
    "You give first, as much as you want to receive, and when nothing comes back you're quietly let down.",
  ],
  typical_scene_notes: [
    "Voicing the hurt feels like it would make the relationship pathetic, so you cover it with 'I'm okay.' But the covered feeling doesn't disappear — it replays again and again in your time alone.",
    "You tend to the other person first, in the way you wish to be tended, waiting for it to come back. When it doesn't, instead of asking, you quietly shrink your expectations, and the hunger stays.",
  ],
  origin_hypothesis:
    "This often forms in environments where there was no one to fully receive your feelings when you expressed them, or where your body was cared for but your emotions were often passed over. In an environment like that, lowering your expectations and soothing the hunger alone becomes a reasonable, less painful strategy.",
  domains: {
    관계: "You want to be understood without naming your expectations, and when you're not, the hurt piles up.",
    일: "You hunger for recognition and feedback but don't let it show, so your drive quietly cools.",
    자기관리: "You soothe the hunger with other things — food, shopping, content — and an emptiness remains.",
  },
  core_need:
    "What this child wanted was never 'someone who knows everything without being told.' It's the experience of being fully received when you do speak. As moments pile up where the feeling you expressed truly lands, the child's hunger settles a little at a time.",
  reparenting_line: "I'm listening to what's in your heart right now. Thank you for telling me.",
  coping_cards: [
    "Not being understood isn't indifference — it may just be something not yet said.",
    "The heart waiting to be understood belongs to the child. The strength to speak first belongs to me.",
  ],
  metrics: [
    { name: "Empathy Antenna", value: 91, tone: "hot", desc: "Your sense for noticing and filling others' loneliness and emptiness is very high." },
    { name: "Sensitivity to Emotional Hunger", value: 88, tone: "hot", desc: "You keenly feel moments when your heart is left less than full, and you remember them long." },
    { name: "Expressing Needs", value: 27, tone: "cool", desc: "The sense of putting what you want into words and asking for it is relatively weak." },
  ],
  symbol_action: "soothing the hunger alone",
  key_emotion: "emptiness",
  surface_reaction: "pretends to be okay",
  guardian_cost: {
    surrender: "The experience of being filled — habitually choosing relationships where you always get less.",
    avoidance: "Connection itself — folding your expectations folds away the chance for your heart to be reached.",
    overcompensation: "The place of receiving — the more the hurt grows into demands, the more the other person pulls back.",
  },
};

const DEFECTIVENESS_SHAME: TypeCard = {
  schema_id: "defectiveness_shame",
  child_name: "The Child Who Went into Hiding",
  area: "disconnection",
  conditional: false,
  one_liner: "A child who hides themselves, afraid that if the real them is seen, they won't be loved.",
  core_belief: "As I truly am, I'm hard to love.",
  voice: "If they knew this side of me, they'd be disappointed. Don't show it.",
  strength:
    "The ability to look deeply inward and reflect. It's the source of your humility and delicate consideration.",
  traits:
    "This is a type whose system for selecting which parts are safe to show is highly developed. You carefully curate the version others will like, and you come across as polite and harmless. But the curating never stops, so even in close relationships a feeling remains — 'I've never shown all of myself.'",
  auto_thoughts: [
    "If they knew the real me, they'd be let down.",
    "They only like me because they're seeing just a part.",
    "Let me be careful before I get found out.",
  ],
  auto_thought_notes: [
    "As a relationship deepens, the list of 'things that could be found out' comes to mind before hope.",
    "You can't fully believe the affection you receive, so you attach conditions and take in only half of it.",
    "You police your mistakes and weak spots before they show, keeping yourself under constant review.",
  ],
  gap_hint:
    "Outside: comes across as easygoing and likable / Inside: always managing the parts that must not be seen",
  triggers: [
    "When someone's interest in you deepens",
    "The moment a mistake or weakness shows",
    "When you receive praise or affection",
  ],
  trigger_notes: [
    "Interest is both welcome and a threat. The closer you get, the higher the odds the hidden parts show, so this child tenses at the very moment affection grows, recalculating how much to reveal.",
    "A mistake that would pass by for others gets recorded, for this child, as 'being found out.' More than the mistake itself, the imagined 'now they'll see me differently' looms large, so that scene stays and replays in your mind.",
    "Praise is welcome but can't fully soak in. An interpretation slips in — 'they only say that because they don't know the real me' — so the more you're liked, the more it feels like there's more to be found out, and the pressure grows with it.",
  ],
  typical_scenes: [
    "When you're praised, the thought 'they don't know the real me' comes before the joy.",
    "The closer a relationship gets, the more tiring it becomes to choose which self to show.",
  ],
  typical_scene_notes: [
    "The more kind words come, the more the fact that 'I've never shown all of myself' comes up alongside. So before the recognition soaks in as joy, guilt and anxiety take the seat first.",
    "The editing of which self to show runs all through the relationship. That careful management means you're rarely disliked, but even when loved, it feels like an 'edited me' is receiving it, and an emptiness lingers.",
  ],
  origin_hypothesis:
    "This often forms in environments where you as you truly were got compared or criticized often, and warmth was given only to a well-polished version. In an environment like that, hiding your real self becomes a reasonable strategy for protecting the relationship.",
  domains: {
    관계: "The closer you get, the more you fear exposure, so you can't let people inside a certain distance.",
    일: "In moments of evaluation, your attention pulls toward 'what might be found out' rather than your ability, and it drains you.",
    자기관리: "Even alone, the gaze that reviews yourself doesn't switch off, so your rest stays shallow.",
  },
  core_need:
    "What this child wanted was never a 'perfectly good self.' It's the experience of still being accepted after showing a flawed side. As moments pile up where showing one hidden thing doesn't collapse the relationship, the child can come out of hiding.",
  reparenting_line: "That side is you too. It's okay to show all of it.",
  coping_cards: [
    "The side I want to hide isn't a flaw — it's a part that just hasn't had a chance to be seen.",
    "The urge to hide belongs to the child. The strength to decide to show one layer belongs to me.",
  ],
  metrics: [
    { name: "Impression Management", value: 93, tone: "hot", desc: "Your ability to carefully curate and show the version others will like is very high." },
    { name: "Self-Reflection", value: 90, tone: "hot", desc: "You have a strong habit of looking deeply inward at your own shortcomings and reviewing them." },
    { name: "Self-Acceptance", value: 24, tone: "cool", desc: "The sense of accepting even your flawed side as yourself is relatively weak." },
  ],
  symbol_action: "staying hidden",
  key_emotion: "shame",
  surface_reaction: "hides it and smiles",
  guardian_cost: {
    surrender: "An equal relationship — taking the lower seat as if it were only natural.",
    avoidance: "Being understood — if you don't show it, no one can know it.",
    overcompensation: "Real recognition — the more a constructed self is loved, the deeper the real you hides.",
  },
};

const SOCIAL_ISOLATION: TypeCard = {
  schema_id: "social_isolation",
  child_name: "The Child at the Window",
  area: "disconnection",
  conditional: false,
  one_liner: "A child who, even inside the group, feels like they're watching from behind glass.",
  core_belief: "I don't fully belong anywhere.",
  voice: "This isn't my place. I feel like the only one who's different.",
  strength:
    "The ability to step back and take in the whole from the group's edge. It's the source of your independent perspective and powers of observation.",
  traits:
    "This is a type whose system for measuring the temperature of belonging is highly developed. You read the mood and the flow of the group accurately from one step back, and you hold your own distinct viewpoint. But a measurement of 'am I really inside that?' keeps running, so even while you're with people, a pane of glass sometimes rises.",
  auto_thoughts: [
    "Everyone's so natural about it, and I'm the only one trying.",
    "My stuff won't land here.",
    "I'm just a bit of a different kind of person anyway.",
  ],
  auto_thought_notes: [
    "A moment when others' belonging is scored as innate and yours as an act.",
    "You predict the reaction before you even bring it up, so the story loses its chance to leave your mouth.",
    "Concluding 'I'm different' in advance explains the ache of not fitting, so you protect yourself with that sentence.",
  ],
  gap_hint:
    "Outside: comes across as blending in easily enough / Inside: carrying alone the sense of drifting even while together",
  triggers: [
    "When conversation gets lively in a group",
    "When talk turns to a topic or memory only you don't share",
    "The walk home alone after a gathering",
  ],
  trigger_notes: [
    "The faster the conversation moves, the more this child becomes an observer timing when to jump in. Even while laughing and nodding along, a measurement runs in one corner of your mind — 'am I fitting in right now?' — so time together feels more like a task than a pleasure.",
    "More than the unfamiliar topic itself, what hurts is the fact confirmed in that moment: 'I wasn't inside that.' A brief exclusion connects to the old sentence 'of course I'm the one who drifts,' so it lands larger than it really is.",
    "For as hard as you worked while together, the moment you're alone the taut string loosens and an emptiness floods in. The time spent replaying 'was I okay today' stretches long, so the fatigue of the aftertaste lasts longer than the pleasure of the gathering.",
  ],
  typical_scenes: [
    "In a group's laughter, you laugh a half-beat late and wonder, 'am I the only one drifting?'",
    "You blend in well at the gathering, and on the way home a strange emptiness lingers.",
  ],
  typical_scene_notes: [
    "Watching even the timing of the laughter so you can match it leaves little room for the pleasure to soak into your body. Without certainty that you're fitting in, a pane of glass rises even while you're together.",
    "At the gathering you do your part well, and on the way back an emptiness comes — 'was I the only one trying?' That aftertaste makes you hesitate once more before the next gathering.",
  ],
  origin_hypothesis:
    "This often forms in environments where you rarely got to be bound into a 'we' within family or peers, or where — through frequent moves or transfers — you had to leave before you could blend into a group. In an environment like that, keeping your distance in advance becomes a reasonable strategy for reducing the hurt.",
  domains: {
    관계: "You spend a lot of energy fitting in, and when you turn away, fatigue remains more than connection.",
    일: "Even on a team, there's a sense of drifting, so belonging stays shallow regardless of results.",
    자기관리: "Being alone is comfortable yet lonely, and between the two, dividing your relational energy is hard.",
  },
  core_need:
    "What this child wanted was never 'to get along with everyone.' It's the sense of being included without trying, the experience of being part of the group just as you are. As the sense of 'it's okay for me to be here' piles up, the child can come in from the window.",
  reparenting_line: "You're inside this too. This is your place.",
  coping_cards: [
    "The feeling of drifting isn't a fact — it may be a scene made by an old lens.",
    "The urge to hang back belongs to the child. The strength to step one foot in belongs to me.",
  ],
  metrics: [
    { name: "Observer's Vantage", value: 91, tone: "hot", desc: "Your ability to step back from the group and read the whole flow is very high." },
    { name: "Reading the Room", value: 87, tone: "hot", desc: "You keenly sense the air of a room and the subtle currents between people." },
    { name: "Sense of Belonging", value: 25, tone: "cool", desc: "The sense of being part of the group without trying is relatively weak." },
  ],
  symbol_action: "standing at the window",
  key_emotion: "loneliness",
  surface_reaction: "steps one foot back",
  guardian_cost: {
    surrender: "The pleasure of belonging — always drifting from the seat of a guest.",
    avoidance: "The chance to belong — slipping out early gives no time to blend in.",
    overcompensation: "Real connection — the more you stress 'I'm different,' the wider the distance grows.",
  },
};

// ───────────────────────── Domain 2. Impaired Autonomy ─────────────────────────

const DEPENDENCE_INCOMPETENCE: TypeCard = {
  schema_id: "dependence_incompetence",
  child_name: "The Child Who Won't Let Go of a Hand",
  area: "impaired_autonomy",
  conditional: false,
  one_liner: "A child who can't let go of someone's hand, afraid to decide alone.",
  core_belief: "My own judgment can't be trusted.",
  voice: "Don't decide alone. Ask first — what if you're wrong?",
  strength:
    "The ability to gather many people's wisdom and seek advice. It's the source of your prudence and collaboration.",
  traits:
    "This is a type whose system for getting judgments verified is highly developed. You ask and confirm plenty before deciding, so you rarely make big mistakes. But even after confirming, the certainty doesn't set in — so even for something already decided, you need someone's 'yes, that's right' before your mind can settle.",
  auto_thoughts: [
    "Is this right? Who should I ask?",
    "What if I decide alone and get it wrong?",
    "Maybe I should've just done what they said.",
  ],
  auto_thought_notes: [
    "Regardless of the decision's size, before putting a period on it you look for someone to check with first.",
    "Bearing the blame for being wrong alone feels unusually heavy, so you hand the judgment outside.",
    "Every time an outcome wavers, you replay someone else's answer instead of your own, and self-trust shrinks a little at a time.",
  ],
  gap_hint:
    "Outside: comes across as prudent and a good listener / Inside: unable to trust your own judgment, seeking confirmation",
  triggers: [
    "The moment you have to decide alone",
    "When there's no one to ask for advice",
    "When a decision turned out badly",
  ],
  trigger_notes: [
    "Because the standard you lean on lives outside, facing a decision with no one to ask feels like standing on a road without a map. Regardless of the decision's size, 'what if I'm wrong' switches on first, so choosing itself drains you heavily.",
    "With the safety device of confirmation gone, even something you'd normally shrug off feels heavy. An answer you set yourself feels somehow unreliable, so a part of your mind keeps re-asking all through carrying it out.",
    "A bad outcome gets stored, for this child, as evidence that 'my judgment can't be trusted after all.' One mistake spreads into distrust of your whole judgment, so the confirmation steps grow even more for the next decision.",
  ],
  typical_scenes: [
    "Even after choosing one menu item, you ask once more, 'this is okay, right?'",
    "A decision you made alone, you keep looking back on even while carrying it out.",
  ],
  typical_scene_notes: [
    "Even when your mind is already leaning one way, you can't put a period on it without someone's 'yes, that's right.' Only after that one word does the decision feel like a decision.",
    "Even while carrying it out, 'should I have done it differently then' keeps following you. Even a good result gets filed as 'I got lucky,' so trust in your own judgment rarely builds.",
  ],
  origin_hypothesis:
    "This often forms in environments where a hand that solved things for you came before the chance to try yourself, or where choices you made alone got criticized often. In an environment like that, handing judgment outside becomes a reasonable strategy for securing safety.",
  domains: {
    관계: "The more you lean, the more weight the other person carries, and the relationship stays tilted.",
    일: "Confirmation steps pile up and slow you down, and you avoid seats where you're the one responsible.",
    자기관리: "Even small choices drain you, so you keep putting decisions off and fatigue builds.",
  },
  core_need:
    "What this child wanted was never 'someone who knows the right answer.' It's the experience of choosing for yourself and being okay even when wrong. As small successes made by your own judgment pile up, the child can let go of the hand a little at a time.",
  reparenting_line: "You can trust your gut. If you're wrong, you can just choose again.",
  coping_cards: [
    "A wrong choice isn't the end of judgment — it's material for judgment to grow.",
    "The urge to ask belongs to the child. The strength to decide first belongs to me.",
  ],
  metrics: [
    { name: "Need to Confirm", value: 92, tone: "hot", desc: "Your tendency to seek someone's agreement before and after deciding, to feel safe, is very strong." },
    { name: "Openness to Advice", value: 88, tone: "hot", desc: "Your ability to gather and listen to many people's opinions is high." },
    { name: "Self-Conviction", value: 23, tone: "cool", desc: "The sense of trusting your own judgment and pushing ahead without confirmation is relatively weak." },
  ],
  symbol_action: "holding someone's hand",
  key_emotion: "feeling lost",
  surface_reaction: "keeps asking",
  guardian_cost: {
    surrender: "Judgment muscle — the more you hand it off, the fewer chances it has to grow.",
    avoidance: "Experience itself — while you put a decision off, the options pass by too.",
    overcompensation: "The chance to be helped — pretending to do it all alone, you miss the very hand you need.",
  },
};

const VULNERABILITY_HARM: TypeCard = {
  schema_id: "vulnerability_harm",
  child_name: "The Trembling Child",
  area: "impaired_autonomy",
  conditional: false,
  one_liner: "A child who curls up even on good days, never knowing when something might happen.",
  core_belief: "The world is a place where something bad can happen at any time.",
  voice: "Be careful. The moment you let your guard down, something breaks.",
  strength:
    "The ability to foresee danger and prepare for it. It's the source of your readiness and crisis response.",
  traits:
    "This is a type whose system for scanning danger is highly developed. You picture the worst case and prepare, so in a real crisis you actually move calmly. But the scanning rarely switches off, so even in peaceful moments when nothing is wrong, one part of you stays on standby.",
  auto_thoughts: [
    "What if this turns into something serious?",
    "Things feel too easy right now — am I missing something?",
    "If I worry ahead of time, I'll get hurt less.",
  ],
  auto_thought_notes: [
    "A moment when your body tenses first, picturing the ending of something that hasn't happened yet.",
    "You translate calm not as 'no danger' but as 'hasn't gone off yet.'",
    "An old calculation runs — that paying worry in advance, like insurance, will hurt less.",
  ],
  gap_hint:
    "Outside: comes across as composed and prepared / Inside: bracing even for danger that hasn't happened, unable to relax",
  triggers: [
    "When you feel a small off-signal in your body",
    "Facing schedules, travel, or change you can't control",
    "A peaceful moment when everything is going well",
  ],
  trigger_notes: [
    "Even a light headache or unfamiliar ache reads, to this child, as the trailer for something serious. Searching and checking follow, and looking after your body becomes not reassurance but a way of finding more signals.",
    "Every variable outside your hands gets calculated into the seat of danger. Travel and change that others find exciting become, for this child, a growing list to inspect, so it drains a lot of energy even before it starts.",
    "Calm gets translated, for this child, as 'a state where nothing bad has come yet.' The better things are, the more there is to lose, so you tighten your heart at the very moment you could be most at ease, watching for the next crisis.",
  ],
  typical_scenes: [
    "The night before a trip, a list of worries about accidents and lost things unfolds before the excitement.",
    "When something good happens, you tighten your heart in advance — 'something's bound to go wrong.'",
  ],
  typical_scene_notes: [
    "Before excitement can rise, worst-case scenarios take the seats. You can only set out once the whole prep list is filled, and the lightness of the trip shrinks by that much.",
    "The bigger the luck feels, the more a calculation follows — 'there'll be a price.' So instead of fully enjoying the good thing, you set up an emergency exit in one corner of your heart first.",
  ],
  origin_hypothesis:
    "This often forms in environments where you witnessed unpredictable accidents, illness, or big upheavals up close, or where the adults around you often warned that the world is a dangerous place. In an environment like that, always staying prepared becomes a reasonable strategy for protecting yourself.",
  domains: {
    관계: "You worry about and look after the other person's safety too, but that tension can read as nagging or control.",
    일: "You're excellent at risk management, but the brakes come on first when facing something new.",
    자기관리: "You're sensitive to your body's signals, so worry about your condition itself wears your condition down.",
  },
  core_need:
    "What this child wanted was never 'a world with no danger.' It's the sense that whatever happens, you can handle it. As experiences pile up of time spent without worry passing by safely, the child can uncurl a little at a time.",
  reparenting_line: "It's safe right now. Whatever happens, we can handle it.",
  coping_cards: [
    "Most of what I worried about didn't happen, and what did was more manageable than the worry.",
    "The tensing heart belongs to the child. The strength to stay in the present belongs to me.",
  ],
  metrics: [
    { name: "Danger Detection", value: 93, tone: "hot", desc: "Your sense for scanning what could go wrong — earlier and wider than most — is very high." },
    { name: "State of Readiness", value: 89, tone: "hot", desc: "You strongly tend to picture the worst case and prepare for it in advance." },
    { name: "Ease & Reassurance", value: 24, tone: "cool", desc: "The sense of fully relaxing and enjoying present safety is relatively weak." },
  ],
  symbol_action: "curling up",
  key_emotion: "anxiety",
  surface_reaction: "worries in advance",
  guardian_cost: {
    surrender: "Peaceful moments — paying even good times in advance with worry.",
    avoidance: "The radius of your life — the more danger you avoid, the fewer places you can go.",
    overcompensation: "The pleasure of the present — spending it all on control and inspection.",
  },
};

const ENMESHMENT: TypeCard = {
  schema_id: "enmeshment",
  child_name: "The Shadow Child",
  area: "impaired_autonomy",
  conditional: false,
  one_liner: "A child who has lived like someone's shadow, their own outline gone blurry.",
  core_belief: "Without that person, I don't know who I am.",
  voice: "What they like is what I like too. That's easier.",
  strength:
    "The ability to fold deeply into the heart of someone you love. It's the source of your devotion and sense of oneness.",
  traits:
    "This is a type whose system for folding your heart into a loved one's is highly developed. You blend naturally into their mood, tastes, and plans, and you get along without conflict. But the folding-in has gone on so long that, once you clear away 'their' part, the outline of what you actually want is hard to make out.",
  auto_thoughts: [
    "What would they think?",
    "Deciding alone somehow feels empty.",
    "Well, I… anything's fine.",
  ],
  auto_thought_notes: [
    "An old habit where the circuit for finding your own answer always routes through that person first.",
    "A choice made alone feels somehow like only half, and only deciding together feels complete.",
    "'Anything's fine' is less consideration than the most familiar answer that comes out when your preference is blurry.",
  ],
  gap_hint:
    "Outside: comes across as accommodating, easy, and even-tempered / Inside: when asked what you actually want, the answer is blurry",
  triggers: [
    "When someone asks, 'what do you want?'",
    "The moment your opinion differs from a loved one's",
    "When time alone stretches long",
  ],
  trigger_notes: [
    "Faced with this question, this child hesitates not from having no answer, but because the circuit for finding one has always routed through 'that person.' With little practice at asking your own wants directly, a simple question feels like a test.",
    "A difference of opinion comes, to this child, not as simple difference but as a premonition of drifting apart. The very fact of thinking differently feels uncomfortable, so you fold your side to close the gap quickly.",
    "Time alone feels less like freedom and more like a vacuum where the being you used as your reference point is gone. Even asked what you want to do, the answer is blurry, so you end up reaching out or slipping back into someone's schedule.",
  ],
  typical_scenes: [
    "Asked what to eat or where to go, 'whatever you like' comes out first.",
    "A weekend alone comes not as freedom but as an empty feeling.",
  ],
  typical_scene_notes: [
    "Accommodating is often less consideration than an answer that comes out because your preference really isn't clear. Repeated long enough, both of you pass by without knowing your tastes.",
    "When there's nothing you have to do, boredom isn't what comes right away — emptiness is. Instead of filling that space with your own wants, you slip, out of habit, into someone else's plan.",
  ],
  origin_hypothesis:
    "This often forms in environments where closeness to one person was so intense that each side's tastes and boundaries blurred, or where an attempt to stand apart came back as hurt or worry. In an environment like that, blending into the other person becomes a reasonable strategy for protecting the relationship.",
  domains: {
    관계: "Accommodating deeply, the bigger the relationship grows, the smaller your own place becomes.",
    일: "There's a lot you're good at, but the sense of 'my work' is shallow, so setting direction is hard.",
    자기관리: "With little practice asking your own tastes and wants, even time for yourself gets filled by following others.",
  },
  core_need:
    "What this child wanted was never 'to become one with someone.' It's permission to stay yourself while being close. As experiences pile up where one of your tastes, one of your opinions, doesn't harm the relationship, the child reclaims their own outline.",
  reparenting_line: "I'm curious what you like. Even if it's different, we're still us.",
  coping_cards: [
    "A different opinion isn't drifting apart — it's proof that two people are each standing on their own.",
    "The urge to fold into someone belongs to the child. The strength to find my own answer belongs to me.",
  ],
  metrics: [
    { name: "Attunement", value: 90, tone: "hot", desc: "Your ability to blend naturally into someone's mood and tastes and match them is very high." },
    { name: "Relational Closeness", value: 88, tone: "hot", desc: "You strongly tend to fold your heart into a loved one's and move in step with them." },
    { name: "Self-Outline", value: 22, tone: "cool", desc: "The sense of clearly grasping your own tastes and wants, separate from the other person, is relatively weak." },
  ],
  symbol_action: "clinging like a shadow",
  key_emotion: "emptiness",
  surface_reaction: "goes along with it",
  guardian_cost: {
    surrender: "Your own outline — the more you fold in, the fewer chances to know your shape.",
    avoidance: "The experience of standing alone — unable to bear being alone, you look for somewhere to blend into first.",
    overcompensation: "The warmth of togetherness — forcing a line pushes away the very closeness you wanted.",
  },
};

const FAILURE: TypeCard = {
  schema_id: "failure",
  child_name: "The Child Who Sat Down",
  area: "impaired_autonomy",
  conditional: false,
  one_liner: "A child who sits down before even starting, afraid it won't work out again.",
  core_belief: "I'm closer to the failing side than the succeeding side.",
  voice: "It won't work anyway. Don't hope — that way it hurts less.",
  strength:
    "The ability to gauge the difficulty and limits of a task realistically. It's the source of a humility that never gets reckless.",
  traits:
    "This is a type whose system for lowering expectations in advance is highly developed. You lay down a cushion before the shock of disappointment arrives, protecting yourself, and when you actually try, you often do better than expected. But the protective device kicks in from the starting stage, so you fold your hopes before trying and keep putting off the starting line.",
  auto_thoughts: [
    "Someone like me pulling this off?",
    "If I hope for it, the letdown just gets bigger.",
    "It's already too late to start now.",
  ],
  auto_thought_notes: [
    "You pull the conclusion forward before weighing the odds, closing the door on trying in advance.",
    "Having learned hope as the cause of disappointment, you quickly press it down when excitement rises.",
    "The verdict of 'too late' is less a fact than the most plausible reason attached to the fear of starting.",
  ],
  gap_hint:
    "Outside: comes across as unambitious and laid-back / Inside: switching off hope itself, afraid of disappointment",
  triggers: [
    "When you have to start something new",
    "When you're compared among people who are good at it",
    "A situation similar to something that once didn't work out",
  ],
  trigger_notes: [
    "The starting line feels, to this child, less like possibility and more like a reservation for disappointment. Pulling the conclusion 'it won't work anyway' forward and switching off hope hurts less, so looking into things and giving up repeats.",
    "Someone who's good at it reads not as inspiration but as evidence — 'see, they're different from me.' Every moment of comparison stacks one more reason not to start, so the starting line moves that much farther away.",
    "Facing a similar scene, a past result gets summoned like a prophecy of the future. The sense of 'it'll turn out that way again' looms larger than the fact that then and now are different, so your body stops first.",
  ],
  typical_scenes: [
    "Even when something interests you, 'it won't work anyway' comes first and you look into it only halfway.",
    "You put off starting until the deadline hits, and the conclusion loops back to 'I knew I couldn't.'",
  ],
  typical_scene_notes: [
    "Even when interest sparks, you stop after a few searches and fold it up as 'realistically too much.' Folding hope is easy in the moment, but as the folded list piles up, one corner of your heart gets heavy.",
    "When a rushed, last-minute result falls short, it becomes evidence again for 'I knew I couldn't.' The truth is you ran out of time, but the conclusion always gets filed as a lack of ability.",
  ],
  origin_hypothesis:
    "This often forms in environments where you were evaluated by results more than by the process of effort, or where being compared to a talented sibling or peer repeated. In an environment like that, folding your hopes in advance becomes a reasonable strategy for protecting yourself from disappointment.",
  domains: {
    관계: "With the thought 'why would anyone want someone like me,' you're half-doubtful even facing a good relationship.",
    일: "You stay in a seat below your ability, repeating the familiar instead of taking on challenges.",
    자기관리: "Even when you make a plan, 'it won't work anyway' comes first, and your drive dies before you act.",
  },
  core_need:
    "What this child wanted was never 'to definitely succeed.' It's the experience that trying itself was okay, regardless of the result. As small tries that end safely pile up, the child can rise from where they sat down.",
  reparenting_line: "It's okay if it doesn't work out. Just having tried already makes it different.",
  coping_cards: [
    "Folding your hopes doesn't reduce disappointment — it reduces starts.",
    "The urge to sit down belongs to the child. The strength to take one step belongs to me.",
  ],
  metrics: [
    { name: "Disappointment Defense", value: 89, tone: "hot", desc: "Your power to lower expectations in advance and shield yourself from the shock of disappointment is strong." },
    { name: "Strictness of Self-Evaluation", value: 86, tone: "hot", desc: "You strongly tend to score your own odds far lower than others would." },
    { name: "Drive to Try", value: 23, tone: "cool", desc: "The sense of just setting out without knowing the result is relatively weak." },
  ],
  symbol_action: "sitting down",
  key_emotion: "helplessness",
  surface_reaction: "puts off starting",
  guardian_cost: {
    surrender: "Possibility — repeating only the choices that prove 'I knew I couldn't.'",
    avoidance: "The chance to grow — without trying, success is never experienced either.",
    overcompensation: "Rest — unable to stop, endlessly proving yourself to erase the failure.",
  },
};

// ───────────────────────── Domain 3. Impaired Limits ─────────────────────────

const ENTITLEMENT: TypeCard = {
  schema_id: "entitlement",
  child_name: "The Child Wearing a Crown",
  area: "limits",
  conditional: false,
  one_liner: "A child in a crown, who can only settle when treated as someone special.",
  core_belief: "I'm someone who should be treated as special.",
  voice: "Why should I be treated like this? I'm different.",
  strength:
    "The drive to believe in your own worth and push toward what you want. It's the source of your initiative and self-assurance.",
  traits:
    "This is a type whose system for protecting your sense of presence is highly developed. You clearly know what you want and know how to ask for it, and with that drive you actually achieve a great deal. But you sense the moment of becoming 'one of many' as a threat to your existence, so even ordinary treatment can hurt you deeply.",
  auto_thoughts: [
    "Why should I be standing in this line?",
    "This is all they'll do for me?",
    "If I'm not special, I'm nothing.",
  ],
  auto_thought_notes: [
    "A moment when the same rule for everyone reads, to this child, as if only you are being erased.",
    "You convert the temperature of treatment into the weight of your existence, so ordinary service feels colder than it is.",
    "There's no middle ground between special and worthless, so an ordinary seat feels like a fall.",
  ],
  gap_hint:
    "Outside: comes across as confident and unhesitating / Inside: your sense of existence shakes when specialness isn't confirmed",
  triggers: [
    "When rules or order apply without exception",
    "The moment someone else gets the attention instead of you",
    "When the treatment feels ordinary relative to your effort",
  ],
  trigger_notes: [
    "The same line, the same rule reads, to this child, not as fairness but as 'the moment my specialness gets erased.' Because treatment was existence-confirmation, your heart hurts more than warranted before a no-exceptions application.",
    "When attention shifts elsewhere, inside this child the lamp of presence flickers. In a place where you should be celebrating, hurt or competitiveness rises first, and it catches even you off guard.",
    "Ordinary treatment is stored, for this child, close to the seat of 'being ignored.' Because existence is confirmed only when what you put in comes back as special, an ordinary response feels colder than it is.",
  ],
  typical_scenes: [
    "Getting the same treatment as everyone, you feel slighted — 'what do they take me for?'",
    "In a seat where you're not the lead, your interest cools sharply.",
  ],
  typical_scene_notes: [
    "When service or a response is merely average, you feel shortchanged and your expression stiffens first. The other person has no idea why, and you're too embarrassed to explain, so only friction remains.",
    "Without the spotlight, even the same task turns dull and you soon let go. Your drive dies at every stretch that needs consistency, so it starts dazzling and finishes hazy.",
  ],
  origin_hypothesis:
    "This often forms in environments where existence was acknowledged only when specialness was confirmed, or where most of what you wanted was allowed without the chance to learn boundaries and limits. In an environment like that, holding on to a special seat becomes a reasonable strategy for securing safety.",
  domains: {
    관계: "Sensitive to the temperature of how you're treated, so hurt and conflict come easily.",
    일: "You put out explosive results as the lead, but as a supporting player your drive drops sharply.",
    자기관리: "'I deserve at least this much' pushes out restraint, so balance topples easily.",
  },
  core_need:
    "What this child wanted was never 'the crown itself.' It's the confirmation of being precious even without being special. As experiences pile up of the ordinary you being fully respected too, the child can be at ease even with the crown set down.",
  reparenting_line: "The you of unspecial moments is precious too. You don't have to prove it.",
  coping_cards: [
    "Becoming one of many isn't a demotion — it's standing together.",
    "The urge to be treated specially belongs to the child. The strength to respect others equally belongs to me.",
  ],
  metrics: [
    { name: "Initiative", value: 91, tone: "hot", desc: "Your drive to clearly know what you want, ask for it, and push ahead is very high." },
    { name: "Need for Presence", value: 89, tone: "hot", desc: "The wish to be confirmed as a special presence works strongly in you." },
    { name: "Acceptance of the Ordinary", value: 23, tone: "cool", desc: "The sense of comfortably accepting the moment of being one of many is relatively weak." },
  ],
  symbol_action: "wearing a crown",
  key_emotion: "indignation",
  surface_reaction: "flares up",
  guardian_cost: {
    surrender: "An equal relationship — leaving only a trade of special treatment given and received.",
    avoidance: "Belonging — avoiding the seat of becoming ordinary loses the chance to mix in together.",
    overcompensation: "Real respect — the more treatment is won by demand, the less the heart follows.",
  },
};

// ───────────────────────── Domain 4. Other-Directedness ─────────────────────────

const SUBJUGATION: TypeCard = {
  schema_id: "subjugation",
  child_name: "The Child with Their Head Bowed",
  area: "other_directedness",
  conditional: true,
  one_liner: "A child who swallows what they meant to say, afraid of conflict, then repeats it to themselves alone.",
  core_belief: "If I say what I think, the relationship gets damaged.",
  voice: "Just hold it in. Speaking up only sours the mood.",
  strength:
    "The ability to quickly sense the signs of conflict and protect the mood. It's the source of your harmony and consideration.",
  traits:
    "This is a type whose system for preventing conflict is highly developed. Before the mood can sour, you adjust or fold your own opinion, keeping gatherings and relationships running smoothly. But the folded words don't vanish — they stay, and on the way home 'I should've said it' replays alone.",
  auto_thoughts: [
    "If I say this, it'll get awkward, right?",
    "It's faster if I just hold it in.",
    "Why couldn't I say anything back there…",
  ],
  auto_thought_notes: [
    "A moment when the calculation of ripples finishes before the words can leave your mouth.",
    "Holding it in gets learned as the fastest solution, so you shrink the place for your own opinion.",
    "The words you swallowed in the room only sharpen once you're alone, and come back as self-blame.",
  ],
  gap_hint:
    "Outside: comes across as agreeable and easygoing / Inside: the swallowed words pile up and you replay them alone afterward",
  triggers: [
    "A mood where opinions look about to differ",
    "When you have to go along with an unreasonable request or decision",
    "When voices rise or you sense someone is angry",
  ],
  trigger_notes: [
    "The moment the air goes taut, this child's priority switches automatically from 'what I think' to 'preserving the mood.' You miss the timing while choosing words, finish with a nod, and only the sentence stays in your heart.",
    "Even when a 'no' rises to your throat, the calculation of the ripples it would cause finishes first. The formula 'if I hold it in, it passes quietly' is written into your body, so you end up nodding even knowing it's too much.",
    "A sign of anger immediately summons an old, familiar scene for this child. Regardless of the content, your body shrinks first, and all your energy pours into calming the anger in the room rather than sorting the situation out.",
  ],
  typical_scenes: [
    "In a meeting, even with a different view, you nod along and regret it afterward.",
    "Even in an unfair situation, you laugh it off, and the scene follows you into the night.",
  ],
  typical_scene_notes: [
    "It ended smoothly in the room, but the moment you leave, the words you wanted to say sharpen. The self-blame of 'why couldn't I speak' lasts longer than the opinion itself.",
    "The moment of laughing it off is brief, but the night spent rewinding that scene is long. Swallowed words don't disappear — they pile up and leak out later as sensitivity in the wrong place.",
  ],
  origin_hypothesis:
    "This often forms in environments where voicing an opinion came back with a price — anger, coldness, long silence — or where matching the loudest person was what kept the peace in the room. In an environment like that, swallowing your words becomes a reasonable strategy for protecting the relationship.",
  domains: {
    관계: "Accommodating relationships feel comfortable, but swallowed words pile up until one day they burst, or your heart cools.",
    일: "You hold good ideas but can't put them forward, so your contribution looks smaller than it is.",
    자기관리: "Unable to refuse what you don't want to do, you often hand over control of your own time.",
  },
  core_need:
    "What this child wanted was never 'a relationship without conflict.' It's the experience that saying what you think doesn't break the relationship. As moments pile up where one small opinion is received safely, the child can lift their head.",
  reparenting_line: "You can say what you think. This relationship won't collapse because you spoke.",
  coping_cards: [
    "Voicing an opinion isn't an attack — it's including myself in the relationship.",
    "The urge to swallow it belongs to the child. The strength to bring out one sentence belongs to me.",
  ],
  metrics: [
    { name: "Conflict Detection", value: 90, tone: "hot", desc: "Your sense for catching the first signs of the air going taut, before others do, is very high." },
    { name: "Smoothing the Mood", value: 88, tone: "hot", desc: "Your ability to keep the room running smoothly, even by folding your own opinion, is strong." },
    { name: "Self-Expression", value: 24, tone: "cool", desc: "The sense of bearing discomfort and voicing your view on the spot is relatively weak." },
  ],
  symbol_action: "bowing your head",
  key_emotion: "frustration",
  surface_reaction: "goes along for now",
  guardian_cost: {
    surrender: "Your voice — the more you accommodate, the fainter your place in the relationship.",
    avoidance: "The experience of resolution — avoiding conflict, the strength to handle conflict never grows.",
    overcompensation: "The warmth of the relationship — held-in words burst at the wrong moment and hurt you both.",
  },
};

const APPROVAL_SEEKING: TypeCard = {
  schema_id: "approval_seeking",
  child_name: "The Child on the Stage",
  area: "other_directedness",
  conditional: true,
  one_liner: "A child who confirms themselves through applause, unable to come down off the stage.",
  core_belief: "My worth is decided by people's reactions.",
  voice: "How did everyone see it? No reaction… I guess it wasn't good.",
  strength:
    "The ability to read exactly what people like and rise to meet it. It's the source of your charm and drive to achieve.",
  traits:
    "This is a type whose system for reading others' reactions is highly developed. You quickly grasp which version wins favor and rise to that expectation, so you often earn good evaluations. But the source of your energy sits outside, so when the applause fades, even work you were doing well suddenly wavers.",
  auto_thoughts: [
    "If I post this, what will people say?",
    "No reaction means it wasn't good.",
    "I can't disappoint them — I have to meet the expectation.",
  ],
  auto_thought_notes: [
    "Before you even do it, you simulate the audience's reaction, preparing the evaluation before the content.",
    "You fill the blank of no-reaction with 'negative' rather than neutral, and go dark alone.",
    "Meeting expectations feels like a condition of existence, so the mere chance of disappointing becomes frightening.",
  ],
  gap_hint:
    "Outside: comes across as bright and full of energy / Inside: the moment the fuel of reaction cuts off, you quickly waver",
  triggers: [
    "When a post or piece of work gets no reaction",
    "When someone else gets the attention in a place where you were praised",
    "The time spent waiting for an evaluation or feedback",
  ],
  trigger_notes: [
    "No reaction reads, to this child, not as neutral but as negative. The interpretation 'I guess it wasn't good' attaches automatically, so it feels like not just the work but your own worth gets shaved down with it.",
    "The moment the direction of applause changes, this child feels the fuel that was coming to them cut off. The wish to celebrate the other person and the anxiety of your own place shrinking rise at once, and it gets complicated.",
    "While waiting for a result, this child simulates the other person's reaction dozens of ways. Swelling as you imagine praise, going dark as you imagine no reaction, over and over — the waiting itself drains you greatly.",
  ],
  typical_scenes: [
    "After posting, you keep checking reactions and your mind stays over there.",
    "Praise fills you up big, and no reaction empties you out just as big.",
  ],
  typical_scene_notes: [
    "Once you post, nothing else holds your attention, and you keep checking the numbers and notifications. When the reaction falls short of your hope, it feels like not the content but you as a person got smaller.",
    "You live for days on one word of praise, and go dark for days on no reaction. The remote for your mood sits outside, so even mid-success you can't set your own state.",
  ],
  origin_hypothesis:
    "This often forms in environments where the temperature of affection swung sharply between when you looked good and when you didn't, or where your results or appearance often became something the adults could brag about. In an environment like that, drawing a reaction becomes a reasonable strategy for securing affection.",
  domains: {
    관계: "Working to keep up a good appearance, the relationship tilts easily into stage and audience.",
    일: "You're strong at visible results, but your drive drops sharply for work no one recognizes.",
    자기관리: "Even in time alone, you prepare the 'you to show,' so you can't fully rest.",
  },
  core_need:
    "What this child wanted was never 'bigger applause.' It's a conviction about yourself that doesn't vanish when there's no reaction. As experiences pile up of moments that felt good even with no one watching, the child can come down off the stage and rest.",
  reparenting_line: "Even without applause, you're still you. You can come down off the stage.",
  coping_cards: [
    "No reaction isn't rejection — mostly people are just each busy with their own thing.",
    "The heart that wants applause belongs to the child. The strength to acknowledge myself belongs to me.",
  ],
  metrics: [
    { name: "Reading Reactions", value: 92, tone: "hot", desc: "Your sense for reading what people like and how they'll see it is very high." },
    { name: "Rising to Expectations", value: 88, tone: "hot", desc: "Your ability to lift your appearance and results to meet expectations is strong." },
    { name: "Internal Standard", value: 25, tone: "cool", desc: "The sense of scoring your own satisfaction regardless of reactions is relatively weak." },
  ],
  symbol_action: "standing on the stage",
  key_emotion: "restlessness",
  surface_reaction: "watches for reactions",
  guardian_cost: {
    surrender: "Your own standard — constantly changing direction to match others' applause.",
    avoidance: "Challenge — you come to avoid any stage where reaction isn't guaranteed.",
    overcompensation: "Real relationships — the bigger the you-on-display grows, the fewer people who truly see you.",
  },
};

// ───────────────────────── Domain 5. Overvigilance & Inhibition ─────────────────────────

const NEGATIVITY_PESSIMISM: TypeCard = {
  schema_id: "negativity_pessimism",
  child_name: "The Child Holding Their Worries",
  area: "overvigilance",
  conditional: false,
  one_liner: "A child who lines up the bad ending first, even in the face of good news.",
  core_belief: "The moment you let your guard down, things flow the wrong way.",
  voice: "Too early to be glad. You don't know until it's over.",
  strength:
    "The ability to spot in advance where things could go wrong. It's the source of your careful review and steady operation.",
  traits:
    "This is a type whose system for checking bad possibilities is highly developed. You find the gaps and variables in a plan first, reducing mistakes, and you become someone others trust to handle things. But the checking doesn't stop even in the face of good news, so a list of worries unfolds at the very moment you could be glad.",
  auto_thoughts: [
    "When things are going well is exactly when it's most dangerous.",
    "What happens if this goes wrong?",
    "If I brace for it in advance, I won't be disappointed.",
  ],
  auto_thought_notes: [
    "A moment when you translate smoothness not as reassurance but as 'hasn't gone off yet.'",
    "The better the news, the bigger what there is to lose looks, so scenario-checking runs before joy.",
    "An old rehearsal — living the bad ending in advance to reduce the disappointment.",
  ],
  gap_hint:
    "Outside: comes across as careful and airtight / Inside: even in good moments, you line up the bad ending first",
  triggers: [
    "Right after hearing good news",
    "When things are flowing smoothly, right on plan",
    "The time spent waiting for a result",
  ],
  trigger_notes: [
    "Before the joy can rise, a checking circuit switches on first — 'what if this goes sideways?' The better the news, the more there is to lose, so instead of celebrating, this child writes up a list of variables and tightens their heart.",
    "Smoothness reads, to this child, not as reassurance but as 'hasn't gone off yet.' A sense that you must have missed something somewhere makes you check again and again, so even while things go well you rarely settle.",
    "During time when nothing is decided, this child lives the bad-ending scenario in advance. It's a rehearsal to reduce disappointment, but the bracing itself fills the present with worry.",
  ],
  typical_scenes: [
    "At good news like an acceptance or a signed contract, a 'check the variables' loop runs before joy.",
    "Even when praised, it leads to 'what if I disappoint them later?'",
  ],
  typical_scene_notes: [
    "Even in a seat of congratulations, your head is running 'if this falls through, if the terms change.' Good news becomes something to manage before it can become joy.",
    "The better the evaluation, the higher the height you feel you could fall from next. So instead of enjoying the recognition, your heart moves first toward reducing the chance of disappointing.",
  ],
  origin_hypothesis:
    "This often forms in environments where bad things repeatedly followed good ones, or where you learned 'be careful' as the default beside a worried adult. In an environment like that, picturing the bad ending in advance becomes a reasonable strategy for reducing disappointment.",
  domains: {
    관계: "You pick out negative signals in the other person's words first, so reassurance doesn't last long.",
    일: "You're strong at reviewing variables, but the brakes come on at every moment of deciding and celebrating.",
    자기관리: "Worry keeps running like background noise, so even resting, your head doesn't rest.",
  },
  core_need:
    "What this child wanted was never 'a life with no bad things.' It's permission to enjoy the good, freely. As experiences pile up of being glad and nothing happening, the child can set down the worries they're holding, one at a time.",
  reparenting_line: "You can just enjoy this joy right now. Worrying can wait until then, and it won't be too late.",
  coping_cards: [
    "Worry is often not preparation, but living future pain in the present.",
    "The urge to brace belongs to the child. The strength to enjoy the present belongs to me.",
  ],
  metrics: [
    { name: "Checking Variables", value: 91, tone: "hot", desc: "Your ability to find the gaps in a plan and where it could go wrong, first, is very high." },
    { name: "Bracing for Disappointment", value: 87, tone: "hot", desc: "You strongly tend to picture the bad ending in advance to soften the shock." },
    { name: "Optimism Circuit", value: 24, tone: "cool", desc: "The sense of enjoying good things just as they are, without doubt, is relatively weak." },
  ],
  symbol_action: "holding your worries",
  key_emotion: "unease",
  surface_reaction: "braces for it first",
  guardian_cost: {
    surrender: "Moments of joy — greeting even good things by turning them into worries.",
    avoidance: "Opportunity — seeing the bad ending first, you end up folding the start itself.",
    overcompensation: "The pleasure of togetherness — checking and warnings lead, so the mood around you cools.",
  },
};

const EMOTIONAL_INHIBITION: TypeCard = {
  schema_id: "emotional_inhibition",
  child_name: "The Frozen Child",
  area: "overvigilance",
  conditional: true,
  one_liner: "A child frozen behind an expression, so no feeling can leak out.",
  core_belief: "If I show emotion, I ruin things or look foolish.",
  voice: "Don't let it show. Getting emotional means losing.",
  strength:
    "The ability to hold your composure without being swept up by emotion. It's the source of your steadiness and sound judgment.",
  traits:
    "This is a type whose system for regulating emotional expression is highly developed. You keep your composure in any situation, giving those around you a sense of stability, and you stay calm in a crisis. But the regulator locks away joy and hurt all at once, so even at the moment you want to express something, your heart can't come out.",
  auto_thoughts: [
    "If I show it here, I'll look strange.",
    "Even showing too much of what I like looks lightweight.",
    "Let me just tuck this feeling away for now.",
  ],
  auto_thought_notes: [
    "The moment a feeling rises, you calculate 'how it'll look' before feeling it.",
    "Even joy becomes a subject of restraint, so your expression always comes out a few degrees below the real thing.",
    "As 'tuck it away for now' repeats, it gets blurry even where the tucked-away feelings are.",
  ],
  gap_hint:
    "Outside: comes across as calm and unshaken / Inside: held-in feelings can't find an exit and pile up",
  triggers: [
    "A moment that calls for expressing emotion (celebration, comfort)",
    "When you're asked what's really on your mind",
    "When you're beside someone who shows emotion openly",
  ],
  trigger_notes: [
    "In scenes that call for emotion, like celebration or comfort, this child calculates not what they feel but 'how much is the right amount to show.' Because of that calculation, expression always comes out a half-beat late and a tone low.",
    "Faced with a question like 'how are you these days?', it feels like you know where the locked door is but the key won't come to hand. You end up offering only a tidy answer, and the words you actually wanted to say stay behind the door.",
    "Someone who expresses emotion freely is both enviable and uncomfortable. A tension of 'is it really okay to show that much' and a heavy ache of 'why can't I' rise together.",
  ],
  typical_scenes: [
    "Even at happy news, you press it down to a mere 'oh, nice.'",
    "Even on a day you want comfort, 'it's nothing' comes out first.",
  ],
  typical_scene_notes: [
    "Inside you're very glad, but outside it always gets translated a few degrees lower. The other person misreads it as indifference, and you keep the joy that never got across to yourself.",
    "The more a moment needs comfort, the more the sentence 'it's nothing' stands up first as a wall. It keeps you from falling apart, but the heart that wanted to lean loses its place to go.",
  ],
  origin_hypothesis:
    "This often forms in environments where showing emotion came back with dismissal or scolding, or where restraint and composure were praised over feeling. In an environment like that, locking your emotions away becomes a reasonable strategy for protecting yourself.",
  domains: {
    관계: "Not showing your inner self earns you a reputation for stability, but you stay there without deepening.",
    일: "Composure is a strength, but with enthusiasm and satisfaction hidden too, you can come across as dry.",
    자기관리: "Holding emotions in takes energy, so an unexplained fatigue and heaviness remain.",
  },
  core_need:
    "What this child wanted was never 'perfect composure.' It's the experience of being okay after showing emotion. As moments pile up where one piece of joy, one word of hurt, doesn't shake the relationship, the child can thaw the frozen body a little at a time.",
  reparenting_line: "You can say it just as you feel it. Nothing bad will happen even so.",
  coping_cards: [
    "Showing emotion isn't falling apart — it's conveying.",
    "The urge to lock it away belongs to the child. The strength to bring out one piece belongs to me.",
  ],
  metrics: [
    { name: "Emotional Regulation", value: 93, tone: "hot", desc: "Your power to hold your composure without being swept up by emotion, in any situation, is very high." },
    { name: "Keeping Calm", value: 89, tone: "hot", desc: "You stay calm in the face of crisis and conflict, giving those around you a sense of stability." },
    { name: "Emotional Expression", value: 22, tone: "cool", desc: "The sense of conveying what you feel outward at its true temperature is relatively weak." },
  ],
  symbol_action: "staying frozen",
  key_emotion: "a heavy numbness",
  surface_reaction: "pretends to be unmoved",
  guardian_cost: {
    surrender: "Vividness — the distance between what you feel and what you show becomes everyday.",
    avoidance: "The chance to be understood — if you don't show it, no one can know it.",
    overcompensation: "Easy relationships — demanding restraint of others too stiffens the space around you.",
  },
};

/** All 16. schema_id → card. */
export const EN_TYPE_CARDS: Record<string, TypeCard> = {
  // Domain 1. Disconnection & Rejection
  abandonment: ABANDONMENT,
  mistrust_abuse: MISTRUST_ABUSE,
  emotional_deprivation: EMOTIONAL_DEPRIVATION,
  defectiveness_shame: DEFECTIVENESS_SHAME,
  social_isolation: SOCIAL_ISOLATION,
  // Domain 2. Impaired Autonomy
  dependence_incompetence: DEPENDENCE_INCOMPETENCE,
  vulnerability_harm: VULNERABILITY_HARM,
  enmeshment: ENMESHMENT,
  failure: FAILURE,
  // Domain 3. Impaired Limits
  entitlement: ENTITLEMENT,
  // Domain 4. Other-Directedness
  subjugation: SUBJUGATION,
  self_sacrifice: SELF_SACRIFICE,
  approval_seeking: APPROVAL_SEEKING,
  // Domain 5. Overvigilance & Inhibition
  negativity_pessimism: NEGATIVITY_PESSIMISM,
  emotional_inhibition: EMOTIONAL_INHIBITION,
  unrelenting_standards: UNRELENTING_STANDARDS,
};

/** Returns the English type card (null if not found). */
export function getEnTypeCard(schemaId: string): TypeCard | null {
  return EN_TYPE_CARDS[schemaId] ?? null;
}
