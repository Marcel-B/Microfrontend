/**
 * "Herkunft anzeigen" (footer switch): outlines every area of the page in the color of the part it comes from, the
 * same colors as the diagram in the README. Areas mark themselves with data-origin="host" (shell), "remote" (pages
 * of a remote) or "library" (components and shared texts of the component library); the shell's CSS draws the
 * outlines while <html data-show-origin> is set.
 */
export const origins = ['host', 'remote', 'library'] as const
export type Origin = (typeof origins)[number]

const storageKey = 'mfe.showOrigin'

export function isOriginShown(): boolean {
  return localStorage.getItem(storageKey) === '1'
}

export function setOriginShown(show: boolean): void {
  if (show) {
    localStorage.setItem(storageKey, '1')
    document.documentElement.dataset.showOrigin = ''
  } else {
    localStorage.removeItem(storageKey)
    delete document.documentElement.dataset.showOrigin
  }
}
