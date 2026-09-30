/** Logo: rafta üç kitap, dördüncüsü yana yaslanmış (renkler seviye kapaklarından). */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="brandmark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3.5" y="9" width="5" height="19" rx="0.6" fill="var(--lv-a1)" />
      <rect x="9.5" y="5" width="5" height="23" rx="0.6" fill="var(--lv-a2)" />
      <rect x="15.5" y="10" width="5" height="18" rx="0.6" fill="var(--lv-b2)" />
      <rect x="24.3" y="8" width="5" height="20" rx="0.6" fill="var(--lv-b1)" transform="rotate(-12 24.3 28)" />
      <path d="M1.5 28.5h29" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
