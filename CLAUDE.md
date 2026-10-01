# Folio — project notes

CEFR English course site (Starter → C1) for Turkish and Arabic speakers. React 19 + Vite + TypeScript,
plain CSS with design tokens (no Tailwind/UI kits — the "not AI-looking" design is a hard requirement).
One design only (the owner rejected theme switching): a printed coursebook someone writes in. Level colours
= book covers (`--lv`, `--lv-ink`); black print; blue pen (`--pen`) for meanings/selection; red pen for errors;
yellow highlighter (`--marker`). Fonts: Zilla Slab (headings), Atkinson Hyperlegible Next (text, with a plain
"0" patched in from Public Sans), Noto Naskh Arabic. Avoid AI tells: no uppercase letter-spaced kickers, no em
dashes in UI copy, no marketing hero/feature grids, no soft card shadows.
Plan: C:\Users\furka\.claude\plans\ben-ingilizce-retmenli-i-lisans-tingly-pearl.md

## Commands
- `npm run dev` · `npm run build` (tsc -b + vite build) · `npm run lint`
- `npm run validate` — must pass with no errors after any content change
- `npm run audio -- --dry` — audio generation with Kokoro (free, local; engine + `KOKORO_DTYPE` in `src/audio/engine.ts`,
  currently fp32, chosen by the owner by ear). Voice ids in file keys are `kokoro-fp32:<voice>`. Run 3 shards in
  parallel (`--shard k/3`, split by file key) for ~2,700 files in ~30 min; resumable; `--prune` removes orphans.
  GPU (DirectML) does not work with Kokoro here. Kokoro + lamejs are optionalDependencies.
- Voice lab (dev only): `npx tsx scripts/voice-samples.ts` then `/voice-lab` to compare voices per character.
- Deploy: push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages under `/<repo>/`
  (`BASE_PATH`; router basename and audio URLs use `import.meta.env.BASE_URL`). Firebase Hosting is a fallback.

## Conventions
- Lesson content lives in `content/lessons/<level>/<id>.json`, file name = lesson id, validated by
  `src/content/schema.ts` (zod). Adding a section/exercise type means: schema → `SectionView.tsx`
  → component → CSS → `speakables.ts` (if it plays audio) → `validate-content.ts`.
- Everything the UI plays must go through `src/content/speakables.ts` rules so generated mp3 keys
  (`audioKey(azureVoice, text)`) match; `AudioService` falls back to speechSynthesis.
- Learner-facing UI text is English; Turkish/Arabic only via `Support` fields ({tr, ar}), rendered by
  `SupportText` (Arabic is RTL; Latin runs wrapped by `BidiText`).
- Code comments are in Turkish (the owner is Turkish); keep them short.
- `validate` regenerates `content/glossary/vocab.generated.json` from every lesson's vocabulary; hand-written
  glossary files override it. Every word in readings/dialogues should have a TR+AR gloss (validate lists gaps).
- Character facts (families, schedules, pets) live in `content/spec/characters.md`; keep new lessons consistent.
- Progress is localStorage-only (`src/state/progress.ts`) until Phase 2 (Firebase Auth + Firestore). Non-lesson
  records use prefixed ids (`test:a1-u3`, `story:<id>`); ids containing ":" never become the "Continue" lesson.
- Other localStorage state: `src/state/words.ts` (word book, Leitner boxes), `placement` result, `settings`
  (`voiceMode`: recorded mp3 vs Edge "Natural" voices live).
- Extra content besides lessons, all validated by `npm run validate` and voiced by `npm run audio`:
  `content/stories/<level>/<id>.json` (library; a Story is a mini lesson, rendered via `storyToLesson`),
  `content/sounds.json` (minimal pairs), `content/placement.json` (level test).
- Routes: /words, /words/mine, /grammar/:level?, /sounds, /library(/:id), /test/:level/:unit, /placement,
  /lesson/:id/print. Unit tests are built from the unit's own exercises (`src/features/tests/buildUnitTest.ts`).
- Class-name collision to avoid: `.dict*` belongs to the dictation exercise; the dictionary page uses `.lex*`.

## Gotchas
- The folder name contains "İ"; Node's win32 `path.relative` lowercases it to two chars, so ESLint
  can't match files here. Lint through an ASCII junction/copy of the folder. Vite, tsc and tsx are fine.
- Vite's watcher sometimes misses rapid back-to-back edits (e.g. two `sed`s); `touch` the file if the
  dev server serves stale code.
