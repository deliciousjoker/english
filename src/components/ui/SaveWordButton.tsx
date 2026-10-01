import { wordbook, useWordbook, type NewWord } from '../../state/words'
import { Icon } from './Icon'

/** Kelimeyi kelime defterine ekler / çıkarır. */
export function SaveWordButton({ word, variant = 'icon', className = '' }: { word: NewWord; variant?: 'icon' | 'pill'; className?: string }) {
  const book = useWordbook()
  const saved = word.key in book
  const label = saved ? `Remove "${word.word}" from my words` : `Save "${word.word}" to my words`
  return (
    <button
      type="button"
      className={`save save--${variant} ${saved ? 'is-saved' : ''} ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        wordbook.toggle(word)
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Icon name={saved ? 'bookmarkOn' : 'bookmark'} size={variant === 'icon' ? 18 : 16} />
      {variant === 'pill' && <span>{saved ? 'Saved' : 'Save word'}</span>}
    </button>
  )
}
