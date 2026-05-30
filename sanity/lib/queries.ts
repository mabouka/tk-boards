import { groq } from 'next-sanity'

export const boardsQuery = groq`
  *[_type == "board" && language == $locale && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    name,
    slug,
    series->{ _id, "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value), slug },
    style,
    tagline,
    weight,
    mainImage,
    specs
  }
`

export const boardBySlugQuery = groq`
  *[_type == "board" && slug.current == $slug && language == $locale && !(_id in path("drafts.**"))][0] {
    _id,
    name,
    slug,
    series->{ _id, "name": coalesce(name[language == $locale][0].value, name[language == "en"][0].value, name[0].value), slug },
    style,
    tagline,
    weight,
    description,
    mainImage,
    specs,
    seoTitle,
    seoDescription,
    ogImage,
    "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
      "lang": value->language,
      "slug": value->slug.current
    }
  }
`

export const seriesQuery = groq`
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
`


export const siteSettingsQuery = groq`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteTitle,
    seoDescription,
    ogImage,
    contact,
    social,
    footer
  }
`

export const boardsPageSettingsQuery = groq`
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
`

export const navigationQuery = groq`
  *[_type == "navigation" && title == $title][0] {
    items[] {
      label,
      openInNewTab,
      "slug": internalLink->slug.current,
      "externalUrl": externalUrl,
    }
  }
`

export const footerSeriesQuery = groq`
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
`

export const pageBySlugQuery = groq`
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
      imagePosition,
      layout,
      theme,
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
`
