export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-[340px] w-full max-w-lg ${className}`}>
      <div className="absolute right-8 top-2 h-16 w-16 rounded-full bg-violet-100" />
      <div className="absolute bottom-10 left-6 h-10 w-10 rounded-full bg-amber-100" />
      <svg viewBox="0 0 560 430" className="h-full w-full" aria-hidden>
        <ellipse cx="280" cy="400" rx="200" ry="18" fill="#ecebff" />
        <rect x="190" y="214" width="200" height="120" rx="22" fill="#eef2ff" />
        <rect x="214" y="232" width="118" height="70" rx="12" fill="#c7d2fe" />
        <circle cx="273" cy="258" r="12" fill="#6366f1" />
        <rect x="236" y="278" width="74" height="8" rx="4" fill="#a5b4fc" />
        <rect x="248" y="292" width="50" height="6" rx="3" fill="#c7d2fe" />
        <path d="M88 336c0-28 22-50 50-50h18v118H118a30 30 0 0 1-30-30Z" fill="#34d399" />
        <circle cx="148" cy="244" r="34" fill="#fde68a" />
        <circle cx="138" cy="240" r="4" fill="#1f2937" />
        <circle cx="158" cy="240" r="4" fill="#1f2937" />
        <path d="M138 258c6 8 16 8 22 0" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        <rect x="118" y="278" width="62" height="86" rx="22" fill="#10b981" />
        <path d="M186 336c0-26 18-44 44-44h10v122H216a30 30 0 0 1-30-30Z" fill="#a78bfa" />
        <circle cx="236" cy="208" r="36" fill="#fdba74" />
        <circle cx="226" cy="204" r="4" fill="#1f2937" />
        <circle cx="246" cy="204" r="4" fill="#1f2937" />
        <path d="M226 222c6 8 16 8 22 0" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        <rect x="204" y="242" width="64" height="98" rx="24" fill="#8b5cf6" />
        <path d="M292 348h70v24a28 28 0 0 1-28 28h-14a28 28 0 0 1-28-28Z" fill="#38bdf8" />
        <circle cx="328" cy="228" r="32" fill="#fca5a5" />
        <circle cx="318" cy="224" r="4" fill="#1f2937" />
        <circle cx="338" cy="224" r="4" fill="#1f2937" />
        <path d="M318 242c6 8 16 8 22 0" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        <rect x="298" y="258" width="60" height="90" rx="22" fill="#0ea5e9" />
        <path d="M372 348h54v20a24 24 0 0 1-24 24h-6a24 24 0 0 1-24-24Z" fill="#fbbf24" />
        <circle cx="400" cy="274" r="30" fill="#fcd34d" />
        <circle cx="390" cy="270" r="4" fill="#1f2937" />
        <circle cx="410" cy="270" r="4" fill="#1f2937" />
        <path d="M390 288c6 8 16 8 22 0" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        <rect x="374" y="302" width="52" height="72" rx="18" fill="#f59e0b" />
        <rect x="386" y="250" width="28" height="18" rx="6" fill="#1e293b" />
      </svg>
    </div>
  );
}
