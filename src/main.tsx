import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

// Atkinson Hyperlegible: I, l ve 1 gibi harfleri kolay ayırt etmek için tasarlandı (dil öğrenenler için ideal)
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css'
import '@fontsource/zilla-slab/600.css'
import '@fontsource/zilla-slab/700.css'
import '@fontsource-variable/noto-naskh-arabic'

import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/lesson.css'
import './styles/exercises.css'
import './styles/present.css'
import './styles/print.css'

import { SettingsProvider } from './state/settings'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LevelPage } from './pages/LevelPage'
import { LessonPage } from './pages/LessonPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { VoiceLabPage } from './pages/VoiceLabPage'
import { GrammarPage } from './pages/GrammarPage'
import { WordsPage } from './pages/WordsPage'
import { MyWordsPage } from './pages/MyWordsPage'
import { PrintLessonPage } from './pages/PrintLessonPage'
import { SoundsPage } from './pages/SoundsPage'
import { UnitTestPage } from './pages/UnitTestPage'
import { PlacementPage } from './pages/PlacementPage'
import { LibraryPage, StoryPage } from './pages/LibraryPage'
import { audio } from './audio/AudioService'

// Ses listesini erkenden yükle (ilk tıklamada gecikme olmasın)
audio.loadManifest()

const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'level/:levelId', element: <LevelPage /> },
        { path: 'lesson/:lessonId', element: <LessonPage /> },
        { path: 'lesson/:lessonId/print', element: <PrintLessonPage /> },
        { path: 'words', element: <WordsPage /> },
        { path: 'words/mine', element: <MyWordsPage /> },
        { path: 'grammar/:level?', element: <GrammarPage /> },
        { path: 'sounds', element: <SoundsPage /> },
        { path: 'test/:level/:unit', element: <UnitTestPage /> },
        { path: 'placement', element: <PlacementPage /> },
        { path: 'library', element: <LibraryPage /> },
        { path: 'library/:storyId', element: <StoryPage /> },
        // Ses deneme sayfası sadece geliştirirken (npm run dev) açılır
        ...(import.meta.env.DEV ? [{ path: 'voice-lab', element: <VoiceLabPage /> }] : []),
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  // Site bir alt klasörde yayınlanıyorsa (GitHub Pages) yönlendirme oradan başlar
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>,
)
