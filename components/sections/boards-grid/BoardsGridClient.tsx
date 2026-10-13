import FilterableCardGrid from '../_shared/FilterableCardGrid'
import { haloProps } from '@/components/ui/halo/haloProps'

// Glow behind the page title (matches the accessories listing).
const titleHalo = haloProps({ rgb: '225, 225, 255', opacity: 0.26, w: '67vw', h: '32vh', spread: '1%' })

type Series = { id: string; name: string | null; slug: string | null }
type Board = {
  _id: string
  name: string
  slug: string
  imageUrl: string | null
  seriesName: string | null
  seriesSlug: string | null
}

type Props = {
  title: string
  allLabel: string
  showFilters?: boolean
  series: Series[]
  boards: Board[]
}

/**
 * Boards listing — adapts the data onto the shared <FilterableCardGrid>: cards are
 * boards and the filter is by series ("Tout" + Carbon Series / Wood Series…).
 */
export default function BoardsGridClient({ title, allLabel, showFilters = true, series, boards }: Props) {
  return (
    <FilterableCardGrid
      title={title}
      titleHalo={titleHalo}
      allLabel={allLabel}
      showFilters={showFilters}
      filters={series}
      items={boards.map((b) => ({
        _id: b._id,
        name: b.name,
        href: `/boards/${b.slug}`,
        imageUrl: b.imageUrl,
        tagLabel: b.seriesName,
        filterKey: b.seriesSlug,
      }))}
    />
  )
}
