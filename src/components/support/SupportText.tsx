import type { Support } from '../../content/schema'
import { useSettings } from '../../state/settings'
import { BidiText } from './BidiText'

/** Öğrencinin seçtiği dildeki destek metni (Türkçe veya Arapça). Seçilmemişse hiçbir şey göstermez. */
export function SupportText({
  support,
  as: Tag = 'p',
  className = '',
}: {
  support: Support | undefined
  as?: 'p' | 'span' | 'div'
  className?: string
}) {
  const { supportLang } = useSettings()
  if (supportLang === 'none' || !support) return null
  const text = support[supportLang]
  if (!text) return null
  return (
    <Tag className={`support support--${supportLang} ${className}`} lang={supportLang} dir={supportLang === 'ar' ? 'rtl' : 'ltr'}>
      <BidiText text={text} lang={supportLang} />
    </Tag>
  )
}

export const SUPPORT_LABEL = { tr: 'Türkçe', ar: 'العربية' } as const
