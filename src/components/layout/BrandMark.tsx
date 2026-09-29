/** Logo: kenarı kıvrılmış bir sayfa ve üzerinde bir satır. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="brandmark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path className="brandmark__page" d="M7 4h13l6 6v18H7z" />
      <path className="brandmark__fold" d="M20 4v6h6" />
      <path className="brandmark__line" d="M11 16h11M11 20.5h8" />
    </svg>
  )
}
