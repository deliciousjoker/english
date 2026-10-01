import type { GrammarSection as GrammarData, supportPolicy } from '../../content/schema'
import { parseBold } from '../../lib/text'
import { useSettings } from '../../state/settings'
import { PlayButton } from '../ui/PlayButton'
import { Icon } from '../ui/Icon'
import { SUPPORT_LABEL } from '../support/SupportText'
import { BidiText } from '../support/BidiText'
import { SectionFrame } from '../lesson/SectionFrame'
import { useLesson } from '../lesson/LessonContext'

function Bold({ text }: { text: string }) {
  return (
    <>{parseBold(text).map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}</>
  )
}

type Policy = ReturnType<typeof supportPolicy>

export function GrammarSection({ section, id, index }: { section: GrammarData; id: string; index: number }) {
  const { policy } = useLesson()
  return (
    <SectionFrame section={section} id={id} index={index}>
      <GrammarBody section={section} id={id} policy={policy} />
    </SectionFrame>
  )
}

/** Gramer kutusunun içi; derste ve gramer rehberi sayfasında aynı. */
export function GrammarBody({ section, id, policy }: { section: GrammarData; id: string; policy: Policy }) {
  const { supportLang } = useSettings()
  const lang = supportLang === 'none' ? null : supportLang
  const summary = lang && policy.grammar ? section.support?.[lang] : undefined
  const watch = lang ? section.watchOut?.[lang] : undefined

  return (
    <div className="grammar">
      {section.look && (
        <div className="grammar__look">
          <span className="grammar__label">Look</span>
          <ul>
            {section.look.map((l, i) => (
              <li key={i}>
                <Bold text={l} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.table && (
        <div className="grammar__tablewrap">
          <table className="grammar__table">
            {section.table.head && (
              <thead>
                <tr>
                  {section.table.head.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {section.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>
                      <Bold text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.rules.length > 0 && (
        <ul className="grammar__rules">
          {section.rules.map((r, i) => (
            <li key={i}>
              <Bold text={r} />
            </li>
          ))}
        </ul>
      )}

      {section.examples && (
        <ul className="grammar__examples">
          {section.examples.map((e, i) => (
            <li key={i}>
              <span>{e}</span>
              <PlayButton items={[{ key: `${id}:x${i}`, text: e }]} label="Listen" />
            </li>
          ))}
        </ul>
      )}

      {summary && lang && (
        <aside className={`grammar__support support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <span className="grammar__label">{lang === 'tr' ? 'Kısaca Türkçe' : 'باختصار بالعربية'}</span>
          <p>
            <BidiText text={summary} lang={lang} />
          </p>
        </aside>
      )}

      {watch && lang && (
        <aside className="grammar__watch">
          <span className="grammar__label">
            Watch out! <span className="grammar__for">· {SUPPORT_LABEL[lang]}</span>
          </span>
          <p className={`support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <BidiText text={watch.note} lang={lang} />
          </p>
          <div className="grammar__pairs">
            {watch.wrong.map((w, i) => (
              <div key={i} className="grammar__pair">
                <span className="grammar__wrong">
                  <Icon name="cross" size={16} /> <s>{w}</s>
                </span>
                {watch.right[i] && (
                  <span className="grammar__right">
                    <Icon name="check" size={16} /> {watch.right[i]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
