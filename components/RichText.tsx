import { Fragment } from 'react'
import { parseRichText, truncateRichText, isExternalUrl } from '@/lib/links'

/**
 * Muestra texto plano del admin convirtiendo [texto](url) y las URLs sueltas en enlaces.
 * Respeta los saltos de línea. Con maxWords recorta sin romper enlaces y añade "…".
 */
export default function RichText({ text, maxWords }: { text: string; maxWords?: number }) {
  let segments = parseRichText(text ?? '')
  let truncated = false
  if (maxWords) ({ segments, truncated } = truncateRichText(segments, maxWords))

  return (
    <>
      {segments.map((s, i) => {
        if (s.type === 'link') {
          const external = isExternalUrl(s.href)
          return (
            <a
              key={i}
              href={s.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              style={{ color: '#4B766B', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {s.label}
            </a>
          )
        }
        const lines = s.value.split('\n')
        return (
          <Fragment key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </Fragment>
        )
      })}
      {truncated && '…'}
    </>
  )
}
