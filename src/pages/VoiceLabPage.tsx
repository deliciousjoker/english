import { useEffect, useRef, useState } from 'react'
import { audio, speakLive, useNaturalVoicesAvailable } from '../audio/AudioService'
import { Icon } from '../components/ui/Icon'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Ses deneme sayfası (sadece `npm run dev` ile açılır, yayına çıkmaz).
 * Örnekler: npx tsx scripts/voice-samples.ts → public/voice-lab/
 */

type Option = { label: string; voice: string; files: (string | null)[] }
type Entry = { id: string; name: string; current: string; sentences: string[]; options: Option[] }

const LIVE = 'Edge natural (canlı)'
const base = import.meta.env.BASE_URL

export function VoiceLabPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [choice, setChoice] = useState<Record<string, string>>(() => readJSON('voice-lab', {}))
  const [liveName, setLiveName] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const player = useRef<HTMLAudioElement | null>(null)
  const natural = useNaturalVoicesAvailable()

  useEffect(() => {
    fetch(`${base}voice-lab/index.json`)
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((j: { characters: Entry[] }) => setEntries(j.characters))
      .catch(() => setEntries([]))
  }, [])

  useEffect(() => writeJSON('voice-lab', choice), [choice])

  const playFile = (file: string) => {
    audio.stop()
    window.speechSynthesis?.cancel()
    player.current ??= new Audio()
    player.current.src = `${base}${file}`
    void player.current.play()
  }
  const playLive = (id: string, text: string) => {
    player.current?.pause()
    const name = speakLive(text, id)
    if (name) setLiveName((m) => ({ ...m, [id]: name }))
  }

  const summary = entries
    ?.map((e) => `${e.name}: ${choice[e.id] ?? '(seçilmedi)'}`)
    .join('\n')

  return (
    <div className="page voicelab">
      <header className="voicelab__head">
        <p className="kicker">Sadece senin bilgisayarında</p>
        <h1 className="page__title">Ses deneme sayfası</h1>
        <p>
          Her karakter için aynı üç cümleyi farklı seslerle dinle ve en beğendiğini işaretle. <b>q8</b> şu anki
          sesler, <b>fp32</b> aynı motorun sıkıştırılmamış (daha kaliteli) hâli.
          {natural
            ? ' "Edge natural" satırı bu tarayıcının kendi doğal sesleriyle canlı okur.'
            : ' "Edge natural" satırını duymak için bu sayfayı Microsoft Edge ile aç.'}
        </p>
        <p>
          Başka motorlar:{' '}
          <a href="https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd" target="_blank" rel="noreferrer">
            Google Chirp 3 HD örnekleri
          </a>{' '}
          ·{' '}
          <a href="https://huggingface.co/spaces/ResembleAI/Chatterbox" target="_blank" rel="noreferrer">
            Chatterbox denemesi
          </a>
        </p>
      </header>

      {entries === null && <p>Yükleniyor…</p>}
      {entries?.length === 0 && (
        <p className="error-box">Örnek yok. Önce şunu çalıştır: npx tsx scripts/voice-samples.ts</p>
      )}

      {entries?.map((e) => (
        <section key={e.id} className="voicelab__char">
          <h2 className="voicelab__name">
            {e.name} <small>şu an: {e.current}</small>
          </h2>
          <ol className="voicelab__sentences">
            {e.sentences.map((t, i) => (
              <li key={i}>
                <span className="voicelab__n">{i + 1}</span> {t}
              </li>
            ))}
          </ol>
          <table className="voicelab__table">
            <tbody>
              {[...e.options.map((o) => o.label), LIVE].map((label) => {
                const option = e.options.find((o) => o.label === label)
                return (
                  <tr key={label} className={choice[e.id] === label ? 'is-chosen' : ''}>
                    <th>
                      <label>
                        <input
                          type="radio"
                          name={`choice-${e.id}`}
                          checked={choice[e.id] === label}
                          onChange={() => setChoice((c) => ({ ...c, [e.id]: label }))}
                          disabled={label === LIVE && !natural}
                        />{' '}
                        {label}
                        {label === LIVE && liveName[e.id] && <small> · {liveName[e.id]}</small>}
                      </label>
                    </th>
                    {e.sentences.map((t, i) => {
                      const file = option?.files[i]
                      const live = label === LIVE
                      return (
                        <td key={i}>
                          <button
                            type="button"
                            className="play play--icon"
                            disabled={live ? !natural : !file}
                            aria-label={`Play ${label}, sentence ${i + 1}`}
                            onClick={() => (live ? playLive(e.id, t) : file && playFile(file))}
                          >
                            <Icon name="speaker" size={18} />
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ))}

      {entries && entries.length > 0 && (
        <section className="voicelab__summary">
          <h2 className="voicelab__name">Seçimlerin</h2>
          <pre>{summary}</pre>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              void navigator.clipboard.writeText(summary ?? '')
              setCopied(true)
            }}
          >
            <Icon name="copy" size={16} /> {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </section>
      )}
    </div>
  )
}
