# Sunum modu (Presentation mode): ayrıntılı tanım

> **Bu dosyayı nasıl kullanırsın:** Başka bir projede aynı özelliği istediğinde bu dosyanın tamamını yapay zekâya ver ve
> şunu yaz: "Bu dokümandaki sunum modunu benim projeme uyarla. 'Projeye özel parçalar' bölümündeki yerleri benim
> projemdeki karşılıklarıyla değiştir." Dosyanın sonunda çalışan kaynak kodun tamamı var.

Folio (React 19 + TypeScript + düz CSS) adlı ders sitesinde, öğretmenin bir dersi Zoom/Teams'te ekran paylaşarak
anlatması için yapılmış tam ekran sunum görünümü. Ders sayfası bölümlerden (kelimeler, diyalog, okuma, gramer,
alıştırmalar…) oluşur; sunum modu bu bölümleri **slayt slayt** gösterir. Öğretmen slaytın üstüne kalemle çizebilir,
fosforlu kalemle işaretleyebilir, yazı yazabilir, silebilir, geri alabilir ve geri sayım başlatabilir.

---

## 1. Genel davranış

- Ders sayfasında **Present** düğmesi var. Basınca sayfa yerine `PresentationView` gösterilir (aynı rota, React
  state ile: `presenting ? <PresentationView/> : <normal ders sayfası/>`). **Exit** ya da **Esc** ile ders sayfasına dönülür.
- Sunum açıkken `<html>` elementine `is-presenting` sınıfı eklenir:
  - Yazı boyutu büyür: `font-size: 118%`, geniş ekranda (≥1400px) `132%`. Bütün `rem` ölçüleri birlikte büyür.
  - Sitenin üst menüsü ve alt bilgisi gizlenir.
- Sunum görünümü ekranı tamamen kaplar: `position: fixed; inset: 0; z-index: 20`. İki satırlı grid:
  üstte kayan sahne (`present__stage`), altta kontrol çubuğu (`present__bar`).
- **Slaytlar:** slayt 0 = kapak, sonra dersin her bölümü bir slayt. Toplam = bölüm sayısı + 1.
  - **Kapak slaytı:** ünite numarası, seviye · ders numarası, ders başlığı, alt başlık, "Focus" satırı ve
    "Today" başlıklı kazanım listesi (can-do).
  - **Bölüm slaytları:** dersin normal bölüm bileşeni aynen kullanılır (`<SectionView key={slide} …/>`). `key={slide}`
    sayesinde her slayta geçişte bileşen sıfırdan kurulur; alıştırmalar temiz başlar. Alıştırmalar sunumda da tıklanabilir.
- **Öğretmen notları sunumda hiç görünmez** (sadece normal ders sayfasında).
- Sahnedeki içerik ortalanır, en fazla 1000px genişlikte. Uzun bölümler sahne içinde aşağı kaydırılır.

## 2. Slayt değiştirme

`go(to)`:
1. Hedef slayt `0 … toplam-1` aralığına sıkıştırılır.
2. Çalan ses durdurulur (`audio.stop()`). Sitede her cümlenin sesi var; slayt değişince ses kesilmeli.
3. Slayt değişir.
4. Sahne en üste kaydırılır (`stage.scrollTo({ top: 0 })`).

Slayt değişince o slayttaki bütün çizimler silinir (bkz. 4. bölüm, `clearKey`).

## 3. Klavye kısayolları

Tek bir `window` `keydown` dinleyicisi var. Kurallar:

- **Odak bir `input`, `textarea` ya da `select` içindeyse hiçbir kısayol çalışmaz.** Böylece öğrenci boşluk
  doldururken ya da öğretmen yazı aracıyla yazarken harfler komut olarak algılanmaz.
- Sadece işlenen tuşlarda `preventDefault()` çağrılır, diğer tuşlar normal çalışır.

| Tuş | Ne yapar |
|---|---|
| → / PageDown | Sonraki slayt (sunum kumandaları PageDown gönderir) |
| ← / PageUp | Önceki slayt |
| P | Kırmızı kalem (açık/kapalı) |
| B | Mavi kalem (açık/kapalı) |
| H | Fosforlu kalem (açık/kapalı) |
| A | Yazı aracı (açık/kapalı) |
| E | Silgi (açık/kapalı) |
| C | Bu slayttaki bütün çizimleri sil |
| Ctrl+Z (Mac'te Cmd+Z) | Son çizgiyi ya da yazıyı geri al |
| T | 3 dakikalık geri sayımı başlat |
| Esc | Önce açık aracı kapatır. Araç kapalıysa sunumdan çıkar. Tam ekrandaysa tarayıcı Esc ile önce tam ekrandan çıkar; o basışta sunum kapanmaz. |

- Harf kısayolları Ctrl/Cmd/Alt basılıyken çalışmaz (tarayıcı kısayollarıyla çakışmasın). Ctrl+Z bu kuralın tek istisnası.
- **Aynı araca tekrar basmak aracı kapatır** (toggle).

## 4. Çizim katmanı (DrawingLayer)

### Yerleşim
- Sahnenin (`present__stage`, `position: relative; overflow-y: auto`) içine, içeriğin üstüne bir `<canvas>` konur:
  `position: absolute; top: 0; left: 0; z-index: 5`.
- Tuval **görünen alanı değil, kayan içeriğin tamamını** kaplar: genişlik = `host.scrollWidth`,
  yükseklik = `host.scrollHeight`. Bu yüzden çizimler içerikle birlikte kayar. Öğretmen bir kelimenin altını çizip
  aşağı kaydırırsa çizgi kelimenin altında kalır.
- `ResizeObserver` sahneyi ve sahnenin ilk çocuğunu izler. Boyut değişince tuval yeniden ölçülür ve çizimler yeniden çizilir.
- Retina/HiDPI ekranlar için tuvalin piksel boyutu `CSS boyutu × devicePixelRatio` olur, çizimde
  `setTransform(dpr, 0, 0, dpr, 0, 0)` kullanılır. Böylece çizgiler bulanık olmaz.
- **Araç seçili değilken tuval `pointer-events: none` olur.** Tıklamalar alttaki alıştırmalara, ses düğmelerine geçer.
  Araç seçilince `pointer-events: auto` olur ve imleç değişir: kalemde `crosshair`, silgide `cell`, yazıda `text`.
- `touch-action: none`: dokunmatik ekranda çizerken sayfa kaymaz.

### Çizimler vektör olarak saklanır
- Her çizgi `{ tool, points: [x, y][] }` olarak bir dizide (ref) tutulur. Ekrana basılmış piksel değil, nokta listesi
  saklanır. Bu sayede boyut değişince her şey yeniden çizilebilir ve geri alma kolaydır.
- Yazılar da aynı dizide: `{ tool: 'text', id, x, y, text, ink }`.
- `redraw()` tuvali temizler ve dizideki her şeyi sırayla çizer. Çizilmekte olan çizgi de en sonda çizilir.
- Fare/kalem/parmak için Pointer Events kullanılır: `pointerdown` yeni çizgi başlatır (`setPointerCapture` ile),
  `pointermove` nokta ekler ve yeniden çizer, `pointerup` çizgiyi diziye kaydeder, `pointercancel` iptal eder.
- **Yumuşak çizgi:** Noktalar düz çizgiyle değil, ardışık noktaların orta noktalarından geçen `quadraticCurveTo`
  eğrileriyle birleştirilir. Tek tıklama da küçük bir nokta bırakır.

### Araçlar
| Araç | Renk | Kalınlık | Özel ayar |
|---|---|---|---|
| Kırmızı kalem | `#cf3326` | 3.5px | yuvarlak uç ve köşe |
| Mavi kalem | `#2152c4` | 3.5px | yuvarlak uç ve köşe |
| Fosforlu kalem | `#ffd500`, saydamlık 0.4 | 24px | `globalCompositeOperation = 'multiply'`: alttaki yazı okunur kalır |
| Silgi | — | 34px | `globalCompositeOperation = 'destination-out'`: geçtiği yerdeki çizim ve yazıları siler |

### Temizleme ve geri alma
- `clearKey` prop'u = `"${slide}:${clearCounter}"`. Bu değer değişince (slayt değişti ya da C'ye basıldı) dizi
  boşaltılır ve tuval temizlenir.
- `undoKey` prop'u bir sayaç. Her artışta dizinin son elemanı silinir ve yeniden çizilir. Silgi izi de bir eleman
  olduğu için geri alınabilir.

### Yazı aracı
1. Araç seçiliyken tuvale tıklanınca tıklanan yere bir `<input>` açılır (`position: absolute`, tuvalle aynı kayan
   alanda). Kutunun dikey ortası tıklanan noktadır.
2. Kutu kesikli kenarlı ve yarı saydam zeminlidir. Yazının rengi, fontu ve boyutu tuvaldeki hâliyle aynıdır:
   `600 30px` kalınlık ve boyut, sitenin metin fontu. Arapça için `Noto Naskh Arabic` yedek font.
   Genişlik yazdıkça büyür.
3. **Enter** yazıyı tuvale geçirir. **Esc** iptal eder. Kutu odağı kaybedince de yazı tuvale geçer.
   Başka bir yere tıklamak mevcut yazıyı bitirip yeni bir kutu açar.
4. Her yazının bir kimliği (`id`) var. Bitirme işlemi aynı yazıyı iki kez eklemez. Bu önemli, çünkü tıklama hem
   "bitir" hem "blur" tetikleyebiliyor. Boş yazı eklenmez. Slayt o arada değiştiyse yazı eklenmez.
5. Tuvalde yazının arkasına, sayfa arka plan renginde %85 opak bir dikdörtgen çizilir. Böylece yazı alttaki metinle
   karışmaz. Renk CSS değişkeninden okunur (`--bg`), gece modunda da doğru çalışır.
6. Arapça harfle başlayan yazı sağdan sola çizilir (`ctx.direction = 'rtl'`). Yazarken input `dir="auto"` olduğu için
   görünüm aynı kalır.
7. **Yazının rengi = en son seçilen kalemin rengi.** Önce P (kırmızı) ya da B (mavi) seçilir, sonra A. Varsayılan mavi.
   Çubuktaki yazı düğmesi de o renkte görünür.
8. Yazı kutusundayken tuvalde `mousedown` engellenir. Böylece tıklama odağı kutudan çalmaz.
9. Klavye kısayolları yazı kutusunda çalışmaz (3. bölüm). Enter ve Esc kutunun kendi tuşları; olay yukarı çıkmaz
   (`stopPropagation`).

## 5. Geri sayım (PresentTimer)

- Kapalıyken çubukta saat simgesi ve **1 / 3 / 5** dakika düğmeleri görünür. **T** tuşu 3 dakika başlatır.
- Sayaç durumu sunum bileşeninde tutulur: `end` = bitiş zamanı (ms) ya da `null`. Böylece hem düğmeler hem T tuşu başlatabilir.
- Çalışırken düğme hap şeklindedir ve `m:ss` gösterir. Her 250 ms'de güncellenir; ilk değer hemen gelir ki eski saat bir
  an bile görünmesin.
- Süre bitince:
  - "Time's up!" yazar.
  - Kırmızı zemin ve nabız gibi atan bir animasyon başlar.
  - Web Audio ile kısa bir bip çalar: 880 Hz, 0.8 saniyede sönen ses. Ses dosyası gerekmez.
- Sayaca tıklamak onu durdurur ve kapatır.

## 6. Kontrol çubuğu (altta)

Soldan sağa:
1. ← önceki (ilk slaytta pasif)
2. Yer bilgisi: **"3 / 15"** (kalın) ve altında o bölümün başlığı (kapakta "Start")
3. → sonraki (son slaytta pasif)
4. Boşluk (sağa yaslamak için `flex: 1`)
5. Araç grubu:
   - Kırmızı kalem, mavi kalem, fosforlu kalem, yazı, silgi. Her biri kendi renginde; seçili olanın zemini koyulaşır
     ve altında renkli bir çizgi çıkar (`box-shadow: inset 0 -3px 0 currentColor`). `aria-pressed` ile işaretlenir,
     ipucunda kısayolu yazar ("Red pen (P)").
   - Geri al
   - Temizle
6. Geri sayım
7. Tam ekran düğmesi: `document.documentElement.requestFullscreen()` ya da `exitFullscreen()`. Sunumdan çıkınca tam
   ekran da kapatılır.
8. **Exit**

Çubuk dar ekranda alt satıra kayar (`flex-wrap: wrap`).

## 7. Tasarım notları

- Düz CSS, tasarım değişkenleri (`--bg`, `--ink`, `--line`, `--pen`, `--bad` …). UI kütüphanesi yok.
- Kalem renkleri sitenin "ders kitabına kalemle yazılmış" görünümüne uyar: hata için kırmızı, anlam için mavi, sarı fosforlu.
- Kapak ve bölüm renkleri seviyeye göre değişir (`lv-a1` gibi bir sınıf `--lv` rengini verir).

## 8. Projeye özel parçalar (başka projede bunları değiştir)

| Folio'daki parça | Ne işe yarıyor | Başka projede |
|---|---|---|
| `Lesson` tipi, `lesson.sections` | Slayt listesi | Kendi slayt/bölüm dizin |
| `SectionView` | Bir bölümü çizer | Kendi slayt bileşenin |
| `sectionTitle(section)` | Çubukta bölüm adı | Slaytın başlığı |
| `sectionId(...)` | Bölüm kimliği (ilerleme kaydı için) | Gerekmiyorsa kaldır |
| `audio.stop()` | Slayt değişince sesi kes | Ses yoksa kaldır |
| `splitSubtitle`, `LevelCode`, `banner` sınıfları | Kapak slaytı | Kendi kapak slaytın |
| `Icon` bileşeni | SVG simgeler: arrowLeft, arrowRight, pencil, highlighter, text, eraser, undo, trash, slow (saat), close, expand | Kendi simge setin |
| `lv-${level}`, `--lv` | Seviye rengi | Kaldır ya da tema rengi |
| CSS değişkenleri (`--bg`, `--ink`, `--surface`, `--line`, `--pen`, `--bad`, `--font-ui`, `--font-num`, `--stroke`, `--radius` …) | Renk ve ölçüler | Kendi değişkenlerin |
| `html.is-presenting .topbar, .sitefoot { display:none }` | Site menüsünü gizle | Kendi menü sınıfların |

Çizim katmanı (`DrawingLayer.tsx`) ve geri sayım (`PresentTimer.tsx`) neredeyse bağımsız. `DrawingLayer` sadece React
kullanır. `PresentTimer` ise yalnızca `Icon` bileşenine bağlı.

---

# Kaynak kod

## PresentationView.tsx: sunum ekranı, slaytlar, klavye, çubuk

`src/features/presentation/PresentationView.tsx`

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lesson } from '../../content/schema'
import { LevelCode } from '../../components/ui/LevelCode'
import { audio } from '../../audio/AudioService'
import { sectionId } from '../../components/lesson/LessonContext'
import { SectionView } from '../../components/lesson/SectionView'
import { sectionTitle } from '../../components/lesson/SectionFrame'
import { Icon } from '../../components/ui/Icon'
import { splitSubtitle } from '../../lib/text'
import { DrawingLayer, type Ink, type Tool } from './DrawingLayer'
import { PresentTimer } from './PresentTimer'

const TOOLS: { tool: Tool; icon: 'pencil' | 'highlighter' | 'eraser' | 'text'; label: string; key: string }[] = [
  { tool: 'red', icon: 'pencil', label: 'Red pen', key: 'P' },
  { tool: 'blue', icon: 'pencil', label: 'Blue pen', key: 'B' },
  { tool: 'marker', icon: 'highlighter', label: 'Highlighter', key: 'H' },
  { tool: 'text', icon: 'text', label: 'Text (in the last pen colour)', key: 'A' },
  { tool: 'eraser', icon: 'eraser', label: 'Eraser', key: 'E' },
]

/**
 * Sunum modu (Zoom/Teams ekran paylaşımı için): büyük yazı, menüler gizli,
 * her seferinde tek bölüm. Ok tuşları / PageUp-PageDown ile ilerler, Esc ile çıkar.
 * Öğretmen notları burada hiç görünmez.
 */
export function PresentationView({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const [slide, setSlide] = useState(0)
  const [tool, setTool] = useState<Tool | null>(null)
  // Yazının rengi: en son seçilen kalem
  const [ink, setInk] = useState<Ink>('blue')
  const [cleared, setCleared] = useState(0)
  const [undo, setUndo] = useState(0)
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const total = lesson.sections.length + 1

  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(total - 1, to))
      audio.stop()
      setSlide(next)
      stage.current?.scrollTo({ top: 0 })
    },
    [total],
  )

  // Aynı araca tekrar basınca kapanır; kalem seçilince yazı rengi de o olur
  const pickTool = useCallback((t: Tool) => {
    if (t === 'red' || t === 'blue') setInk(t)
    setTool((cur) => (cur === t ? null : t))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('is-presenting')
    return () => {
      root.classList.remove('is-presenting')
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') setUndo((n) => n + 1)
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') go(slide + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(slide - 1)
      else if (e.key === 'Escape' && tool) setTool(null)
      else if (e.key === 'Escape' && !document.fullscreenElement) onExit()
      else if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[pbheact]$/i.test(e.key)) {
        const k = e.key.toLowerCase()
        if (k === 'c') setCleared((n) => n + 1)
        else if (k === 't') setTimerEnd(Date.now() + 3 * 60000)
        else {
          pickTool(TOOLS.find((x) => x.key.toLowerCase() === k)!.tool)
        }
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide, go, onExit, tool, pickTool])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const section = slide > 0 ? lesson.sections[slide - 1] : null
  const { story, focus } = splitSubtitle(lesson.subtitle)

  return (
    <div className={`present lv-${lesson.level}`}>
      <div className="present__stage" ref={stage}>
        <div className="present__content">
          {section ? (
            <SectionView key={slide} section={section} id={sectionId(section, slide - 1)} index={slide - 1} />
          ) : (
            <div className="present__title">
              <div className="banner">
                <div className="banner__unit" aria-hidden="true">
                  <small>Unit</small>
                  {lesson.unit}
                </div>
                <div className="banner__text">
                  <p className="banner__crumb">
                    <LevelCode level={lesson.level} /> · Lesson {lesson.order}
                  </p>
                  <h1 className="lesson__title">{lesson.title}</h1>
                  {story && <p className="lesson__subtitle">{story}</p>}
                </div>
              </div>
              {focus && (
                <p className="lesson__focus">
                  <span className="lesson__cando-label">Focus</span> {focus}
                </p>
              )}
              <div className="present__cando">
                <span className="lesson__cando-label">Today</span>
                <ul>
                  {lesson.canDo.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DrawingLayer tool={tool} ink={ink} clearKey={`${slide}:${cleared}`} undoKey={undo} />
      </div>

      <nav className="present__bar" aria-label="Presentation controls">
        <button
          type="button"
          className="iconbtn"
          onClick={() => go(slide - 1)}
          disabled={slide === 0}
          aria-label="Previous"
        >
          <Icon name="arrowLeft" />
        </button>
        <span className="present__where">
          <strong>
            {slide + 1} / {total}
          </strong>
          <span>{section ? sectionTitle(section) : 'Start'}</span>
        </span>
        <button
          type="button"
          className="iconbtn"
          onClick={() => go(slide + 1)}
          disabled={slide === total - 1}
          aria-label="Next"
        >
          <Icon name="arrowRight" />
        </button>
        <span className="present__spacer" />
        <span className="present__tools" role="group" aria-label="Drawing tools">
          {TOOLS.map((t) => (
            <button
              key={t.tool}
              type="button"
              className={`iconbtn ptool ptool--${t.tool === 'text' ? ink : t.tool} ${tool === t.tool ? 'is-on' : ''}`}
              onClick={() => pickTool(t.tool)}
              aria-pressed={tool === t.tool}
              aria-label={t.label}
              title={`${t.label} (${t.key})`}
            >
              <Icon name={t.icon} />
            </button>
          ))}
          <button type="button" className="iconbtn" onClick={() => setUndo((n) => n + 1)} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Icon name="undo" />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setCleared((n) => n + 1)}
            aria-label="Clear drawing"
            title="Clear drawing (C)"
          >
            <Icon name="trash" />
          </button>
        </span>
        <PresentTimer end={timerEnd} setEnd={setTimerEnd} />
        <button
          type="button"
          className="iconbtn"
          onClick={toggleFullscreen}
          aria-label="Full screen"
          title="Full screen"
        >
          <Icon name="expand" />
        </button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          <Icon name="close" size={16} /> Exit
        </button>
      </nav>
    </div>
  )
}
```

## DrawingLayer.tsx: kalem, fosforlu kalem, silgi, yazı, geri al

Sadece React’e bağlı; doğrudan kopyalanabilir.

`src/features/presentation/DrawingLayer.tsx`

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'

/** Sunumda slaytın üstüne çizim: kalem, fosforlu kalem, silgi ve yazı. Çizimler içerikle birlikte kayar. */

export type Tool = 'red' | 'blue' | 'marker' | 'eraser' | 'text'
export type Ink = 'red' | 'blue'

type Stroke = { tool: Exclude<Tool, 'text'>; points: [number, number][] }
type TextMark = { tool: 'text'; id: number; x: number; y: number; text: string; ink: Ink }
type Mark = Stroke | TextMark
type Editing = { id: number; x: number; y: number; ink: Ink; slide: string }

const INK: Record<Ink, string> = { red: '#cf3326', blue: '#2152c4' }
const STYLE: Record<'red' | 'blue' | 'marker', { width: number; color: string; alpha: number }> = {
  red: { width: 3.5, color: INK.red, alpha: 1 },
  blue: { width: 3.5, color: INK.blue, alpha: 1 },
  marker: { width: 24, color: '#ffd500', alpha: 0.4 },
}

/** Yazı: tuvalde ve yazarken açılan kutuda aynı ölçüler. (x, y) = ilk harfin solu, satırın ortası */
const TEXT_SIZE = 30
const PAD = 6
const BORDER = 2
const BOX_H = Math.round(TEXT_SIZE * 1.35) + 2 * BORDER
const TEXT_FONT = `600 ${TEXT_SIZE}px "Atkinson Hyperlegible Next", "Noto Naskh Arabic", system-ui, sans-serif`

function drawMark(ctx: CanvasRenderingContext2D, s: Mark, paper: string) {
  ctx.save()
  if (s.tool === 'text') {
    ctx.font = TEXT_FONT
    ctx.textBaseline = 'middle'
    // Arapçayla başlayan yazı sağdan sola (yazarkenki kutuyla aynı görünsün)
    ctx.direction = /^[^\p{L}]*[؀-ۿ]/u.test(s.text) ? 'rtl' : 'ltr'
    ctx.textAlign = 'left'
    // Altındaki baskıyla karışmasın: yarı saydam kâğıt zemin
    const w = ctx.measureText(s.text).width
    ctx.fillStyle = paper
    ctx.globalAlpha = 0.85
    ctx.fillRect(s.x - 4, s.y - BOX_H / 2 + BORDER, w + 8, BOX_H - 2 * BORDER)
    ctx.globalAlpha = 1
    ctx.fillStyle = INK[s.ink]
    ctx.fillText(s.text, s.x, s.y)
  } else if (s.points.length) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (s.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 34
      ctx.strokeStyle = '#000'
    } else {
      const st = STYLE[s.tool]
      ctx.globalAlpha = st.alpha
      ctx.lineWidth = st.width
      ctx.strokeStyle = st.color
      if (s.tool === 'marker') ctx.globalCompositeOperation = 'multiply'
    }
    ctx.beginPath()
    const [x0, y0] = s.points[0]
    ctx.moveTo(x0, y0)
    if (s.points.length === 1) ctx.lineTo(x0 + 0.1, y0)
    // Yumuşak çizgi: noktalar arasının ortasından eğri
    for (let i = 1; i < s.points.length - 1; i++) {
      const [x, y] = s.points[i]
      const [nx, ny] = s.points[i + 1]
      ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2)
    }
    if (s.points.length > 1) ctx.lineTo(...s.points[s.points.length - 1])
    ctx.stroke()
  }
  ctx.restore()
}

export function DrawingLayer({ tool, ink, clearKey, undoKey }: { tool: Tool | null; ink: Ink; clearKey: string; undoKey: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const marks = useRef<Mark[]>([])
  const drawing = useRef<Stroke | null>(null)
  const nextId = useRef(1)
  // Yazılmakta olan yazı tuvale değil, üstündeki kutuya yazılır; bitince tuvale geçer
  const [editing, setEditing] = useState<Editing | null>(null)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const redraw = useCallback(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const paper = getComputedStyle(c).getPropertyValue('--bg').trim() || '#fff'
    for (const s of marks.current) drawMark(ctx, s, paper)
    if (drawing.current) drawMark(ctx, drawing.current, paper)
  }, [])

  // Tuval, kayan içeriğin tamamını kaplar; içerik boyutu değişince yeniden ölçülür
  useEffect(() => {
    const c = canvas.current
    const host = c?.parentElement
    if (!c || !host) return
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = host.scrollWidth
      const h = host.scrollHeight
      c.style.width = `${w}px`
      c.style.height = `${h}px`
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      redraw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    if (host.firstElementChild) ro.observe(host.firstElementChild)
    return () => ro.disconnect()
  }, [redraw, clearKey])

  // Slayt değişince ya da "temizle" deyince çizimler silinir
  useEffect(() => {
    marks.current = []
    drawing.current = null
    redraw()
  }, [clearKey, redraw])

  // Geri al (Ctrl+Z): son çizgi ya da yazı gider
  useEffect(() => {
    if (undoKey === 0) return
    marks.current.pop()
    redraw()
  }, [undoKey, redraw])

  useEffect(() => {
    if (editing) input.current?.focus()
  }, [editing])

  const point = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  // Yazıyı tuvale geçir (bir kez; boşsa hiçbir şey)
  const finish = (ed: Editing, text: string) => {
    const done = marks.current.some((m) => m.tool === 'text' && m.id === ed.id)
    if (!done && text.trim() && ed.slide === clearKey) {
      marks.current.push({ tool: 'text', id: ed.id, x: ed.x, y: ed.y, text, ink: ed.ink })
      redraw()
    }
    setEditing((cur) => (cur?.id === ed.id ? null : cur))
  }

  const open = editing && editing.slide === clearKey ? editing : null

  return (
    <>
      <canvas
        ref={canvas}
        className={`drawlayer ${tool ? `is-on drawlayer--${tool}` : ''}`}
        onMouseDown={(e) => tool === 'text' && e.preventDefault()}
        onPointerDown={(e) => {
          if (!tool) return
          if (tool === 'text') {
            e.preventDefault()
            if (open) finish(open, draft)
            const [x, y] = point(e)
            setDraft('')
            setEditing({ id: nextId.current++, x, y, ink, slide: clearKey })
            return
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          drawing.current = { tool, points: [point(e)] }
          redraw()
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          drawing.current.points.push(point(e))
          redraw()
        }}
        onPointerUp={() => {
          if (drawing.current) marks.current.push(drawing.current)
          drawing.current = null
        }}
        onPointerCancel={() => {
          drawing.current = null
          redraw()
        }}
        aria-hidden="true"
      />
      {open && (
        <input
          key={open.id}
          ref={input}
          className="drawtext"
          style={{
            left: open.x - PAD - BORDER,
            top: open.y - BOX_H / 2,
            height: BOX_H,
            width: `calc(${Math.max(3, draft.length + 1)}ch + ${2 * (PAD + BORDER)}px)`,
            padding: `0 ${PAD}px`,
            borderWidth: BORDER,
            color: INK[open.ink],
            font: TEXT_FONT,
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finish(open, draft)
            else if (e.key === 'Escape') finish(open, '')
            else return
            e.preventDefault()
            e.stopPropagation()
          }}
          onBlur={() => finish(open, draft)}
          dir="auto"
          autoComplete="off"
          spellCheck={false}
          aria-label="Text on the slide"
        />
      )}
    </>
  )
}
```

## PresentTimer.tsx: geri sayım

Sadece `Icon` bileşenine bağlı.

`src/features/presentation/PresentTimer.tsx`

```tsx
import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'

/** Sunumda geri sayım (1 / 3 / 5 dakika). Süre bitince kısa bir ses çıkar. */

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // ses çıkmazsa sorun değil
  }
}

/** end: sürenin biteceği an (ms) ya da null (sayaç kapalı). Sunum ekranı tutar ki T tuşu da başlatabilsin. */
export function PresentTimer({ end, setEnd }: { end: number | null; setEnd: (end: number | null) => void }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (end == null) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= end) {
        clearInterval(id)
        beep()
      }
    }
    // İlk değer hemen gelsin (yoksa eski saat bir an görünür)
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 250)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [end])

  if (end == null)
    return (
      <span className="ptimer" role="group" aria-label="Timer">
        <Icon name="slow" size={18} />
        {[1, 3, 5].map((m) => (
          <button key={m} type="button" className="ptimer__opt" onClick={() => setEnd(Date.now() + m * 60000)} title={`${m} minute timer`}>
            {m}
          </button>
        ))}
      </span>
    )

  const left = Math.max(0, Math.ceil((end - now) / 1000))
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <button type="button" className={`ptimer ptimer--run ${left === 0 ? 'is-over' : ''}`} onClick={() => setEnd(null)} title="Stop the timer">
      <Icon name="slow" size={18} />
      <span className="ptimer__time">{left === 0 ? "Time's up!" : `${mm}:${ss}`}</span>
      <Icon name="close" size={14} />
    </button>
  )
}
```

## present.css: sunum stilleri

`--bg`, `--ink`, `--line` gibi değişkenleri kendi projenin renkleriyle değiştir.

`src/styles/present.css`

```css
/* ---------- Sunum modu (ekran paylaşımı) ---------- */

html.is-presenting {
  font-size: 118%;
}
@media (min-width: 1400px) {
  html.is-presenting {
    font-size: 132%;
  }
}
html.is-presenting .topbar,
html.is-presenting .sitefoot {
  display: none;
}

.present {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-rows: 1fr auto;
  background: var(--bg);
}
.present__stage {
  position: relative;
  overflow-y: auto;
  padding: clamp(24px, 5vh, 56px) clamp(16px, 6vw, 96px) 48px;
}
.present__content > .sec,
.present__title {
  max-width: 1000px;
  margin: 0 auto;
}
.present__title {
  display: grid;
  gap: 16px;
  align-content: center;
  min-height: 70vh;
}
.present__title .lesson__title {
  font-size: clamp(3rem, 8vw, 6rem);
}
.present__cando {
  margin-top: 24px;
  font-size: 1.3rem;
}
.present__cando ul {
  display: grid;
  gap: 8px;
}

.present .reading__paraplay {
  position: static;
  float: left;
  margin: 0.4rem 12px 0 0;
}

.present__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px clamp(12px, 3vw, 28px);
  border-top: var(--stroke) solid var(--line-strong);
  background: var(--bg);
  font-family: var(--font-ui);
}
.present__where {
  display: grid;
  line-height: 1.2;
  min-width: 9em;
  text-align: center;
}
.present__where strong {
  font-family: var(--font-num);
}
.present__where span {
  font-size: 0.8rem;
  color: var(--ink-3);
}
.present__spacer {
  flex: 1;
}

/* Çizim katmanı: araç seçili değilken tıklamalar alttaki alıştırmalara geçer */
.drawlayer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
  touch-action: none;
}
.drawlayer.is-on {
  pointer-events: auto;
  cursor: crosshair;
}
.drawlayer--eraser.is-on {
  cursor: cell;
}

.present__bar {
  flex-wrap: wrap;
}
.present__tools {
  display: inline-flex;
  gap: 2px;
  padding-right: 8px;
  margin-right: 4px;
  border-right: 1px solid var(--line);
}
.ptool--red {
  color: var(--bad);
}
.ptool--blue {
  color: var(--pen);
}
.ptool--marker {
  color: #b58f00;
}
.ptool.is-on {
  background: var(--surface-2);
  box-shadow: inset 0 -3px 0 currentColor;
}

/* Geri sayım */
.ptimer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-2);
}
.ptimer__opt {
  min-width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  font-weight: 700;
}
.ptimer__opt:hover {
  border-color: var(--ink-3);
}
.ptimer--run {
  padding: 5px 10px;
  border: var(--stroke) solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font-weight: 700;
}
.ptimer__time {
  font-family: var(--font-num);
  font-size: 1.1rem;
  min-width: 3.2em;
  text-align: center;
}
.ptimer--run.is-over {
  background: var(--bad);
  border-color: var(--bad);
  color: #fff;
  animation: pulse 1s ease-in-out infinite;
}

/* Sunumda yazı: tıklanan yere açılan kutu; Enter ile tuvale geçer */
.drawlayer--text.is-on {
  cursor: text;
}
.drawtext {
  position: absolute;
  z-index: 6;
  min-width: 0;
  border-style: dashed;
  border-color: currentColor;
  border-radius: 2px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  outline: none;
  line-height: 1;
}
```

## Ders sayfasına bağlama (özet)

Ders sayfasında sadece bir state ve bir düğme var:

```tsx
const [presenting, setPresenting] = useState(false)

// render:
{presenting ? (
  <PresentationView lesson={lesson} onExit={() => setPresenting(false)} />
) : (
  <>
    {/* … normal ders sayfası … */}
    <button type="button" className="btn btn--primary" onClick={() => setPresenting(true)}>
      <Icon name="screen" size={18} /> Present
    </button>
  </>
)}
```

## Kullanılan simgeler (24×24 viewBox, stroke çizimi)

```ts
  arrowRight: 'M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5',
  arrowLeft: 'M19.5 12h-14M11 6.5L5.5 12l5.5 5.5',
  screen: 'M3.5 5h17v11h-17zM8.5 20h7M12 16v4',
  pencil: 'M15.5 4.5l4 4L8.5 19.5H4.5v-4zM13 7l4 4',
  close: 'M6 6l12 12M18 6L6 18',
  slow: 'M12 6.5v5.5l3.5 2M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z',
  expand: 'M4 9.5V4h5.5M20 9.5V4h-5.5M4 14.5V20h5.5M20 14.5V20h-5.5',
  highlighter: 'M8.5 14.5l7-7 3 3-7 7zM8.5 14.5l-3 5h5l1-2M13.5 9.5l3 3',
  eraser: 'M8.5 19.5h11M4.5 15l9-9 5 5-8.5 8.5H9zM9 10.5l5 5',
  trash: 'M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5',
  text: 'M5 6.5V4.5h14v2M12 4.5v15M9 19.5h6',
  undo: 'M9 5.5L4.5 10 9 14.5M4.5 10h10a5 5 0 0 1 0 10H11',
// Icon bileşeni: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={PATHS[name]} /></svg>
```
