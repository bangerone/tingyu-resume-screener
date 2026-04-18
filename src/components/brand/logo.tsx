// ============================================================
// 庭宇科技 品牌组件
// 纯 SVG（无外部文件），六边形菱面蓝色 logo + 文字
// ============================================================

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: number;
}

export function BrandLogo({
  className,
  showText = true,
  textClassName,
  size = 28,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight text-slate-800",
            textClassName,
          )}
        >
          庭宇科技
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="庭宇科技 logo"
    >
      <defs>
        <linearGradient id="ty-face-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4DA8FF" />
          <stop offset="100%" stopColor="#1E6BFF" />
        </linearGradient>
        <linearGradient id="ty-face-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#1749D6" />
          <stop offset="100%" stopColor="#3576FF" />
        </linearGradient>
        <linearGradient id="ty-face-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CC0FF" />
          <stop offset="100%" stopColor="#3A8DFF" />
        </linearGradient>
      </defs>
      {/* 外框六边形 */}
      <polygon
        points="32,2 60,18 60,46 32,62 4,46 4,18"
        fill="none"
        stroke="#1E6BFF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* 内部三菱面 */}
      <polygon points="32,10 54,22 32,32" fill="url(#ty-face-a)" />
      <polygon points="54,22 54,42 32,32" fill="url(#ty-face-b)" />
      <polygon points="32,32 54,42 32,54 10,42" fill="url(#ty-face-c)" />
      <polygon points="10,22 32,10 32,32 10,42" fill="url(#ty-face-b)" opacity="0.85" />
    </svg>
  );
}
