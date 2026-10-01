import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { getCharacter, lessonRef, loadLesson } from '../content/loader'
import { supportPolicy, type ExerciseSection, type Lesson, type Section, type Support } from '../content/schema'
import { GrammarBody } from '../components/grammar/GrammarSection'
import { sectionTitle } from '../components/lesson/SectionFrame'
import { sectionId } from '../components/lesson/LessonContext'
import { splitSentence } from '../components/exercises/WordOrderExercise'
import { BidiText } from '../components/support/BidiText'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { fillGaps, parseGaps, seededShuffle } from '../lib/text'
import { useSettings, type SupportLang } from '../state/settings'
import { SITE_NAME } from '../config'

/**
 * Yazdırılabilir çalışma kâğıdı: /lesson/:id/print
 * Ekrandaki ders kâğıda uyarlanır (boşluklar, kutucuklar, yazma satırları); cevap anahtarı ayrı sayfada.
 */

const LETTERS = 'abcdefghijklmnop'

function Help({ support, lang }: { support?: Support; lang: SupportLang }) {
  if (lang === 'none' || !support?.[lang]) return null
  return (
    <span className={`pr__help support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <BidiText text={support[lang]!} lang={lang} />
    </span>
  )
}

function Lines({ n }: { n: number }) {
  return (
    <div className="pr__lines" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}

function Head({ n, section, instructions, support, lang }: { n: number; section: Section; instructions?: string; support?: Support; lang: SupportLang }) {
  return (
    <header className="pr__head">
      <span className="pr__num">{n}</span>
      <div>
        <h2 className="pr__title">{sectionTitle(section)}</h2>
        {instructions && (
          <p className="pr__instr">
            {instructions} <Help support={support} lang={lang} />
          </p>
        )}
      </div>
    </header>
  )
}

/** Alıştırmanın kâğıt hâli ve cevap anahtarı satırları. */
function exercise(s: ExerciseSection, seed: string): { body: ReactNode; key: string[] } {
  switch (s.kind) {
    case 'mcq':
      return {
        body: (
          <ol className="pr__items">
            {s.items.map((it, i) => (
              <li key={i}>
                {it.audio && <span className="pr__listen">Listen.</span>} {it.prompt}
                <span className="pr__options">
                  {it.options.map((o, k) => (
                    <span key={k} className="pr__box">
                      {LETTERS[k]}) {o}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        ),
        key: s.items.map((it, i) => `${i + 1} ${LETTERS[it.answer]}) ${it.options[it.answer]}${it.audio ? ` (audio: "${it.audio}")` : ''}`),
      }
    case 'truefalse':
      return {
        body: (
          <ol className="pr__items">
            {s.items.map((it, i) => (
              <li key={i} className="pr__tf">
                <span>{it.statement}</span>
                <span className="pr__options">
                  <span className="pr__box">True</span>
                  <span className="pr__box">False</span>
                </span>
              </li>
            ))}
          </ol>
        ),
        key: s.items.map((it, i) => `${i + 1} ${it.answer ? 'True' : 'False'}`),
      }
    case 'gapfill':
      return {
        body: (
          <>
            {s.bank && (
              <p className="pr__bank">
                {s.bank.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </p>
            )}
            <ol className="pr__items">
              {s.items.map((it, i) => (
                <li key={i}>
                  {parseGaps(it).map((p, k) => (p.kind === 'text' ? <span key={k}>{p.text}</span> : <span key={k} className="pr__gap" />))}
                </li>
              ))}
            </ol>
          </>
        ),
        key: s.items.map((it, i) => `${i + 1} ${fillGaps(it)}`),
      }
    case 'wordorder':
      return {
        body: (
          <ol className="pr__items">
            {s.items.map((it, i) => {
              const { words, end } = splitSentence(it)
              return (
                <li key={i}>
                  <span className="pr__jumble">{seededShuffle(words, `${seed}:${i}`).join('  /  ')}</span>
                  {end && <span className="pr__end"> ({end})</span>}
                  <Lines n={1} />
                </li>
              )
            })}
          </ol>
        ),
        key: s.items.map((it, i) => `${i + 1} ${it}`),
      }
    case 'matching': {
      const order = seededShuffle(
        s.pairs.map((_, i) => i),
        seed,
      )
      return {
        body: (
          <div className="pr__match">
            <ol>
              {s.pairs.map(([left], i) => (
                <li key={i}>
                  <span className="pr__answerbox" /> {left}
                </li>
              ))}
            </ol>
            <ol className="pr__letters">
              {order.map((pi, k) => (
                <li key={k}>
                  <b>{LETTERS[k]})</b> {s.pairs[pi][1]}
                </li>
              ))}
            </ol>
          </div>
        ),
        key: s.pairs.map((_, i) => `${i + 1} ${LETTERS[order.indexOf(i)]}`),
      }
    }
    case 'ordering': {
      const order = seededShuffle(
        s.items.map((_, i) => i),
        seed,
      )
      return {
        body: (
          <ul className="pr__items pr__order">
            {order.map((oi, k) => (
              <li key={k}>
                <span className="pr__answerbox" /> {s.items[oi]}
              </li>
            ))}
          </ul>
        ),
        key: [order.map((oi) => oi + 1).join(', ') + '  (the number of each line, top to bottom)'],
      }
    }
    case 'dictation':
      return {
        body: (
          <ol className="pr__items">
            {s.items.map((_, i) => (
              <li key={i}>
                <Lines n={1} />
              </li>
            ))}
          </ol>
        ),
        key: s.items.map((it, i) => `${i + 1} ${it.text}`),
      }
  }
}

function PrintView({ lesson, lang }: { lesson: Lesson; lang: SupportLang }) {
  const [withKey, setWithKey] = useState(true)
  const policy = supportPolicy(lesson.level)
  const instrLang: SupportLang = policy.instructions ? lang : 'none'
  const glossLang: SupportLang = policy.glosses ? lang : 'none'
  const ref = lessonRef(lesson.id)
  const answers: { n: number; title: string; lines: string[] }[] = []

  const body = lesson.sections.map((s, i) => {
    const n = i + 1
    const id = sectionId(s, i)
    switch (s.type) {
      case 'warmup':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions="Talk about these questions." lang={instrLang} />
            <ul className="pr__bullets">
              {s.prompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        )
      case 'vocabulary':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions="Learn the words. Write the meaning if there's a line." lang={instrLang} />
            <table className="pr__vocab">
              <tbody>
                {s.items.map((v) => (
                  <tr key={v.word}>
                    <th>{v.word}</th>
                    <td className="pr__pos">{v.pos}</td>
                    <td className="pr__meaning">
                      {glossLang !== 'none' && v.gloss[glossLang] ? <Help support={v.gloss} lang={glossLang} /> : <span className="pr__gap pr__gap--long" />}
                    </td>
                    <td className="pr__ex">{v.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      case 'tiles':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions={s.instructions} support={s.support} lang={instrLang} />
            <p className="pr__tiles">
              {s.items.map((t, k) => (
                <span key={k}>
                  <b>{t.big}</b> {t.small}
                </span>
              ))}
            </p>
          </section>
        )
      case 'reading':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} lang={instrLang} />
            <article className="pr__text">
              {s.heading && <h3>{s.heading}</h3>}
              {s.intro && <p className="pr__intro">{s.intro}</p>}
              {s.paragraphs.map((p, k) => (
                <p key={k}>{p.join(' ')}</p>
              ))}
            </article>
          </section>
        )
      case 'dialogue':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} lang={instrLang} />
            <article className="pr__text">
              {s.heading && <h3>{s.heading}</h3>}
              {s.scene && <p className="pr__intro">{s.scene}</p>}
              <dl className="pr__script">
                {s.lines.map((l, k) => (
                  <div key={k}>
                    <dt>{getCharacter(l.speaker).name}</dt>
                    <dd>{l.text}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </section>
        )
      case 'grammar':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} lang={instrLang} />
            <GrammarBody section={s} id={`print:${id}`} policy={policy} />
          </section>
        )
      case 'exercise': {
        const { body, key } = exercise(s, `${lesson.id}:${id}`)
        answers.push({ n, title: sectionTitle(s), lines: key })
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions={s.instructions} support={s.support} lang={instrLang} />
            {body}
          </section>
        )
      }
      case 'writing':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions={s.prompt} support={s.support} lang={instrLang} />
            {s.model && (
              <figure className="pr__model">
                <figcaption>Example{s.model.heading ? ` · ${s.model.heading}` : ''}</figcaption>
                <p>{s.model.text.join(' ')}</p>
              </figure>
            )}
            {s.frame && (
              <ul className="pr__bullets">
                {s.frame.map((f) => (
                  <li key={f}>{f.replaceAll('___', '________')}</li>
                ))}
              </ul>
            )}
            <Lines n={Math.max(6, Math.ceil((s.minWords ?? 40) / 7))} />
          </section>
        )
      case 'wrapup':
        return (
          <section key={id} className="pr__sec">
            <Head n={n} section={s} instructions="Tick one box. Be honest!" lang={instrLang} />
            <ul className="pr__items pr__cando">
              {lesson.canDo.map((c) => (
                <li key={c}>
                  <span>{c}</span>
                  <span className="pr__options">
                    <span className="pr__box">Yes</span>
                    <span className="pr__box">Almost</span>
                    <span className="pr__box">Not yet</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
    }
  })

  return (
    <div className={`printpage lv-${lesson.level}`}>
      <div className="printbar">
        <Link to={`/lesson/${lesson.id}`} className="btn btn--ghost">
          <Icon name="arrowLeft" size={16} /> Back to the lesson
        </Link>
        <label className="printbar__opt">
          <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} /> Answer key on the last page
        </label>
        <span className="printbar__note">
          {lang === 'none' ? 'English only. Choose TR or ع at the top to print meanings.' : 'Meanings and help are printed in the help language.'}
        </span>
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          <Icon name="note" size={16} /> Print
        </button>
      </div>

      <div className="sheet">
        <header className="sheet__head">
          <div className="sheet__band">
            <span>
              {SITE_NAME} · <LevelCode level={lesson.level} /> · Unit {lesson.unit}
              {ref?.unitTitle ? `: ${ref.unitTitle}` : ''} · Lesson {lesson.order}
            </span>
          </div>
          <h1 className="sheet__title">{lesson.title}</h1>
          <p className="sheet__name">
            Name <span className="pr__gap pr__gap--long" /> Date <span className="pr__gap" />
          </p>
        </header>
        {body}
      </div>

      {withKey && answers.length > 0 && (
        <div className="sheet sheet--key">
          <h2 className="sheet__title">Answer key · {lesson.title}</h2>
          {answers.map((a) => (
            <section key={a.n} className="pr__keysec">
              <h3>
                {a.n}. {a.title}
              </h3>
              <ul>
                {a.lines.map((l, k) => (
                  <li key={k}>{l}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export function PrintLessonPage() {
  const { lessonId = '' } = useParams()
  const { supportLang } = useSettings()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadLesson(lessonId)
      .then((l) => alive && setLesson(l))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [lessonId])

  // Yazdırırken üst çubuk ve alt bilgi gizlensin
  useEffect(() => {
    document.documentElement.classList.add('is-printpage')
    return () => document.documentElement.classList.remove('is-printpage')
  }, [])

  const view = useMemo(() => (lesson && lesson.id === lessonId ? <PrintView lesson={lesson} lang={supportLang} /> : null), [lesson, lessonId, supportLang])
  if (error) return <pre className="page error-box">{error}</pre>
  return view ?? <div className="page page--loading" aria-busy="true" />
}
