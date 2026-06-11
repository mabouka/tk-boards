import { defineField, defineType } from 'sanity'

// Empty singleton: exists so the /account route is selectable from the menu
// "Internal page" picker like the Boards / Accessories listing pages. No real
// fields yet — add SEO/access config here later if needed.
export const accountPageSettings = defineType({
  name: 'accountPageSettings',
  title: 'Account Page Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'placeholder',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    // Shown in the "Internal page" picker — keep it short and route-like.
    prepare: () => ({ title: 'Account', subtitle: '/account (user dashboard)' }),
  },
})
