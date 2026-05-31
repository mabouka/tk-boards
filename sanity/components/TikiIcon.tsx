import { BOARD_PATHS } from './boardPaths'

/**
 * Tiki series icon — three outlined boards.
 * Uses `currentColor` so it adapts to the Studio's light/dark theme.
 */
export function TikiIcon() {
  return (
    <svg
      height="1em"
      width="1em"
      viewBox="0 0 78 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tiki series"
    >
      {BOARD_PATHS.map((d) => (
        <path key={d.slice(0, 8)} d={d} fill="none" stroke="currentColor" strokeWidth="3" />
      ))}
    </svg>
  )
}
