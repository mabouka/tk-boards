import FilterableCardGrid from '../_shared/FilterableCardGrid'
import { haloProps } from '@/components/ui/halo/haloProps'

// Glow behind the page title.
const titleHalo = haloProps({ rgb: '225, 255, 255', opacity: 0.26, w: '67vw', h: '32vh', spread: '1%' })

type Category = { id: string; name: string | null; slug: string | null }
type Accessory = {
  _id: string
  title: string
  slug: string
  imageUrl: string | null
  categoryName: string | null
  categorySlug: string | null
}

type Props = {
  title: string
  allLabel: string
  showFilters?: boolean
  categories: Category[]
  accessories: Accessory[]
}

/** Accessories listing — adapts the data onto the shared <FilterableCardGrid>. */
export default function AccessoriesClient({
  title,
  allLabel,
  showFilters = true,
  categories,
  accessories,
}: Props) {
  return (
    <FilterableCardGrid
      title={title}
      titleHalo={titleHalo}
      allLabel={allLabel}
      showFilters={showFilters}
      filters={categories}
      items={accessories.map((a) => ({
        _id: a._id,
        name: a.title,
        href: `/accessories/${a.slug}`,
        imageUrl: a.imageUrl,
        tagLabel: a.categoryName,
        filterKey: a.categorySlug,
      }))}
    />
  )
}
