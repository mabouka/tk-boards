import { defineQuery } from 'next-sanity'

export const boardsQuery = defineQuery(`
  *[_type == "board" && language == $locale && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    name,
    slug,
    series->{ _id, "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value), slug },
    style,
    weight,
    mainImage
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
    sections[] {
      _type,
      _key,
      title,
      showFilters,
      items,
      eyebrow,
      label,
      body,
      image,
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
      imagePosition,
      layout,
      theme,
      quote,
      authorName,
      authorRole,
      intro,
      "milestones": milestones[]{ year, name, tag, svgPath },
      finalImage,
      finalLabelTitle,
      finalLabelSubtitle,
      "cta": cta {
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "ctas": ctas[] {
        _key,
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "features": items[]{
        mediaType,
        image,
        videoUrl,
        videoPoster,
        title,
        text,
        "cta": cta {
          "text": text,
          "openInNewTab": openInNewTab,
          "href": select(
            type == "internal" && internalLink->_type == "homePage" => "/",
            type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
            type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
            type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
            type == "internal" => "/" + internalLink->slug.current,
            type == "external" => url,
            type == "email" => "mailto:" + email,
            type == "phone" => "tel:" + phone
          )
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

export const seriesQuery = defineQuery(`
  *[_type == "series" && !(_id in path("drafts.**"))] | order(_createdAt asc) {
    _id,
    "name": coalesce(
      name[language == $locale][0].value,
      name[language == "en"][0].value,
      name[0].value
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
  "contact": *[_type == "contactSettings"][0]{ email, phone, address },
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
  *[_type == "boardsPageSettings" && _id == "boardsPageSettings"][0] {
    "seoTitle": coalesce(
      seoTitle[language == $locale][0].value,
      seoTitle[language == "en"][0].value,
      seoTitle[0].value
    ),
    "seoDescription": coalesce(
      seoDescription[language == $locale][0].value,
      seoDescription[language == "en"][0].value,
      seoDescription[0].value
    ),
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
    sections[] {
      _type,
      _key,
      title,
      showFilters,
      items,
      eyebrow,
      label,
      body,
      image,
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
      imagePosition,
      layout,
      theme,
      quote,
      authorName,
      authorRole,
      intro,
      "milestones": milestones[]{ year, name, tag, svgPath },
      finalImage,
      finalLabelTitle,
      finalLabelSubtitle,
      "cta": cta {
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "ctas": ctas[] {
        _key,
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "features": items[]{
        mediaType,
        image,
        videoUrl,
        videoPoster,
        title,
        text,
        "cta": cta {
          "text": text,
          "openInNewTab": openInNewTab,
          "href": select(
            type == "internal" && internalLink->_type == "homePage" => "/",
            type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
            type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
            type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
            type == "internal" => "/" + internalLink->slug.current,
            type == "external" => url,
            type == "email" => "mailto:" + email,
            type == "phone" => "tel:" + phone
          )
        }
      }
    }
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
    sections[] {
      _type,
      _key,
      title,
      showFilters,
      items,
      eyebrow,
      label,
      body,
      image,
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
      imagePosition,
      layout,
      theme,
      quote,
      authorName,
      authorRole,
      intro,
      "milestones": milestones[]{ year, name, tag, svgPath },
      finalImage,
      finalLabelTitle,
      finalLabelSubtitle,
      "cta": cta {
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "ctas": ctas[] {
        _key,
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
          type == "internal" && internalLink->_type == "homePage" => "/",
          type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
          type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
          type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      },
      "features": items[]{
        mediaType,
        image,
        videoUrl,
        videoPoster,
        title,
        text,
        "cta": cta {
          "text": text,
          "openInNewTab": openInNewTab,
          "href": select(
            type == "internal" && internalLink->_type == "homePage" => "/",
            type == "internal" && internalLink->_type == "boardsPageSettings" => "/boards",
            type == "internal" && internalLink->_type == "accessoriesPageSettings" => "/accessories",
            type == "internal" && internalLink->_type == "accountPageSettings" => "/account",
            type == "internal" => "/" + internalLink->slug.current,
            type == "external" => url,
            type == "email" => "mailto:" + email,
            type == "phone" => "tel:" + phone
          )
        }
      }
    }
  }
`)
