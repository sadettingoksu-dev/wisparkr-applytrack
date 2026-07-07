'use client'

import { Fragment, type ReactNode } from 'react'

/**
 * Hafif, bağımlılıksız ve GÜVENLİ markdown renderer (Claude-tarzı sohbet için).
 * dangerouslySetInnerHTML KULLANMAZ — her şey React node olarak üretilir.
 * Desteklenen: başlık (#..###), madde/numaralı liste, alıntı (>), kod bloğu (```),
 * yatay çizgi (---), satır içi **kalın** *italik* `kod` [bağlantı](url).
 */
export function Markdown({ content }: { content: string }) {
  return <div className="space-y-2 leading-relaxed">{renderBlocks(content)}</div>
}

function renderBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Kod bloğu
    if (line.trimStart().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // kapanış ```
      blocks.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100"
        >
          <code>{code.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Boş satır
    if (line.trim() === '') {
      i++
      continue
    }

    // Yatay çizgi
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="border-slate-200" />)
      i++
      continue
    }

    // Başlık
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const cls =
        level === 1
          ? 'text-base font-bold text-slate-900'
          : level === 2
            ? 'text-sm font-bold text-slate-900'
            : 'text-sm font-semibold text-slate-800'
      blocks.push(
        <p key={key++} className={cls}>
          {renderInline(heading[2])}
        </p>
      )
      i++
      continue
    }

    // Alıntı
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-2 border-purple-300 pl-3 text-slate-600"
        >
          {renderInline(quote.join(' '))}
        </blockquote>
      )
      continue
    }

    // Numaralı liste
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="list-decimal space-y-1 pl-5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Madde listesi
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-1 pl-5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Paragraf (ardışık normal satırları birleştir)
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i]) &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="text-slate-800">
        {renderInline(para.join(' '))}
      </p>
    )
  }

  return blocks
}

/** Satır içi biçimlendirme: **kalın**, *italik*, `kod`, [metin](url). */
function renderInline(text: string): ReactNode[] {
  // Token regex: kod > kalın > italik > link
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern).filter((p) => p !== '')
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-purple-700">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const href = link[2]
      // Güvenlik: yalnızca http(s) veya uygulama içi (/) bağlantılara izin ver.
      const safe = /^https?:\/\//.test(href) || href.startsWith('/')
      if (safe) {
        return (
          <a
            key={idx}
            href={href}
            target={href.startsWith('/') ? undefined : '_blank'}
            rel="noreferrer"
            className="text-purple-600 underline underline-offset-2 hover:text-purple-700"
          >
            {link[1]}
          </a>
        )
      }
      return <Fragment key={idx}>{link[1]}</Fragment>
    }
    return <Fragment key={idx}>{part}</Fragment>
  })
}
