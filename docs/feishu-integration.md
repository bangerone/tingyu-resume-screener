# 飞书集成

最简方案：**自定义群机器人 webhook**（无需企业自建应用、无需 OAuth）。

## 一、机器人接入步骤

1. 飞书 → 进入接收推送的群
2. 群设置 → 群机器人 → 添加机器人 → 自定义机器人
3. 命名 / 头像 / 描述
4. 安全设置勾选 **签名校验**（推荐）— 拿到 `secret`
5. 复制 webhook URL，填入 `.env.local`：
   ```
   FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx
   FEISHU_WEBHOOK_SECRET=xxxxxxxx
   ```

## 二、签名算法（仅签名校验开启时需要）

```ts
import crypto from "crypto";

function feishuSign(timestamp: string, secret: string) {
  // 飞书规则：string_to_sign = timestamp + "\n" + secret
  // 用 secret 作为 key 对空字符串做 HMAC-SHA256，得到的 buffer base64
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac("sha256", stringToSign);
  hmac.update("");
  return hmac.digest("base64");
}
```

请求体加：
```json
{ "timestamp": "1712000000", "sign": "...", ...payload }
```

## 三、消息卡片 schema（推荐 interactive card）

`features/feishu/build-card.ts` 应导出 `buildCandidateCard(application, job, score)` 返回：

```json
{
  "msg_type": "interactive",
  "card": {
    "config": { "wide_screen_mode": true },
    "header": {
      "template": "blue",
      "title": { "tag": "plain_text", "content": "🎯 高匹配候选人推送" }
    },
    "elements": [
      {
        "tag": "div",
        "fields": [
          { "is_short": true, "text": { "tag":"lark_md","content":"**岗位**\n前端工程师" } },
          { "is_short": true, "text": { "tag":"lark_md","content":"**总分**\n<font color='green'>**88**</font> / 100" } },
          { "is_short": true, "text": { "tag":"lark_md","content":"**候选人**\n张三" } },
          { "is_short": true, "text": { "tag":"lark_md","content":"**联系方式**\nzhangsan@example.com" } }
        ]
      },
      { "tag": "hr" },
      { "tag": "div", "text": { "tag":"lark_md","content":"**评估结论**\nReact + TS 经验扎实，3 年大厂背景；缺 SaaS 实战。" } },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": { "tag":"plain_text","content":"查看详情" },
            "type": "primary",
            "url": "https://your-app.vercel.app/admin/applications/<id>"
          }
        ]
      }
    ]
  }
}
```

## 四、推送时机

`/api/score/[id]` 评分完成后立即判断：
```ts
if (score.passed_hard && score.total >= job.push_threshold) {
  await pushToFeishu({ application, job, score });
  await markPushed(application.id);
}
```

## 五、错误处理

- HTTP 非 200 → 写 `feishu_logs.ok=false, response=<body>`
- 不重试（避免重复打扰群）
- HR 详情页提供「重新推送」按钮（D6 可选）

## 六、本地测试

`/api/feishu/test` 接收一个 `application_id`，构造 mock card 并推送。
D5 任务卡里提供 curl 示例。
