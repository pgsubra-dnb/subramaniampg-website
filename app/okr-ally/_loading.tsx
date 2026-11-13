import { Page, TopBar, T } from './_ui'
import type { Brand } from '@/lib/okrAllyBrand'
import { DEFAULT_BRAND } from '@/lib/okrAllyBrand'

/**
 * OKR Ally / Goal Ally loading screen, shown at once while the page checks sign-in and loads data (and as the route's loading.tsx).
 * Flat blocks only: no spinner, no gradient, no shadow. Fades in over 150 ms; no animation for visitors who prefer less motion.
 * Screen readers hear "Loading" (visually hidden text in a status region) and the area is aria-busy.
 */
export const LOADING_CSS =
  `@keyframes okraLoadFade{from{opacity:0}to{opacity:1}}` +
  `.okra-loading{animation:okraLoadFade 150ms ease-out}` +
  `@media (prefers-reduced-motion: reduce){.okra-loading{animation:none}}` +
  `.okra-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`

const block = { background: T.infoLight, border: `1px solid ${T.border}`, borderRadius: 8 } as const

export function AllyLoading({ brand = DEFAULT_BRAND }: { brand?: Brand }) {
  return (
    <Page>
      <style>{LOADING_CSS}</style>
      <div className="okra-loading" aria-busy="true">
        <TopBar brand={brand} />
        <div role="status" className="okra-sr">
          Loading
        </div>
        <div aria-hidden="true">
          <div style={{ ...block, height: 28, width: '55%' }} />
          <div style={{ ...block, height: 16, width: '35%', marginTop: 12 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...block, height: 96, marginTop: 16 }} />
          ))}
        </div>
      </div>
    </Page>
  )
}
