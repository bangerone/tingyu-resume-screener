// D4 verification helper: generate a DOCX resume and upload to COS
// under the test-d3 candidate (dec1c97e-abc9-4b2b-b574-4605ac17bd2a).
// jszip is available transitively via mammoth.

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const JSZip = require("jszip");

const env = fs.readFileSync(".env.local", "utf8");
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"](.*)['"]$/, "$1");
}

const resumeLines = [
  "王雨晴",
  "高级前端工程师 · 5 年经验 · 北京",
  "邮箱：wangyq@example.com · 电话：13900001234",
  "",
  "教育背景",
  "清华大学 · 计算机科学与技术 · 本科 · 2015-09 ~ 2019-07",
  "",
  "工作经历",
  "2019-08 ~ 2022-05 · 阿里巴巴 · 前端工程师",
  "负责淘宝首页 SSR 改造，LCP 从 3.2s 降至 1.4s；主导 React 18 升级落地到 12 条业务线。",
  "2022-06 ~ 至今 · 腾讯 · 高级前端工程师",
  "QQ 音乐 Web 技术负责人，Next.js + TypeScript 架构升级；搭建 Monorepo (pnpm + turborepo)，统一 6 条业务线构建和发布。首屏 LCP -60%。",
  "",
  "技能",
  "TypeScript · React · Next.js · Node.js · Vite · Monorepo · 性能优化 · CSS · 微前端 · CI/CD",
  "",
  "项目",
  "QQ 音乐 Web 下一代架构（技术负责人）",
  "Next.js App Router + Server Components，首屏 LCP -60%，覆盖亿级 MAU。",
];

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const paragraphs = resumeLines
  .map((line) => `<w:p><w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r></w:p>`)
  .join("");

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}</w:body>
</w:document>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const zip = new JSZip();
zip.file("[Content_Types].xml", contentTypesXml);
zip.file("_rels/.rels", relsXml);
zip.file("word/document.xml", documentXml);

const buf = await zip.generateAsync({ type: "nodebuffer" });
console.log("DOCX size:", buf.length);

// local sanity check via mammoth
const mammoth = (await import("mammoth")).default;
const r = await mammoth.extractRawText({ buffer: buf });
console.log("extracted chars:", r.value.length);
console.log("preview:", r.value.slice(0, 120).replace(/\s+/g, " "));

// upload
const COS = (await import("cos-nodejs-sdk-v5")).default;
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});
const candidateId = "dec1c97e-abc9-4b2b-b574-4605ac17bd2a";
const fileKey = `resumes/${candidateId}/${Date.now()}.docx`;

await new Promise((resolve, reject) => {
  cos.putObject(
    {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: fileKey,
      Body: buf,
      ContentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    (err, data) => (err ? reject(err) : resolve(data)),
  );
});
console.log("UPLOADED:", fileKey);
