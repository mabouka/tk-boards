import { defineField, defineType } from 'sanity'

/** Legal identity of the seller, printed on every invoice. Lives here rather than
 *  in env so it can be changed without a deploy — none of it is secret. */
export const companySettings = defineType({
  name: 'companySettings',
  title: 'Société (facturation)',
  type: 'document',
  fields: [
    defineField({
      name: 'legalName',
      title: 'Raison sociale',
      type: 'string',
      description: 'Nom légal de la société, tel qu’il doit apparaître sur la facture.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'taxId',
      title: 'NIF / CIF',
      type: 'string',
      description: 'Numéro d’identification fiscale. Sans lui, aucune facture n’est émise.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'address',
      title: 'Adresse fiscale',
      type: 'text',
      rows: 3,
      description: 'Une ligne par ligne d’adresse.',
    }),
    defineField({
      name: 'email',
      title: 'Email de contact',
      type: 'string',
    }),
  ],
  preview: { prepare: () => ({ title: 'Société (facturation)' }) },
})
