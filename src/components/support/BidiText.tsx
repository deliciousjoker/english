import { Fragment } from 'react'

// Arapça metnin içindeki İngilizce parçalar (ör. "I am a student", "I'm") ayrı yalıtılır,
// yoksa sağdan sola akışta kelime sırası karışır.
const LATIN_RUN = /([A-Za-z][A-Za-z0-9'’ ,/-]*[A-Za-z0-9'’]|[A-Za-z])/g

export function BidiText({ text, lang }: { text: string; lang: string }) {
  if (lang !== 'ar') return <>{text}</>
  const parts = text.split(LATIN_RUN)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <bdi key={i} dir="ltr" lang="en" className="bidi-en">
            {p}
          </bdi>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
