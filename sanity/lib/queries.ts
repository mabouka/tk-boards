import { defineQuery } from 'next-sanity'

// Shared page-builder sections projection. Interpolated verbatim into every
// query that returns `sections[]` so adding a section field is a one-line edit
// instead of five. Sanity typegen statically resolves the interpolation
// (@sanity/codegen reconstructs the template literal before GROQ parsing), so
// the inferred section types stay identical to the inlined version.
//
// Resolved fields for a `link` object (CTA): text, new-tab flag, and the
// internal-link → URL mapping. Single source of truth, interpolated into every
// CTA projection below. NOTE: the navigation query has its own copy (different
// shape: `defined(internalLink)` / `externalUrl`) — keep the URL cases in sync.
const CTA_FIELDS = `"text": text,
    "openInNewTab": openInNewTab,
    "href": select(
      type == "internal" && internalLink->_type == "homePage" => "/",
      type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
      type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
      type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
      type == "internal" && internalLink->_type == "tkIdPage" => "/tk-id",
      type == "internal" => "/" + internalLink->slug.current,
      type == "external" => url,
      type == "email" => "mailto:" + email,
      type == "phone" => "tel:" + phone
    )`

const SECTIONS_PROJECTION = `sections[] {
      _type,
      _key,
      title,
      text,
      showFilters,
      filterBySeries,
      items,
      eyebrow,
      label,
      body,
      image,
      poster,
      gallery,
      mediaType,
      size,
      aspectRatio,
      media,
      videoUrl,
      videoPoster,
      videoWidth,
      videoHeight,
      controls,
      youtubeUrl,
      videoPosition,
      imagePosition,
      layout,
      theme,
      cardSide,
      quote,
      authorName,
      authorRole,
      intro,
      "milestones": milestones[]{ year, name, tag, svgPath },
      finalImage,
      finalLabelTitle,
      finalLabelSubtitle,
      columns,
      "rows": rows[]{ _key, cells },
      "cta": cta {
        ${CTA_FIELDS}
      },
      "ctas": ctas[] {
        _key,
        ${CTA_FIELDS}
      },
      "features": items[]{
        mediaType,
        image,
        videoUrl,
        videoPoster,
        title,
        text,
        "cta": cta {
          ${CTA_FIELDS}
        }
      },
      "fixedImages": items[]{
        _key,
        image,
        title,
        text,
        startColumn,
        verticalPosition,
        "cta": cta {
          ${CTA_FIELDS}
        }
      },
      "scrollImages": items[]{
        _key,
        image,
        "aspectRatio": image.asset->metadata.dimensions.aspectRatio,
        startColumn,
        widthColumns,
        offsetY,
        speed
      }
    }`

export const boardsQuery = defineQuery(`
  *[_type == "board" && language == $locale && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    name,
    slug,
    series->{ _id, "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value), slug, tagVariant },
    style,
    weight,
    mainImage
  }
`)

// Board main image by SKU (board.skuCode == the commerce product's parent SKU).
// Used by the TK-ID page to show the registered board's photo. Prefers the
// requested locale, falls back to any language (the image is shared).
export const boardImageBySkuQuery = defineQuery(`
  coalesce(
    *[_type == "board" && skuCode == $sku && language == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "board" && skuCode == $sku && !(_id in path("drafts.**"))][0]
  ) {
    "name": name,
    mainImage,
    "aspectRatio": mainImage.asset->metadata.dimensions.aspectRatio
  }
`)

export const boardBySlugQuery = defineQuery(`
  *[_type == "board" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    _id,
    name,
    slug,
    skuCode,
    series->{ _id, "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value), slug },
    heroTitle,
    heroTagline,
    heroImage,
    presentationTitle,
    presentationText,
    presentationNumbers[]{ value, unit, label },
    presentationTags[]{ text, style },
    gallery[]{
      asset,
      alt,
      hotspot,
      crop
    },
    mainImage,
    style,
    weight,
    price,
    currency,
    ${SECTIONS_PROJECTION},
    seoTitle,
    seoDescription,
    ogImage,
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`)

export const accessoryBySlugQuery = defineQuery(`
  *[_type == "accessory" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    _id,
    title,
    slug,
    skuCode,
    presentationTitle,
    text,
    presentationNumbers[]{ value, unit, label },
    presentationTags[]{ text, style },
    specifications[]{ name, value },
    gallery[]{
      asset,
      alt,
      hotspot,
      crop
    },
    mainImage,
    sizes,
    price,
    originalPrice,
    currency,
    seoTitle,
    seoDescription,
    ogImage,
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`)

export const seriesQuery = defineQuery(`
  *[_type == "series" && !(_id in path("drafts.**"))] | order(order asc, _createdAt asc) {
    _id,
    "name": coalesce(
      name[language == $locale][0].value,
      name[language == "en"][0].value,
      name[0].value
    ),
    "title": coalesce(
      title[language == $locale][0].value,
      title[language == "en"][0].value,
      title[0].value
    ),
    "description": coalesce(
      description[language == $locale][0].value,
      description[language == "en"][0].value,
      description[0].value
    ),
    slug,
    tagVariant,
    "boards": *[_type == "board" && !(_id in path("drafts.**")) && language == $locale && references(^._id)] | order(order asc) {
      _id,
      name,
      slug,
      style,
      mainImage
    }
  }[count(boards) > 0]
`)


// Flat shape (kept identical to the old single-document result) sourced from the
// three split singletons: seoSettings / contactSettings / footerSettings.
// SEO title + description are resolved per $locale (internationalized arrays).
export const siteSettingsQuery = defineQuery(`{
  "brandName": *[_type == "seoSettings"][0].brandName,
  "siteTitle": coalesce(
    *[_type == "seoSettings"][0].defaultTitle[language == $locale][0].value,
    *[_type == "seoSettings"][0].defaultTitle[language == "en"][0].value,
    *[_type == "seoSettings"][0].defaultTitle[0].value
  ),
  "seoDescription": coalesce(
    *[_type == "seoSettings"][0].defaultDescription[language == $locale][0].value,
    *[_type == "seoSettings"][0].defaultDescription[language == "en"][0].value,
    *[_type == "seoSettings"][0].defaultDescription[0].value
  ),
  "logo": *[_type == "seoSettings"][0].logo,
  "ogImage": *[_type == "seoSettings"][0].ogImage,
  "contact": *[_type == "contactSettings"][0]{ email, phone, whatsapp, address },
  "social": *[_type == "footerSettings"][0].social,
  "footer": *[_type == "footerSettings"][0]{ copyright, privacyPolicyUrl, cookiePolicyUrl }
}`)

export const authPageQuery = defineQuery(`
  *[_type == "authPage"][0]{
    "tagline": coalesce(tagline[language == $locale][0].value, tagline[language == "en"][0].value, tagline[0].value),
    "paragraph": coalesce(paragraph[language == $locale][0].value, paragraph[language == "en"][0].value, paragraph[0].value),
    "seoTitle": coalesce(seoTitle[language == $locale][0].value, seoTitle[language == "en"][0].value, seoTitle[0].value),
    "seoDescription": coalesce(seoDescription[language == $locale][0].value, seoDescription[language == "en"][0].value, seoDescription[0].value),
    backgroundImage,
    ogImage
  }
`)

export const boardsPageSettingsQuery = defineQuery(`
  coalesce(
    *[_type == "boardsPageSettings" && language == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "boardsPageSettings" && language == "en" && !(_id in path("drafts.**"))][0]
  ) {
    groupBySeries,
    "marquee": marquee.items[]{ _key, text, accent },
    ${SECTIONS_PROJECTION},
    title,
    seoTitle,
    seoDescription,
    ogImage
  }
`)

export const accessoryCategoriesQuery = defineQuery(`
  *[_type == "accessoryCategory" && !(_id in path("drafts.**"))] | order(order asc, _createdAt asc) {
    "id": _id,
    "name": coalesce(
      name[language == $locale][0].value,
      name[language == "en"][0].value,
      name[0].value
    ),
    "slug": slug.current
  }
`)

export const accessoriesQuery = defineQuery(`
  *[_type == "accessory" && language == $locale && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    title,
    slug,
    "category": category->{
      "id": _id,
      "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value),
      "slug": slug.current
    },
    mainImage
  }
`)

export const accessoriesPageSettingsQuery = defineQuery(`
  coalesce(
    *[_type == "accessoriesPageSettings" && language == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "accessoriesPageSettings" && language == "en" && !(_id in path("drafts.**"))][0]
  ) {
    title,
    showFilters,
    ${SECTIONS_PROJECTION},
    seoTitle,
    seoDescription,
    ogImage
  }
`)

export const sitemapBoardsQuery = defineQuery(`
  *[_type == "board" && defined(slug.current) && !(_id in path("drafts.**"))] | order(_updatedAt desc) {
    "slug": slug.current,
    language,
    _updatedAt,
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`)

export const sitemapHomePagesQuery = defineQuery(`
  *[_type == "homePage" && !(_id in path("drafts.**"))] {
    language,
    _updatedAt
  }
`)

// Home page lives at "/" — fetched by locale, falling back to the fr master
// when a locale has no homePage yet (mirrors the old pageBySlugQuery behaviour,
// so a missing/unpublished locale shows real content instead of a blank hero).
export const homePageByLocaleQuery = defineQuery(`
  coalesce(
    *[_type == "homePage" && language == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "homePage" && language == "fr" && !(_id in path("drafts.**"))][0]
  ) {
    _id,
    title,
    heroImage,
    heroTitle,
    "heroSubtitle": coalesce(heroSubtitle[language == $locale][0].value, heroSubtitle[0].value, heroSubtitle),
    seoTitle,
    seoDescription,
    ogImage,
    ${SECTIONS_PROJECTION}
  }
`)

// Polymorphic: resolves any CMS page type by slug+locale. Returns `title` (the
// placeholder render), `_type` (to dispatch to a real template later), the SEO
// fields for generateMetadata, and the localized slugs of its translations
// (for hreflang alternates). heroImage only exists on `page` — null elsewhere.
export const cmsPageBySlugQuery = defineQuery(`
  *[
    _type in ["page", "ourStoryPage", "contactPage", "faqPage", "whereToBuyPage"]
    && slug.current == $slug
    && language == $locale
    && !(_id in path("drafts.**"))
  ][0] {
    _type,
    title,
    seoTitle,
    seoDescription,
    ogImage,
    heroImage,
    "translations": *[_type == "translation.metadata" && references(^._id)][0]
      .translations[]{ "lang": value->language, "slug": value->slug.current }
  }
`)

export const faqPageQuery = defineQuery(`
  *[_type == "faqPage" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    title,
    heroTitle,
    "categories": categories[]{
      _key,
      title,
      "questions": questions[]{
        _key,
        question,
        "answer": answer[]{
          ...,
          _type == "image" => { ..., "url": asset->url + "?w=1280&q=85&auto=format" }
        }
      }
    },
    seoTitle,
    seoDescription,
    ogImage,
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`)

export const ourStoryPageQuery = defineQuery(`
  *[_type == "ourStoryPage" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    title,
    heroTitle,
    heroTagline,
    heroImage,
    ${SECTIONS_PROJECTION}
  }
`)

export const contactPageQuery = defineQuery(`
  *[_type == "contactPage" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    title,
    heroTitle,
    heroSubtitle,
    heroImage,
    introEyebrow,
    introTitle,
    intro,
    ${SECTIONS_PROJECTION}
  }
`)

export const tkIdPageByLocaleQuery = defineQuery(`
  coalesce(
    *[_type == "tkIdPage" && language == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "tkIdPage" && language == "en" && !(_id in path("drafts.**"))][0]
  ) {
    _id,
    title,
    heroTitle,
    heroSubtitle,
    heroImage,
    seoTitle,
    seoDescription,
    ogImage,
    ${SECTIONS_PROJECTION},
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`)

export const contactSettingsQuery = defineQuery(`
  *[_type == "contactSettings"][0] { email, whatsapp }
`)

// Seller identity printed on invoices.
export const companySettingsQuery = defineQuery(`
  *[_type == "companySettings"][0] { legalName, taxId, address, email }
`)

export const navigationQuery = defineQuery(`
  *[_type == "navigation" && location == $location && language == $locale][0] {
    items[] {
      _key,
      label,
      openInNewTab,
      "href": select(
        defined(internalLink) && internalLink->_type == "homePage" => "/",
        defined(internalLink) && internalLink->_type == "boardsPageSettings" => "/boards",
        defined(internalLink) && internalLink->_type == "accessoriesPageSettings" => "/accessories",
        defined(internalLink) && internalLink->_type == "accountPageSettings" => "/account",
        defined(internalLink) && internalLink->_type == "tkIdPage" => "/tk-id",
        defined(internalLink) => "/" + internalLink->slug.current,
        externalUrl
      ),
    },
    featured[] {
      _key,
      "name": board->name,
      "slug": board->slug.current,
      image,
    }
  }
`)

export const footerSeriesQuery = defineQuery(`
  *[_type == "series" && !(_id in path("drafts.**"))] | order(_createdAt asc) [0..1] {
    _id,
    "name": coalesce(
      name[language == $locale][0].value,
      name[language == "en"][0].value,
      name[0].value
    ),
    "boards": *[_type == "board" && !(_id in path("drafts.**")) && language == $locale && references(^._id)] | order(order asc) {
      _id,
      name,
      slug
    }
  }
`)

// Type-source only: never executed, but typegen turns it into PageBySlugQueryResult,
// which PageBuilder uses to type its Section union. Do not delete (knip flags it as
// unused because nothing runs it).
export const pageBySlugQuery = defineQuery(`
  coalesce(
    *[_type == "page" && slug.current == $slug && language == $locale][0],
    *[_type == "page" && slug.current == $slug && language == "fr"][0]
  ) {
    _id,
    title,
    heroImage,
    heroTitle,
    "heroSubtitle": coalesce(heroSubtitle[language == $locale][0].value, heroSubtitle[0].value, heroSubtitle),
    slug,
    seoTitle,
    seoDescription,
    ogImage,
    ${SECTIONS_PROJECTION}
  }
`)
