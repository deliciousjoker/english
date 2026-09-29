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
- **Öğretmen notları:** Adresin sonuna bir kez `?teacher=1` ekle (ör. `…/lesson/a1-u1-l1?teacher=1`).
  Her derste "Öğretmen notları" kutusu çıkar. Kapatmak için ayarlardan **Teacher view → Turn off**.
- **Tasarım seçimi:** Ayarlar (sağ üst) → **Design (preview)**: Notebook / Minimal / Warm.
  Birini seçtiğimizde diğerleri kaldırılacak.
- **Öğrenci ilerlemesi:** Şimdilik her öğrencinin kendi tarayıcısında tutulur. Giriş sistemi ve
  öğretmen paneli (Aşama 2) gelince senin ekranına düşecek. Yazma görevlerini öğrenciler şimdilik
  **Copy my text** ile kopyalayıp sana WhatsApp'tan gönderebilir.

## Yeni ders ekleme

1. `content/curriculum.json` içinde ders zaten listeli (henüz dosyası olmayanlar sitede "soon" görünür).
2. `content/spec/prompts/lesson-prompt.md` içindeki şablonla dersi AI'a ürettir.
3. Çıktıyı `content/lessons/<seviye>/<ders-id>.json` olarak kaydet.
4. `npm run validate` çalıştır; hataları düzelt, uyarıları gözden geçir.
   "Sözlükte anlamı olmayan kelimeler" varsa `content/glossary/a1.json`'a ekle.
5. Dersi sitede baştan sona dene (TR ve AR desteğiyle).
6. `npm run audio` ile sesleri üret, sonra yayınla.

İçerik kuralları: `content/spec/a1-spec.md`, karakterler: `content/spec/characters.md`.

## Ses (Kokoro — ücretsiz, bilgisayarda)

Sesler [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) ile üretilir: açık kaynaklı (Apache 2.0),
ücretsiz, hesap veya kart gerektirmeyen, bilgisayarda çalışan bir yapay zekâ ses modeli.

```bash
npm run audio -- --dry
npm run audio
```

- İlk çalıştırmada model (~90 MB) bir kez indirilir; sonrası internetsiz çalışır.
- Sadece eksik ya da metni değişmiş cümleler üretilir. Yarıda kesilirse tekrar çalıştır, kaldığı yerden devam eder.
- Karakterlerin sesleri `content/characters.json` içindeki `kokoroVoice` alanından değiştirilir.
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
src/styles/              Tasarım (tokens.css + themes.css: üç görünüm, açık/koyu)
```
