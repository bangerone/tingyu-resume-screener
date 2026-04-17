// 纯 SVG + tailwind keyframes，不引入 framer-motion。
// pop-in 让整圈弹进来，check-draw 让对勾一笔画过去。

export function SuccessCheck() {
  return (
    <div className="mx-auto flex h-20 w-20 animate-pop-in items-center justify-center rounded-full bg-emerald-100 shadow-[0_0_0_10px_rgba(16,185,129,0.08)]">
      <svg
        viewBox="0 0 52 52"
        className="h-12 w-12"
        aria-hidden
      >
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M14 27 L23 36 L39 18"
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="48"
          strokeDashoffset="48"
          className="animate-check-draw [animation-delay:250ms]"
        />
      </svg>
    </div>
  );
}
