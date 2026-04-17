// ============================================================
// 飞书自定义机器人签名
// ============================================================
// string_to_sign = timestamp + "\n" + secret
// HMAC-SHA256(key = string_to_sign, msg = "") → base64
// ============================================================

import crypto from "crypto";

export function feishuSign(timestamp: string, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac("sha256", stringToSign);
  hmac.update("");
  return hmac.digest("base64");
}
