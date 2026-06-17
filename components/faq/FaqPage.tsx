'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './FaqPage.module.css'

/** A single Q&A, with its image already resolved to a URL by the server. */
export type FaqItem = {
  question: string
  answer: string
  category: string | null
  imageUrl: string | null
  imageAlt: string | null
}

type Props = {
  title: string
  intro: string | null
  items: FaqItem[]
}

type CategoryGroup = {
  /** Slugified id used for the anchor + observer. */
  id: string
  /** Display name (the raw category, uppercased for the heading). */
  name: string
  items: FaqItem[]
}

const UNCATEGORIZED = 'General'

function slugifyCategory(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'category'
  )
}

/**
 * Groups the flat item list into categories in first-appearance order. Items
 * without a category fall into a single "General" bucket. Returns the grouped
 * sections plus a flat (group, item) index so the first item overall can be the
 * default-open accordion.
 */
function groupByCategory(items: FaqItem[]): CategoryGroup[] {
  const order: string[] = []
  const byName = new Map<string, FaqItem[]>()

  for (const item of items) {
    const name = item.category?.trim() || UNCATEGORIZED
    if (!byName.has(name)) {
      byName.set(name, [])
      order.push(name)
    }
    byName.get(name)!.push(item)
  }

  return order.map((name) => ({
    id: slugifyCategory(name),
    name,
    items: byName.get(name)!,
  }))
}

export default function FaqPage({ title, intro, items }: Props) {
  const groups = useMemo(() => groupByCategory(items ?? []), [items])

  // Open accordion: keyed by `${groupId}::${index}`. First item open by default.
  const firstKey = groups[0]?.items.length ? `${groups[0].id}::0` : null
  const [openKey, setOpenKey] = useState<string | null>(firstKey)

  // Active category for the sidebar highlight.
  const [activeId, setActiveId] = useState<string | null>(groups[0]?.id ?? null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Highlight the category whose section is closest to the top of the viewport.
  useEffect(() => {
    const nodes = Array.from(sectionRefs.current.values())
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Among the sections currently intersecting, pick the topmost.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          const id = visible[0].target.getAttribute('data-cat-id')
          if (id) setActiveId(id)
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [groups])

  const handleCategoryClick = (id: string) => {
    setActiveId(id)
    const node = sectionRefs.current.get(id)
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const registerSection = (id: string) => (node: HTMLElement | null) => {
    if (node) sectionRefs.current.set(id, node)
    else sectionRefs.current.delete(id)
  }

  if (!groups.length) {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>{title}</h1>
          {intro && <p className={styles.heroIntro}>{intro}</p>}
        </header>
      </main>
    )
  }

  const showSidebar = groups.length > 1 || groups[0]?.name !== UNCATEGORIZED

  return (
    <main
      className={styles.page}
      data-halo
      data-halo-rgb="139, 26, 26"
      data-halo-opacity="0.35"
      data-halo-w="60vw"
      data-halo-h="55vh"
      data-halo-spread="2%"
      data-halo-anchor="top-right"
    >
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>{title}</h1>
        {intro && <p className={styles.heroIntro}>{intro}</p>}
      </header>

      <div className={styles.layout}>
        {showSidebar && (
          <nav className={styles.sidebar} aria-label="FAQ categories">
            <ul className={styles.sidebarList}>
              {groups.map((group) => {
                const isActive = group.id === activeId
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => handleCategoryClick(group.id)}
                    >
                      {group.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        <div className={styles.content}>
          {groups.map((group) => (
            <section
              key={group.id}
              ref={registerSection(group.id)}
              data-cat-id={group.id}
              className={styles.group}
              aria-labelledby={`faq-cat-${group.id}`}
            >
              <h2 id={`faq-cat-${group.id}`} className={styles.groupTitle}>
                {group.name}
              </h2>

              <ul className={styles.accordion}>
                {group.items.map((item, index) => {
                  const key = `${group.id}::${index}`
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
                          <span className={styles.questionText}>{item.question}</span>
                          <span className={styles.icon} aria-hidden="true">
                            <span className={styles.iconBar} />
                            <span
                              className={`${styles.iconBar} ${styles.iconBarVertical} ${isOpen ? styles.iconBarHidden : ''}`}
                            />
                          </span>
                        </button>
                      </h3>

                      <div
                        className={`${styles.answer} ${isOpen ? styles.answerOpen : ''}`}
                        hidden={!isOpen}
                      >
                        <div className={styles.answerInner}>
                          <p className={styles.answerText}>{item.answer}</p>
                          {item.imageUrl && (
                            <div className={styles.answerImage}>
                              <Image
                                src={item.imageUrl}
                                alt={item.imageAlt ?? item.question}
                                width={960}
                                height={540}
                                sizes="(min-width: 1024px) 50vw, 100vw"
                              />
                            </div>
                          )}
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
    </main>
  )
}
