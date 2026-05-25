import { ALL_FIELDS_GROUP, defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'contact', title: 'Contact' },
    { name: 'footer', title: 'Footer' },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      group: 'seo'
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description (default)',
      type: 'text',
      rows: 3,
      group: 'seo'
    }),
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'object',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({ name: 'address', title: 'Address', type: 'text', rows: 2 }),
      ],
      group: 'contact'
    }),
    defineField({
      name: 'social',
      title: 'Social Media',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube URL', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
      ],
      group: 'footer'
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        defineField({ name: 'copyright', title: 'Copyright text', type: 'string' }),
        defineField({ name: 'privacyPolicyUrl', title: 'Privacy Policy URL', type: 'slug', options: { source: () => 'privacy-policy' } }),
        defineField({ name: 'cookiePolicyUrl', title: 'Cookie Policy URL', type: 'slug', options: { source: () => 'cookie-policy' } }),
      ],
      group: 'footer'
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
})
