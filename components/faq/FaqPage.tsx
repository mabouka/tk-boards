'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PortableText } from 'next-sanity'
import type { PortableTextComponents } from '@portabletext/react'
import type { PortableTextValue } from '@/sanity/lib/types'
import { youtubeId } from '@/lib/youtube'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './FaqPage.module.css'

/** A single Q&A — `answer` is Portable Text (paragraphs, images, YouTube). */
export type FaqQuestion = {
  question: string
  answer: PortableTextValue
}

export type FaqCategory = {
  id: string
  title: string
  questions: FaqQuestion[]
}

type Props = {
  title: string
  heroTitle: string | null
  categories: FaqCategory[]
}

/** Serializers for the answer rich text: inline images + YouTube embeds. */
const answerComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const v = value as { url?: string; alt?: string }
      return v.url ? (
        <figure className={styles.answerImage}>
          {/* URL is pre-resolved in GROQ, so a plain img keeps the client bundle lean. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.url} alt={v.alt ?? ''} loading="lazy" />
        </figure>
      ) : null
    },
    youtube: ({ value }) => {
      const id = youtubeId((value as { url?: string }).url)
      return id ? (
        <div className={styles.answerVideo}>
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null
    },
  },
}

export default function FaqPage({ title, heroTitle, categories }: Props) {
  const cats = useMemo(() => categories ?? [], [categories])
  const [activeId, setActiveId] = useState<string>(cats[0]?.id ?? '')
  // Open accordion row, keyed `${catId}::${index}`.
  const [openKey, setOpenKey] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Highlight the sidebar entry for whichever category is currently in view.
  useEffect(() => {
    const sections = cats
      .map((c) => sectionRefs.current[c.id])
      .filter((el): el is HTMLElement => el != null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const id = top?.target instanceof HTMLElement ? top.target.dataset.catId : undefined
        if (id) setActiveId(id)
      },
      { rootMargin: '-148px 0px -60% 0px', threshold: 0 }
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [cats])

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1
          className={styles.heroTitle}
          {...haloProps({ rgb: '225, 255, 255', opacity: 0.29, w: '75vw', h: '76vh', spread: '1%', anchor: 'bottom-left' })}
        >
          {heroTitle || title}
        </h1>
      </header>

      {cats.length > 0 && (
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav className={styles.sidebarList}>
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.sidebarItem}${c.id === activeId ? ` ${styles.sidebarItemActive}` : ''}`}
                  onClick={() => scrollTo(c.id)}
                >
                  {c.title}
                </button>
              ))}
            </nav>
          </aside>

          <div className={styles.content}>
            {cats.map((c) => (
              <section
                key={c.id}
                data-cat-id={c.id}
                ref={(el) => {
                  sectionRefs.current[c.id] = el
                }}
                className={styles.group}
              >
                <h2 className={styles.groupTitle}>{c.title}</h2>
                <ul
                  className={styles.accordion}
                  {...haloProps({ rgb: '225, 255, 255', opacity: 0.12, w: '87vw', h: '70vh', spread: '1%' })}
                >
                  {c.questions.map((q, index) => {
                    const key = `${c.id}::${index}`
                    const isOpen = key === openKey
                    return (
                      <li key={key} className={styles.row}>
                        <h3 className={styles.rowHeading}>
                          <button
                            type="button"
                            className={styles.question}
                            aria-expanded={isOpen}
                            onClick={() => setOpenKey(isOpen ? null : key)}
                          >
                            <span className={styles.questionText}>{q.question}</span>
                            <span
                              className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                              aria-hidden="true"
                            >
                              <span className={styles.iconBar} />
                              <span className={`${styles.iconBar} ${styles.iconBarVertical}`} />
                            </span>
                          </button>
                        </h3>

                        <div
                          className={`${styles.answer} ${isOpen ? styles.answerOpen : ''}`}
                          aria-hidden={!isOpen}
                        >
                          <div className={styles.answerInner}>
                            <div className={styles.answerText}>
                              <PortableText value={q.answer} components={answerComponents} />
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
