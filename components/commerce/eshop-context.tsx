'use client'

import { createContext, useContext } from 'react'

export type EshopState = {
  // Whether this visitor sees the real storefront (buy / cart / checkout) or the
  // contact-only V1. Decided per request on the server (global switch OR the
  // account's preview override) and handed down here.
  visible: boolean
  // WhatsApp link for the contact fallback, from Sanity contactSettings. BuyCta is
  // buried in the page-builder and can't fetch it itself, so it rides the context.
  whatsapp: string | null
}

// Default visible: any tree without the provider (there shouldn't be one on the
// storefront) keeps the pre-flag behaviour rather than silently hiding the shop.
const EshopContext = createContext<EshopState>({ visible: true, whatsapp: null })

export function EshopProvider({ value, children }: { value: EshopState; children: React.ReactNode }) {
  return <EshopContext.Provider value={value}>{children}</EshopContext.Provider>
}

export const useEshop = () => useContext(EshopContext)
