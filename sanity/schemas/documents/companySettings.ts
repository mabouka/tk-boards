import { defineField, defineType } from 'sanity'

/** Legal identity of the seller, printed on every invoice. Lives here rather than
 *  in env so it can be changed without a deploy — none of it is secret.
 *
 *  Not internationalized (see sanity/I18N.md): a legal name, tax id and registered
 *  address are the same in every locale, so neither the document-level nor the
 *  field-array model applies. */
export const companySettings = defineType({
  name: 'companySettings',
  title: 'Company (invoicing)',
  type: 'document',
  fields: [
    defineField({
      name: 'legalName',
      title: 'Legal Name',
      type: 'string',
      description: 'Registered company name, as it must appear on the invoice.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'taxId',
      title: 'Tax ID (NIF/CIF)',
      type: 'string',
      description: 'Without it, no invoice is issued at all.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'address',
      title: 'Registered Address',
      type: 'text',
      rows: 3,
      description: 'One address line per line.',
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Invoice Logo',
      type: 'image',
      description:
        'Shown top-left of the invoice. PNG or JPEG only — the PDF renderer cannot read SVG. ' +
        'The invoice is on a white background, so upload a dark version or it will be invisible.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Company (invoicing)' }) },
})
