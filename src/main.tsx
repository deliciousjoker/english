import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import '@fontsource-variable/fraunces'
import '@fontsource-variable/literata'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-serif/400.css'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource-variable/noto-naskh-arabic'

import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/lesson.css'
import './styles/exercises.css'
import './styles/present.css'
import './styles/themes.css'

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
