import { Page, TopBar } from './_ui'
import type { Brand } from '@/lib/okrAllyBrand'
import { DEFAULT_BRAND } from '@/lib/okrAllyBrand'
import { tokens } from '@/lib/okrAllyTokens'

/**
 * OKR Ally / Goal Ally loading screen, shown at once while the page checks sign-in and loads data (and as the route's loading.tsx).
 * Flat blocks only: no spinner, no gradient, no shadow. Fades in over 150 ms; no animation for visitors who prefer less motion.
 * Screen readers hear "Loading" (visually hidden text in a status region) and the area is aria-busy.
 *
 * Runs on the SERVER as loading.tsx and in the browser inside OkrAllyClient. `_ui.tsx` is a 'use client' file, so from here only
 * its components (Page, TopBar) may be used: a plain value such as `T` is a reference on the server and reading it throws. The
 * colours therefore come straight from lib/okrAllyTokens.ts, which has no 'use client'.
 *
 * `animate` (default true): the route's loading.tsx fades in. The client's own loading phase passes false: by then the route
 * loading screen has usually just been shown, and fading in a second time would flicker.
 */
export const LOADING_CSS =
  `@keyframes okraLoadFade{from{opacity:0}to{opacity:1}}` +
  `.okra-loading-fade{animation:okraLoadFade 150ms ease-out}` +
  `@media (prefers-reduced-motion: reduce){.okra-loading-fade{animation:none}}` +
  `.okra-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`

const block = { background: tokens.infoLight, border: `1px solid ${tokens.border}`, borderRadius: 8 } as const

export function AllyLoading({ brand = DEFAULT_BRAND, animate = true }: { brand?: Brand; animate?: boolean }) {
  return (
    <Page>
      <style>{LOADING_CSS}</style>
      <div className={animate ? 'okra-loading okra-loading-fade' : 'okra-loading'} aria-busy="true">
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
