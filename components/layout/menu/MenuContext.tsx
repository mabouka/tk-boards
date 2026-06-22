'use client'

import { createContext, useContext, useState } from 'react'

type MenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const MenuContext = createContext<MenuContextValue | null>(null)

/** Shares the main-menu open/close state between the header trigger and the
 *  standalone <MainMenu /> overlay (both live at the site-layout level). */
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <MenuContext.Provider value={{ open, setOpen }}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within a MenuProvider')
  return ctx
}
