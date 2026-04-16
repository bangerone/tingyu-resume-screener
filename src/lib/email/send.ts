// ============================================================
// 邮件发送
// ============================================================
// dev：未配置 RESEND_API_KEY 时，验证码打印到 server console（方便 demo）
// prod：调 Resend API（3000 封/月免费）
// ============================================================

import { Resend } from "resend";

interface SendCodeArgs {
  to: string;
  code: string;
}

const FROM = process.env.EMAIL_FROM ?? "庭宇招聘 <noreply@tingyu.local>";

export async function sendCandidateCode({ to, code }: SendCodeArgs) {
  const apiKey = process.env.RESEND_API_KEY;

  // dev fallback — 直接控制台打印，不真的发邮件
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email-dev] →  ${to}\n  验证码: ${code}\n  （5 分钟内有效）\n`,
    );
    return { ok: true, devPrinted: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `庭宇招聘 · 验证码 ${code}`,
    html: codeEmailHtml(code),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  return { ok: true, devPrinted: false };
}

function codeEmailHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 24px auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px;">庭宇招聘 · 验证码</h2>
      <p style="color: #475569; margin: 0 0 24px 0;">请在 5 分钟内输入下方验证码完成登录：</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 24px; background: #f1f5f9; border-radius: 8px; color: #1e293b;">${code}</div>
      <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0 0;">如果不是你本人操作，请忽略此邮件。</p>
    </div>
  `;
}
