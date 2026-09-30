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

import { SettingsProvider } from './state/settings'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LevelPage } from './pages/LevelPage'
import { LessonPage } from './pages/LessonPage'
import { NotFoundPage } from './pages/NotFoundPage'
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
