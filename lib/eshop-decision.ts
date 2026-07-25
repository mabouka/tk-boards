/**
 * The e-shop visibility rule, kept in its own dependency-free module so it can be
 * unit-tested without dragging in the DB/auth chain that lib/eshop.ts imports.
 *
 * The shop shows when the global switch is on, OR the signed-in account forces it
 * on. Force-on only — the override can never hide a shop the global switch has
 * turned on.
 */
export function decideEshopVisible(
  globalEnabled: boolean,
  accountPreview: boolean | null | undefined
): boolean {
  return globalEnabled || (accountPreview ?? false)
}
