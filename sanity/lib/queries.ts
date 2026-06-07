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
      "cta": cta {
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
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
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
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


export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    brandName,
    siteTitle,
    seoDescription,
    logo,
    ogImage,
    contact,
    social,
    footer
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
  *[_type == "page" && slug.current == "home" && !(_id in path("drafts.**"))] {
    language,
    _updatedAt
  }
`)

export const navigationQuery = defineQuery(`
  *[_type == "navigation" && title == $title && language == $locale][0] {
    items[] {
      label,
      openInNewTab,
      "slug": internalLink->slug.current,
      "externalUrl": externalUrl,
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
      "cta": cta {
        "text": text,
        "openInNewTab": openInNewTab,
        "href": select(
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
          type == "internal" => "/" + internalLink->slug.current,
          type == "external" => url,
          type == "email" => "mailto:" + email,
          type == "phone" => "tel:" + phone
        )
      }
    }
  }
`)
