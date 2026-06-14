import { useEffect } from 'react'

/**
 * Overlay/drawer behaviour shared by the main menu and the product configurator:
 * close on Escape and lock body scroll while `open`. Restores the previous
 * overflow on close/unmount.
 */
export function useDrawer(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])
}
