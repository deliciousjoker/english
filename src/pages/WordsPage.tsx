import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { allLessons, levelsWithLessons, loadGlossary, loadLevelLessons } from '../content/loader'
import type { Level, Support } from '../content/schema'
import { LEVEL_LABEL } from '../config'
import { PlayButton } from '../components/ui/PlayButton'
import { BidiText } from '../components/support/BidiText'
import { Icon } from '../components/ui/Icon'
import { wordKey } from '../lib/text'
import { useSettings } from '../state/settings'
import { SaveWordButton } from '../components/ui/SaveWordButton'
import { dueWords, useWordbook } from '../state/words'

export type WordEntry = {
  key: string
  word: string
  say?: string
  pos?: string
  example?: string
  gloss: Support
  /** Dersin kelime listesinden geliyorsa */
  level?: Level
  lesson?: { id: string; label: string }
}

/** Aramada harf farklarını yok say: şekil ve harekeler, Arapça elif / ya / ta marbuta biçimleri. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
}

/** Bütün derslerin kelime listeleri + sözlük (derste olmayan kelimeler sadece aramada çıkar). */
export async function loadAllWords(): Promise<WordEntry[]> {
  const top = levelsWithLessons[levelsWithLessons.length - 1] ?? 'a1'
  const [glossary, ...byLevel] = await Promise.all([loadGlossary(top), ...levelsWithLessons.map(loadLevelLessons)])
  const out = new Map<string, WordEntry>()
  for (const lessons of byLevel)
    for (const l of lessons) {
      const ref = allLessons.find((r) => r.id === l.id)
      for (const s of l.sections)
        if (s.type === 'vocabulary')
          for (const v of s.items) {
            const key = wordKey(v.word)
            if (out.has(key)) continue
            out.set(key, {
              key,
              word: v.word,
              say: v.say,
              pos: v.pos,
              example: v.example,
              gloss: v.gloss,
              level: l.level,
              lesson: { id: l.id, label: ref ? `${LEVEL_LABEL[l.level]} ${ref.unitNumber}.${ref.order}` : l.id },
            })
          }
    }
  for (const [key, gloss] of Object.entries(glossary)) if (!out.has(key)) out.set(key, { key, word: key, gloss })
  return [...out.values()].sort((a, b) => a.key.localeCompare(b.key, 'en'))
}

function Meaning({ gloss }: { gloss: Support }) {
  const { supportLang } = useSettings()
  const langs = supportLang === 'none' ? (['tr', 'ar'] as const) : [supportLang]
  return (
    <span className="lex__gloss">
      {langs.map((lang) =>
        gloss[lang] ? (
          <span key={lang} className={`support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <BidiText text={gloss[lang]!} lang={lang} />
          </span>
        ) : null,
      )}
    </span>
  )
}

export function WordsPage() {
  const [words, setWords] = useState<WordEntry[] | null>(null)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const book = useWordbook()
  const saved = Object.keys(book).length
  const due = dueWords(book).length

  useEffect(() => {
    let alive = true
    loadAllWords().then((w) => alive && setWords(w))
    return () => {
      alive = false
    }
  }, [])

  const shown = useMemo(() => {
    if (!words) return []
    const q = fold(query.trim())
    return words.filter((w) => {
      if (level !== 'all' && w.level !== level) return false
      // Derste geçmeyen sözlük maddeleri sadece aranınca çıkar
      if (!q) return !!w.level
      return fold(w.word).includes(q) || fold(w.gloss.tr ?? '').includes(q) || fold(w.gloss.ar ?? '').includes(q)
    })
  }, [words, query, level])

  const groups = useMemo(() => {
    const map = new Map<string, WordEntry[]>()
    for (const w of shown) {
      const letter = /^[a-z]/i.test(w.key) ? w.key[0].toUpperCase() : '#'
      map.set(letter, [...(map.get(letter) ?? []), w])
    }
    return [...map]
  }, [shown])

  return (
    <div className="page refpage">
      <header className="refhead">
        <h1 className="page__title">Words</h1>
        <p className="refhead__lead">Every word from the lessons. Search in English, Türkçe or العربية.</p>
        <Link to="/words/mine" className="mywords-link">
          <Icon name="bookmarkOn" size={18} />
          <span>
            My words: <b>{saved}</b>
            {due > 0 && <> · {due} to practice today</>}
          </span>
          <Icon name="arrowRight" size={16} />
        </Link>
        <div className="lex__tools">
          <label className="lex__search">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: coat, mont, معطف"
              aria-label="Search words"
            />
          </label>
          <nav className="levelnav" aria-label="Level">
            <button type="button" className={`levelnav__link ${level === 'all' ? 'is-on' : ''}`} onClick={() => setLevel('all')}>
              All
            </button>
            {levelsWithLessons.map((lv) => (
              <button
                key={lv}
                type="button"
                className={`levelnav__link lv-${lv} ${level === lv ? 'is-on' : ''}`}
                onClick={() => setLevel(lv)}
              >
                <span className="lvcode">{LEVEL_LABEL[lv]}</span>
              </button>
            ))}
          </nav>
        </div>
        {words && (
          <p className="lex__count" role="status">
            {shown.length} {shown.length === 1 ? 'word' : 'words'}
          </p>
        )}
      </header>

      {!words ? (
        <div className="page--loading" aria-busy="true" />
      ) : (
        <div className="lex">
          {groups.map(([letter, list]) => (
            <section key={letter} className="lex__group" aria-label={letter}>
              <h2 className="lex__letter">{letter}</h2>
              <ul className="lex__list">
                {list.map((w) => (
                  <li key={w.key} className={`lex__item ${w.level ? `lv-${w.level}` : ''}`}>
                    <div className="lex__main">
                      <PlayButton items={[{ key: `dict:${w.key}`, text: w.say ?? w.word }]} label={`Listen: ${w.word}`} />
                      <span className="lex__word">{w.word}</span>
                      {w.pos && <span className="lex__pos">{w.pos}</span>}
                      <Meaning gloss={w.gloss} />
                      <SaveWordButton
                        className="lex__save"
                        word={{ key: w.key, word: w.word, say: w.say, gloss: w.gloss, example: w.example, level: w.level, lessonId: w.lesson?.id }}
                      />
                    </div>
                    {(w.example || w.lesson) && (
                      <div className="lex__more">
                        {w.example && (
                          <span className="lex__example">
                            {w.example}
                            <PlayButton items={[{ key: `dict:${w.key}:e`, text: w.example }]} label="Listen to the example" className="lex__explay" />
                          </span>
                        )}
                        {w.lesson && (
                          <Link to={`/lesson/${w.lesson.id}`} className="lex__lesson">
                            {w.lesson.label}
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {shown.length === 0 && <p className="empty">No words found.</p>}
        </div>
      )}
    </div>
  )
}
