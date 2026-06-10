import { defineField, defineType } from 'sanity'

export const footerSettings = defineType({
  name: 'footerSettings',
  title: 'Footer',
  type: 'document',
  fields: [
    defineField({
      name: 'social',
      title: 'Social Media',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
        defineField({ name: 'google', title: 'Google URL', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url' }),
        defineField({ name: 'messenger', title: 'Messenger URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
        defineField({ name: 'whatsapp', title: 'WhatsApp URL', type: 'url' }),
        defineField({ name: 'x', title: 'X (Twitter) URL', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube URL', type: 'url' }),
      ],
    }),
    defineField({ name: 'copyright', title: 'Copyright text', type: 'string' }),
    defineField({
      name: 'privacyPolicyUrl',
      title: 'Privacy Policy URL',
      type: 'slug',
      options: { source: () => 'privacy-policy' },
    }),
    defineField({
      name: 'cookiePolicyUrl',
      title: 'Cookie Policy URL',
      type: 'slug',
      options: { source: () => 'cookie-policy' },
    }),
  ],
  preview: { prepare: () => ({ title: 'Footer' }) },
})
