import { groq } from 'next-sanity'

export const boardsQuery = groq`
  *[_type == "board" && language == $locale] | order(order asc) {
    _id,
    name,
    slug,
    series->{ _id, name, slug },
    style,
    tagline,
    weight,
    mainImage,
    specs
  }
`

export const boardBySlugQuery = groq`
  *[_type == "board" && slug.current == $slug && language == $locale][0] {
    _id,
    name,
    slug,
    series->{ _id, name, slug, tagline, heroImage },
    style,
    tagline,
    weight,
    description,
    mainImage,
    specs
  }
`

export const seriesQuery = groq`
  *[_type == "series" && language == $locale] | order(order asc) {
    _id,
    name,
    slug,
    tagline,
    heroImage,
    "boards": *[_type == "board" && references(^._id) && language == $locale] | order(order asc) {
      _id,
      name,
      slug,
      style,
      mainImage
    }
  }
`

export const siteSettingsQuery = groq`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteTitle,
    seoDescription,
    contact,
    social,
    footer
  }
`

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug && language == $locale][0] {
    _id,
    title,
    slug,
    seoTitle,
    seoDescription,
    content
  }
`
