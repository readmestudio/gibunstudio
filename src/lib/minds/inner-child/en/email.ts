import { getResend } from "@/lib/newsletter/resend-client";
import { enFullReportLink } from "./site-url";

/**
 * 영어 inner-child full 리포트 링크 메일. Resend 로 자동 발송한다(saju/email.ts 미러).
 *
 * From 은 인증된 발송 도메인(gibunstudio.com)이어야 한다 — @gmail.com 은 SPF/DKIM 증명이
 * 불가해 자동발송에 못 쓴다(project_resend_sending_domain). NEWSLETTER_FROM_EMAIL 재사용.
 *
 * 본문에 원고를 넣지 않는다(Gmail 잘림 + 제품이 아니라 편지로 읽힘) — 링크만 보낸다.
 */

function fromAddress(): string {
  const email = process.env.INNER_CHILD_FROM_EMAIL ?? process.env.NEWSLETTER_FROM_EMAIL;
  if (!email) throw new Error("INNER_CHILD_FROM_EMAIL / NEWSLETTER_FROM_EMAIL 미설정");
  return `GIBUN · Inner Child <${email}>`;
}

export async function sendEnFullReportEmail(args: {
  to: string;
  leadId: string;
  childName: string;
}): Promise<{ ok: boolean; reason?: string; messageId?: string }> {
  const { to, leadId, childName } = args;
  // ⚠️ 정식 도메인 가드 — env 의 프리뷰/로컬 값이 죽은 링크를 발송하는 사고 방지(site-url.ts).
  const link = enFullReportLink(leadId);

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to,
      replyTo: process.env.INNER_CHILD_REPLY_TO ?? undefined,
      subject: `Your full Inner Child report — ${childName}`,
      html: `
<div style="font-family:-apple-system,'Segoe UI',sans-serif;background:#1C1813;padding:40px 20px;color:#F1E9DA;">
  <div style="max-width:440px;margin:0 auto;">
    <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9A9DB8;margin:0 0 18px;">
      GIBUN Studio · Inner Child
    </p>
    <h1 style="font-size:28px;line-height:1.2;font-weight:800;margin:0 0 16px;color:#fff;">
      Your full report is ready.
    </h1>
    <p style="font-size:16px;line-height:1.7;color:#D8D2E4;margin:0 0 8px;">
      We read your answers all the way through and wrote the deep version — for
      <b style="color:#B5B1E4;">${childName}</b>, the child living inside you.
    </p>
    <p style="font-size:16px;line-height:1.7;color:#D8D2E4;margin:0 0 28px;">
      Why it reacts the way it does, the loop it runs, the guardian behind it, and how to live alongside it — it&rsquo;s all waiting.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#6C6AA8;color:#fff;text-decoration:none;font-weight:800;
              font-size:16px;padding:15px 28px;border-radius:12px;">
      Read my full report
    </a>
    <p style="font-size:12px;color:#8E93AD;line-height:1.7;margin:28px 0 0;">
      Or open this link: <br /><a href="${link}" style="color:#B5B1E4;">${link}</a>
    </p>
    <p style="font-size:11px;color:#6E6A62;line-height:1.6;margin:24px 0 0;">
      This report is for self-reflection, not a medical or clinical diagnosis. If you&rsquo;re going through a hard time,
      please reach out to a professional near you.
    </p>
  </div>
</div>`.trim(),
    });
    if (error) {
      return { ok: false, reason: String(error.message ?? error) };
    }
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
