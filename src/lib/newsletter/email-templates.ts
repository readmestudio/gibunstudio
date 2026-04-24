import type { Essay } from "@/lib/essays/data";

/**
 * 이메일 클라이언트 호환성을 위해 인라인 스타일 + 테이블 레이아웃은 피하고
 * 간단한 div + 제한된 CSS 속성만 사용. 대부분 Gmail/네이버/Apple Mail에서 정상 렌더됨.
 */

interface WelcomeArgs {
  email: string;
  unsubscribeUrl: string;
}

export function buildWelcomeEmail({ email, unsubscribeUrl }: WelcomeArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "마음 구독 에세이에 오신 걸 환영해요";
  const html = wrapEmail({
    preheader: "매주 목요일, 기분 스튜디오가 조용히 편지를 보낼게요.",
    body: `
      <h1 style="font-size:24px; line-height:1.4; margin:0 0 16px 0; color:#1a1a1a;">
        마음 구독 에세이에 오신 걸 환영해요
      </h1>
      <p style="font-size:15px; line-height:1.75; margin:0 0 16px 0; color:#333;">
        <strong>${escapeHtml(email)}</strong>으로 매주 목요일마다
        기분 스튜디오가 준비한 짧은 편지를 보내드릴게요.
      </p>
      <p style="font-size:15px; line-height:1.75; margin:0 0 24px 0; color:#333;">
        번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게
        건네는 이야기예요. 곧 첫 편지가 도착합니다.
      </p>
      <p style="font-size:13px; line-height:1.6; margin:32px 0 0 0; color:#888;">
        편지가 부담스러워질 땐 언제든
        <a href="${unsubscribeUrl}" style="color:#888; text-decoration:underline;">구독 해지</a>
        하실 수 있어요.
      </p>
    `,
    unsubscribeUrl,
  });
  const text = [
    "마음 구독 에세이에 오신 걸 환영해요",
    "",
    `${email}으로 매주 목요일마다 기분 스튜디오가 준비한 짧은 편지를 보내드릴게요.`,
    "",
    "번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게 건네는 이야기예요.",
    "곧 첫 편지가 도착합니다.",
    "",
    `구독 해지: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject, html, text };
}

interface WeeklyArgs {
  essay: Essay;
  essayUrl: string;
  unsubscribeUrl: string;
}

export function buildWeeklyEmail({
  essay,
  essayUrl,
  unsubscribeUrl,
}: WeeklyArgs): { subject: string; html: string; text: string } {
  const subject = `[마음 구독 에세이] ${essay.title}`;
  const bodyText = essay.body ?? essay.preview;

  // 본문 문단을 <p>로 감싸기 (빈 줄 기준)
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="font-size:15px; line-height:1.85; margin:0 0 18px 0; color:#2a2a2a; white-space:pre-wrap;">${escapeHtml(p)}</p>`
    )
    .join("");

  const html = wrapEmail({
    preheader: essay.preview,
    body: `
      <p style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#888; margin:0 0 12px 0;">
        마음 구독 에세이
      </p>
      <h1 style="font-size:26px; line-height:1.35; margin:0 0 20px 0; color:#1a1a1a; font-weight:700;">
        ${escapeHtml(essay.title)}
      </h1>
      <p style="font-size:15px; line-height:1.7; margin:0 0 28px 0; color:#666; font-style:italic;">
        ${escapeHtml(essay.preview)}
      </p>
      <div style="border-top:1px solid #e5e5e5; padding-top:24px;">
        ${paragraphs}
      </div>
      <div style="margin-top:32px; padding-top:24px; border-top:1px solid #e5e5e5;">
        <a href="${essayUrl}" style="display:inline-block; padding:12px 24px; background:#1a1a1a; color:#ffffff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
          기분 스튜디오에서 보기
        </a>
      </div>
      <p style="font-size:13px; line-height:1.6; margin:32px 0 0 0; color:#888;">
        편지가 부담스러워질 땐 언제든
        <a href="${unsubscribeUrl}" style="color:#888; text-decoration:underline;">구독 해지</a>
        하실 수 있어요.
      </p>
    `,
    unsubscribeUrl,
  });

  const text = [
    `[마음 구독 에세이] ${essay.title}`,
    "",
    essay.preview,
    "",
    "───",
    "",
    bodyText,
    "",
    "───",
    "",
    `기분 스튜디오에서 보기: ${essayUrl}`,
    `구독 해지: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

/* ─────────────────────── 내부 유틸 ─────────────────────── */

interface WrapArgs {
  preheader: string;
  body: string;
  unsubscribeUrl: string;
}

function wrapEmail({ preheader, body }: WrapArgs): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>기분 스튜디오</title>
</head>
<body style="margin:0; padding:0; background:#f7f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Segoe UI', Roboto, sans-serif; color:#1a1a1a;">
  <!-- 프리헤더: 받은편지함 미리보기에 노출되는 한 줄 -->
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#f7f5f1;">
    ${escapeHtml(preheader)}
  </div>
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="background:#ffffff; padding:40px 32px; border-radius:12px;">
      ${body}
    </div>
    <p style="font-size:11px; color:#aaa; text-align:center; margin:24px 0 0 0; line-height:1.6;">
      기분 스튜디오 · 마음 구독 에세이
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
