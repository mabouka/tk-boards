'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

type Result = { ok: true } | { ok: false; error: string }

/**
 * An on/off switch backed by a server action. Optimistic: it flips at once and
 * rolls back if the action fails, so the admin isn't left waiting on a round-trip
 * for a single boolean.
 *
 * Generic on purpose — the same control drives the global e-shop switch and the
 * per-account override.
 */
export function SettingToggle({
  initial,
  action,
  successOn,
  successOff,
  onLabel,
  offLabel,
  'aria-label': ariaLabel,
}: {
  initial: boolean
  action: (value: boolean) => Promise<Result>
  successOn?: string
  successOff?: string
  // Rendered from the live state, so the label tracks an optimistic flip.
  onLabel?: string
  offLabel?: string
  'aria-label'?: string
}) {
  const [on, setOn] = useState(initial)
  const [pending, startTransition] = useTransition()

  const flip = () => {
    const next = !on
    setOn(next) // optimistic
    startTransition(async () => {
      const res = await action(next)
      if (res.ok) {
        toast.success(next ? (successOn ?? 'Activé.') : (successOff ?? 'Désactivé.'))
      } else {
        setOn(!next) // roll back
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel ?? onLabel ?? offLabel}
        disabled={pending}
        onClick={flip}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 ${
          on ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-background shadow transition-transform ${
            on ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      {(on ? onLabel : offLabel) && <span className="text-sm">{on ? onLabel : offLabel}</span>}
    </div>
  )
}
