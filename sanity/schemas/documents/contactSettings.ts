import { defineField, defineType } from 'sanity'

export const contactSettings = defineType({
  name: 'contactSettings',
  title: 'Contact',
  type: 'document',
  fields: [
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'address', title: 'Address', type: 'text', rows: 2 }),
  ],
  preview: { prepare: () => ({ title: 'Contact' }) },
})
