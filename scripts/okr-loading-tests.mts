#!/usr/bin/env -S npx tsx
/**
 * OKR Ally / Goal Ally: (item 2) the draft and profile reads start together and keep the old failure behaviour;
 * (item 3) the loading screen is flat, fades in over 150 ms, has hidden "Loading" text and aria-busy, and is used by both products.
 * No database, no network, no browser.
 *
 *   npx tsx scripts/okr-loading-tests.mts
 *
 * WHAT THESE TESTS CANNOT PROVE: how the screen looks and fades in a real browser (check the screenshots), and the real timing
 * gain, which is the draft and profile request times in production after the deploy.
 */
import { readFileSync } from 'node:fs'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadDraftAndProfile } from '../lib/okrAllyLoad.ts'
// tsx compiles the page files with the classic JSX transform, which needs React in scope (Next does not).
;(globalThis as unknown as { React: typeof React }).React = React
const { AllyLoading, LOADING_CSS } = await import('../app/okr-ally/_loading.tsx')

let pass = 0
let fail = 0
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) pass++
  else fail++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`)
}
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const reply = (body: unknown) => ({ json: async () => body }) as unknown as Response
const badJson = () => ({ json: async () => { throw new SyntaxError('not json') } }) as unknown as Response
const tick = () => new Promise((r) => setTimeout(r, 5))

// ---- item 2: the two reads start together -------------------------------------------------------------------------------------
{
  const started: string[] = []
  let releaseDraft!: () => void
  const draftGate = new Promise<void>((r) => (releaseDraft = r))
  const fakeFetch = (async (url: string) => {
    started.push(url)
    if (url.endsWith('/draft')) { await draftGate; return reply({ formState: { step: 'x' } }) }
    return reply({ name: 'A' })
  }) as unknown as typeof fetch
  const p = loadDraftAndProfile(fakeFetch)
  await tick()
  ok('both requests are started before the draft has answered', started.length === 2 && started.includes('/api/okr-ally/draft') && started.includes('/api/okr-ally/profile'), started.join(','))
  let done = false
  p.then(() => (done = true))
  await tick()
  ok('the result waits for the slow one', done === false)
  releaseDraft()
  const r = await p
  ok('and returns both answers', (r.draft as { formState: { step: string } }).formState.step === 'x' && (r.profile as { name: string }).name === 'A')
}
{
  // failure behaviour, as before
  const f1 = (async (url: string) => (url.endsWith('/draft') ? badJson() : reply({ name: 'A' }))) as unknown as typeof fetch
  ok('draft reply not JSON: rejects (the caller shows the intro screen)', await loadDraftAndProfile(f1).then(() => false, () => true))
  const f2 = (async (url: string) => { if (url.endsWith('/draft')) throw new TypeError('network'); return reply({}) }) as unknown as typeof fetch
  ok('draft request fails: rejects', await loadDraftAndProfile(f2).then(() => false, () => true))
  const f3 = (async (url: string) => (url.endsWith('/profile') ? badJson() : reply({ formState: null }))) as unknown as typeof fetch
  const r3 = await loadDraftAndProfile(f3)
  ok('profile reply not JSON: the profile is null and the draft still comes through', r3.profile === null && (r3.draft as { formState: null }).formState === null)
  const f4 = (async (url: string) => { if (url.endsWith('/profile')) throw new TypeError('network'); return reply({ formState: null }) }) as unknown as typeof fetch
  ok('profile request fails: rejects, as it did before', await loadDraftAndProfile(f4).then(() => false, () => true))
  // both fail: no unhandled rejection (the process would exit non-zero on one)
  const f5 = (async () => { throw new TypeError('network') }) as unknown as typeof fetch
  ok('both fail: one clean rejection', await loadDraftAndProfile(f5).then(() => false, () => true))
  await tick()
  const client = read('app/okr-ally/OkrAllyClient.tsx')
  ok('the client uses it, and the two fetches are no longer awaited one after the other', /loadDraftAndProfile\(\)/.test(client) && !/\(await fetch\('\/api\/okr-ally\/draft'\)\)/.test(client) && !/\(await fetch\('\/api\/okr-ally\/profile'\)\)/.test(client))
  const lib = read('lib/okrAllyLoad.ts')
  ok('the API routes are unchanged (the helper only calls GET /draft and GET /profile)', /\/api\/okr-ally\/draft/.test(lib) && /\/api\/okr-ally\/profile/.test(lib) && !/method|PUT|POST|DELETE/.test(lib.replace(/\/\*[\s\S]*?\*\//g, '')))
}

// ---- item 3: the loading screen -------------------------------------------------------------------------------------------------
for (const [brand, product] of [['okr_ally', 'OKR Ally'], ['goal_ally', 'Goal Ally']] as const) {
  const html = renderToStaticMarkup(createElement(AllyLoading, { brand }))
  ok(`${brand}: hidden "Loading" text in a status region`, /role="status" class="okra-sr">Loading</.test(html))
  ok(`${brand}: aria-busy`, /aria-busy="true"/.test(html))
  ok(`${brand}: the blocks are hidden from screen readers`, /aria-hidden="true"/.test(html))
  ok(`${brand}: flat blocks: a title block and three card blocks`, (html.match(/height:96px/g) ?? []).length === 3 && /height:28px/.test(html))
  ok(`${brand}: shows the right product name in the top bar`, html.includes(product))
  ok(`${brand}: no visible "Loading…" paragraph any more`, !/Loading…/.test(html))
  ok(`${brand}: fades in (class present)`, /class="okra-loading"/.test(html))
}
{
  const css = LOADING_CSS
  ok('loading CSS: fade of 150 ms, starting at once (no delay)', /\.okra-loading\{animation:okraLoadFade 150ms ease-out\}/.test(css) && !/animation-delay/.test(css))
  ok('loading CSS: no animation for reduced motion', /prefers-reduced-motion: reduce\)\{\.okra-loading\{animation:none\}/.test(css))
  const src = read('app/okr-ally/_loading.tsx').replace(/\/\*[\s\S]*?\*\//g, '')
  ok('loading screen: no spinner, no gradient, no shadow', !/gradient|shadow|spin|rotate|blur|okraPulse/i.test(src + css))
  ok('both pages use it as their loading.tsx, goal-ally with its own brand', /AllyLoading/.test(read('app/okr-ally/loading.tsx')) && /AllyLoading brand="goal_ally"/.test(read('app/goal-ally/loading.tsx')))
  ok('the client shows it while it checks sign-in (phase loading) for both brands', /phase === 'loading'\) \{\s*return <AllyLoading brand=\{brand\} \/>/.test(read('app/okr-ally/OkrAllyClient.tsx')) && /brand="goal_ally"/.test(read('app/goal-ally/page.tsx')))
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
