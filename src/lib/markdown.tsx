// ============================================================
// 极简 Markdown → React 渲染
// ============================================================
// 只支持岗位描述里用到的几种元素：
//   ## / ###       → h2 / h3
//   - / * 开头     → 无序列表
//   空行           → 段落分隔
//   **粗体** / `行内代码`
// 不解析链接 / 图片 / 表格，避免踩 XSS 和无关依赖。
// 未来如果真的需要，再换 react-markdown。
// ============================================================

import { Fragment, type ReactNode } from "react";

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "p"; text: string };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.length) {
      blocks.push({ kind: "ul", items: list });
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushPara();
      flushList();
      blocks.push({ kind: "h2", text: h2[1] });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushPara();
      flushList();
      blocks.push({ kind: "h3", text: h3[1] });
      continue;
    }

    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) {
      flushPara();
      list ??= [];
      list.push(li[1]);
      continue;
    }

    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

// 行内解析：**bold** 和 `code`
function renderInline(s: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      out.push(<Fragment key={`${keyBase}-t-${i++}`}>{s.slice(last, m.index)}</Fragment>);
    }
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-b-${i++}`} className="font-semibold text-slate-900">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <code
          key={`${keyBase}-c-${i++}`}
          className="rounded bg-slate-100 px-1 py-0.5 text-[13px]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) {
    out.push(<Fragment key={`${keyBase}-t-${i++}`}>{s.slice(last)}</Fragment>);
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
      {blocks.map((b, idx) => {
        const k = `b-${idx}`;
        if (b.kind === "h2") {
          return (
            <h2
              key={k}
              className="mt-6 text-lg font-semibold text-slate-900 first:mt-0"
            >
              {renderInline(b.text, k)}
            </h2>
          );
        }
        if (b.kind === "h3") {
          return (
            <h3 key={k} className="mt-4 text-base font-semibold text-slate-900">
              {renderInline(b.text, k)}
            </h3>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={k} className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
              {b.items.map((it, j) => (
                <li key={`${k}-${j}`}>{renderInline(it, `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={k}>{renderInline(b.text, k)}</p>;
      })}
    </div>
  );
}
