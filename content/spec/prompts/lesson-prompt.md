# Ders ürettirme şablonu

Yeni bir dersi AI'a (ör. Claude) ürettirmek için aşağıdaki metni kopyala, köşeli parantezleri doldur
ve şu dosyaları da ekle:

- `content/spec/characters.md`
- `content/spec/a1-spec.md` (veya ilgili seviyenin şartnamesi)
- Örnek ders: `content/lessons/a1/a1-u1-l1.json`
- Önceki ders(ler)in JSON'u (hikâye devam etsin, kelimeler tekrar etsin diye)

Çıkan JSON'u `content/lessons/<seviye>/<id>.json` olarak kaydet, sonra:

```bash
npm run validate
```

Uyarıları gözden geçir (seviye üstü kelimeler, sözlükte olmayan kelimeler), eksik kelimeleri
`content/glossary/a1.json`'a ekle, dersi sitede baştan sona dene, en son `npm run audio` ile sesleri üret.

---

## Kopyalanacak metin

You are writing one lesson for an English course for adult beginners whose first language is
Turkish or Arabic. The course is CEFR-aligned and focuses on reading, listening, vocabulary,
grammar and writing. Speaking happens in live lessons with the teacher.

**Lesson to write**
- id: [a1-u2-l1]
- level: [a1], unit: [2], order: [1]
- title: [This is my family]
- grammar focus: [have got / has got; possessive 's]
- vocabulary topic: [family members]
- can-do statements: [I can talk about my family. …]
- story: [Omar shows Elif photos of his family. His sister Lina is a student in Amman.]

**Rules**
1. Output ONLY valid JSON that follows the schema of the example lesson exactly
   (same section types and field names). No comments, no Markdown.
2. Use only the attached characters. Keep their facts consistent with the character bible and the
   earlier lessons.
3. Language level: follow the level spec. Use words from earlier lessons and the level word list;
   new words must be in the vocabulary section. Keep sentences short and natural — real people
   talking, with specific details. Avoid generic, overly cheerful “textbook AI” lines.
4. American English spelling. No alcohol, dating or pork.
5. Sections in this order: warmup, vocabulary (8–12 items), dialogue and/or reading,
   a comprehension exercise, grammar (with look, table, rules, examples, support.tr, support.ar,
   watchOut.tr and watchOut.ar), 3–5 practice exercises of different kinds (gapfill, wordorder,
   matching, ordering, mcq with audio, truefalse), one dictation, one writing task, wrapup.
6. Every vocabulary item has gloss.tr and gloss.ar. At Starter and A1, every exercise, the vocabulary
   section and the writing task also have support.tr and support.ar (a translation of the instructions).
   From A2 on, leave out these instruction translations (learners know the instructions by then).
7. Grammar support: a short, clear explanation in Turkish and in Arabic that compares the
   structure with the learner's language. watchOut: typical mistakes of Turkish / Arabic speakers
   for this structure, with wrong and right example sentences (same number of each).
8. Gap-fill items mark gaps with braces; alternatives with a pipe: "She {has got|'s got} a brother."
   mcq answers are zero-based indexes.
9. teacherNotes: 3–4 short tips for the teacher, written in Turkish.
