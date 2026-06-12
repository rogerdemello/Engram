export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="mneme-g" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* memory cell: a rounded hex holding a spark */}
      <path
        d="M16 2.5 27 8.75 V21.25 L16 27.5 5 21.25 V8.75 Z"
        stroke="url(#mneme-g)"
        strokeWidth="2"
        fill="rgba(139,92,246,0.08)"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15" r="3.4" fill="url(#mneme-g)" />
      <path d="M16 15 L22.5 11.2 M16 15 L9.5 11.2 M16 15 L16 22.6" stroke="url(#mneme-g)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="22.5" cy="11.2" r="1.5" fill="#10B981" />
      <circle cx="9.5" cy="11.2" r="1.5" fill="#8B5CF6" />
      <circle cx="16" cy="22.6" r="1.5" fill="#38BDF8" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-[1.15rem] font-semibold tracking-tight">Mneme</span>
    </div>
  );
}
