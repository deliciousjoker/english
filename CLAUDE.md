# Folio — project notes

CEFR English course site (Starter → C1) for Turkish and Arabic speakers. React 19 + Vite + TypeScript,
plain CSS with design tokens (no Tailwind/UI kits — the "not AI-looking" design is a hard requirement).
Plan: C:\Users\furka\.claude\plans\ben-ingilizce-retmenli-i-lisans-tingly-pearl.md

## Commands
- `npm run dev` · `npm run build` (tsc -b + vite build) · `npm run lint`
- `npm run validate` — must pass with no errors after any content change
- `npm run audio -- --dry` — audio generation with Kokoro (free, local; engine switch in `src/audio/engine.ts`).
  ~27 files/min on this PC; resumable; `--prune` removes orphans. Kokoro + lamejs are optionalDependencies.
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
- Progress is localStorage-only (`src/state/progress.ts`) until Phase 2 (Firebase Auth + Firestore).

## Gotchas
- The folder name contains "İ"; Node's win32 `path.relative` lowercases it to two chars, so ESLint
  can't match files here. Lint through an ASCII junction/copy of the folder. Vite, tsc and tsx are fine.
- Vite's watcher sometimes misses rapid back-to-back edits (e.g. two `sed`s); `touch` the file if the
  dev server serves stale code.
