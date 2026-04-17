// pdf-parse 的 package.json main 指向会在 import 时跑 demo（读磁盘上一份测试 pdf），
// 直接引用 lib 子模块可以避开副作用，但官方没发类型，这里手写一份最小声明。
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }
  const pdfParse: (data: Buffer | Uint8Array) => Promise<PdfParseResult>;
  export default pdfParse;
}
