# Folio — İngilizce ders sitesi

Starter'dan C1'e, CEFR'e uygun; okuma, dinleme, kelime, gramer ve yazma odaklı ders materyali.
İçerik İngilizce; öğrenci isterse Türkçe veya Arapça destek açar (üstteki **Help: EN · TR · ع**).

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:5173 açılır.

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run validate` | Bütün dersleri kontrol eder (hatalar + seviye/sözlük uyarıları) |
| `npm run audio` | Eksik ses dosyalarını Kokoro ile bilgisayarda üretir (aşağıya bak) |
| `npm run build` | Yayın için `dist/` klasörünü hazırlar |
| `npm run deploy` | (Yedek yol) Kontrol + build + Firebase'e yükleme |

## Öğretmen için

- **Sunum modu:** Ders sayfasında **Present** düğmesi. Ok tuşları veya sunum kumandasıyla ilerlenir,
  **Esc** ile çıkılır. Menüler ve öğretmen notları gizlenir; Zoom/Teams'te bu pencereyi paylaş.
  Alttaki çubukta çizim araçları var: **P** kırmızı kalem, **B** mavi kalem, **H** fosforlu kalem, **A** yazı,
  **E** silgi, **C** temizle, **Ctrl+Z** geri al. **T** 3 dakikalık geri sayımı başlatır (1 / 3 / 5 düğmeleri de var).
  Yazı aracında ekrana tıkla, yaz, **Enter**'a bas; yazı son seçtiğin kalemin renginde olur (kırmızı ya da mavi).
  Kalem açıkken **Esc** önce kalemi kapatır. Çizimler slayt değişince silinir.
- **Edge'in doğal sesleri:** Edge'de ayarlarda **Voice: Recorded / Edge natural** çıkar. Derste Edge'den ekran
  paylaşırken "Edge natural" seçersen en doğal sesler duyulur; öğrencilerin telefonunda kayıtlı sesler çalar.
- **Çalışma kâğıdı:** Ders sayfasında **Print** düğmesi. Ders kâğıda uyarlanır (boşluklar, kutucuklar, yazma
  satırları), cevap anahtarı son sayfadadır. Anlamlar üstte seçili yardım diline (TR / ع) göre basılır; yardım
  kapalıysa kelime tablosunda öğrencinin yazacağı boş çizgiler çıkar.
- **Ünite testleri:** Seviye sayfasında her ünitenin altında **Unit N test**. Kelime, gramer, cümle kurma, dinleme,
  okuma ve dikte soruları o ünitenin derslerinden rastgele seçilir; **New test** her seferinde yeni sorular getirir.
- **Seviye belirleme sınavı:** `/placement` (ana sayfada "take the level test"). Starter → B1 arası sorular;
  bir seviyede 8'de 6'nın altında kalınca durur ve o seviyeyi önerir. Sorular `content/placement.json`.
- **Öğretmen notları:** Adresin sonuna bir kez `?teacher=1` ekle (ör. `…/lesson/a1-u1-l1?teacher=1`).
  Her derste "Öğretmen notları" kutusu çıkar. Kapatmak için ayarlardan **Teacher view → Turn off**.
- **Görünüm:** Ayarlar (sağ üst) → **Appearance**: Auto / Light / Dark. Tek tasarım var: "üzerine yazılmış
  ders kitabı" (her seviyenin kendi kapak rengi; anlamlar mavi kalem, hatalar kırmızı kalem, önemli kelimeler
  fosforlu kalem).
- **Öğrenciler için ek bölümler:**
  - **Words:** Bütün ders kelimeleri. İngilizce, Türkçe veya Arapça aranabilir.
  - **My words:** Kaydedilen kelimeler ve aralıklı tekrar kartları.
  - **Library:** Sesli kısa hikâyeler.
  - **Grammar:** Bütün gramer kutuları tek yerde.
  - **Sounds:** Karıştırılan ses çiftleri (th, w/v, p/b …); "Hangisini duydun?" oyunu ve ses kaydı.
  - Derslerde **Say it** (diyalog) ve **Read aloud** (okuma) ile öğrenci kendi sesini kaydedip modelle karşılaştırır.
    Kayıt sadece tarayıcıda kalır, hiçbir yere gönderilmez.
- **Öğrenci ilerlemesi:** Şimdilik her öğrencinin kendi tarayıcısında tutulur. Giriş sistemi ve
  öğretmen paneli (Aşama 2) gelince senin ekranına düşecek. Yazma görevlerini öğrenciler şimdilik
  **Copy my text** ile kopyalayıp sana WhatsApp'tan gönderebilir.

## Yeni ders ekleme

1. `content/curriculum.json` içinde ders zaten listeli (henüz dosyası olmayanlar sitede "soon" görünür).
2. `content/spec/prompts/lesson-prompt.md` içindeki şablonla dersi AI'a ürettir.
3. Çıktıyı `content/lessons/<seviye>/<ders-id>.json` olarak kaydet.
4. `npm run validate` çalıştır; hataları düzelt, uyarıları gözden geçir.
   "Sözlükte anlamı olmayan kelimeler" varsa seviyenin sözlüğüne ekle (`content/glossary/a1.json`, `a2.json` …).
5. Dersi sitede baştan sona dene (TR ve AR desteğiyle).
6. `npm run audio` ile sesleri üret, sonra yayınla.

**Çizimler:** `src/illustrations/pics.ts` içinde, elle yazılmış SVG (mürekkep çizgi + seviye renginde kaymış baskı rengi).
Kelime kartında kelimeyle aynı adlı çizim varsa kendiliğinden görünür; çoktan seçmeli soruya `"image": "tom-under"`
eklenirse soru resimli olur ("Where's Tom?" alıştırması gibi).

**Hikâye eklemek:** `content/stories/<seviye>/<id>.json` (dosya adı = id). Bir hikâye küçük bir ders gibidir:
kelimeler, okuma metni, sorular (ders bölümleriyle aynı biçim). Örnek: `content/stories/a1/biscuits-secret.json`.
Sonra `npm run validate` ve `npm run audio`.

İçerik kuralları: `content/spec/a1-spec.md`, `content/spec/a2-spec.md`; karakterler: `content/spec/characters.md`.

**Durum (3 Ekim 2026):** Starter (2 ders) ve A1 (8 ünite, 32 ders) tamam. A2: Ünite 1–3 (12 ders) hazır, Ünite 4–8
planlandı (`content/curriculum.json`, `content/spec/a2-spec.md`). Kütüphanede 6 hikâye (Starter 1, A1 3, A2 2).

## Ses (Kokoro — ücretsiz, bilgisayarda)

Sesler [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) ile üretilir: açık kaynaklı (Apache 2.0),
ücretsiz, hesap veya kart gerektirmeyen, bilgisayarda çalışan bir yapay zekâ ses modeli.

```bash
npm run audio -- --dry
npm run audio
```

- Model hassasiyeti `src/audio/engine.ts` içindeki `KOKORO_DTYPE` ile seçilir. Şu an **fp32** (daha doğal;
  Ekim 2026'da deneme sayfasında dinlenip seçildi). İlk çalıştırmada model (~330 MB) bir kez indirilir.
- Hızlandırmak için işi paralel işlemlere böl (ayrı pencerelerde): `npm run audio -- --shard 0/3`, `1/3`, `2/3`.
- **Ses deneme sayfası:** `npx tsx scripts/voice-samples.ts` → `npm run dev` → http://localhost:5173/voice-lab
  (her karakter için farklı sesleri yan yana dinleyip seçmek için; sitede yayınlanmaz).
- Sadece eksik ya da metni değişmiş cümleler üretilir. Yarıda kesilirse tekrar çalıştır, kaldığı yerden devam eder.
- Karakterlerin sesleri `content/characters.json` içindeki `kokoroVoice` alanından değiştirilir. Aynı diyalogda
  konuşan iki karaktere aynı sesi verme (Elif af_heart, Mrs. Miller af_sarah bu yüzden ayrı).
- Kullanılmayan eski dosyaları silmek için: `npm run audio -- --prune`.
- Hazır ses dosyası olmayan bir şey çalınırsa site tarayıcının sesini kullanır. En iyi yedek ses
  **Microsoft Edge**'de (Azure'un "Natural" sesleri), sonra Chrome'da (Google sesleri).

(İleride Azure hesabı olursa `src/audio/engine.ts` içinden motor `azure` yapılabilir; ayrıntılar `.env.example`'da.)

## Yayınlama (GitHub Pages — ücretsiz)

Site, GitHub'daki depoya her `git push` yapıldığında otomatik yayınlanır (`.github/workflows/deploy.yml`).

1. GitHub'da yeni bir **public** depo oluştur (README ekleme, boş olsun).
2. Bu klasörü depoya bağla ve gönder:
   ```bash
   git remote add origin https://github.com/KULLANICI-ADIN/DEPO-ADI.git
   git push -u origin main
   ```
3. GitHub'da depo → **Settings → Pages → Source: GitHub Actions**.
4. **Actions** sekmesinde yeşil tik çıkınca site hazır: `https://KULLANICI-ADIN.github.io/DEPO-ADI/`

Öğrencilere göndermeden önce VPN'siz bir Türk internet bağlantısından (telefondan) açıldığını kontrol et.

**Yedek yol — Firebase Hosting:** Firebase projesi aç, bir kere `npx firebase-tools login` ve
`npx firebase-tools use --add`, sonra `npm run deploy`. Adres: `https://<proje-adı>.web.app`.

## Proje yapısı

```
content/                 Dersler, müfredat, karakterler, sözlük, şartnameler
scripts/                 validate-content.ts, generate-audio.ts, kelime listeleri
public/audio/            Üretilen mp3'ler + manifest.json
src/content/schema.ts    Ders formatı (tüm bölüm ve alıştırma türleri)
src/components/          Okuma, diyalog, gramer, alıştırma bileşenleri
src/styles/              Tasarım (tokens.css: renkler, yazı tipleri, açık/koyu mod)
```
