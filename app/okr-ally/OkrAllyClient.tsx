'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Page, TopBar, InstallAppBanner, AllyRow, Btn, Field, ShareCard, T, AVATAR, keyframes } from './_ui'
import StepForm from './_form'
import ReportScreen, { FullReport } from './_report'
import PricingTab from './_pricing'
import HistoryTab from './_history'
import HelpTab from './_help'
import { AdminList, AdminReviewScreen } from './_admin'
import Walkthrough, { OrgAdminWalkthrough, EmployeeWalkthrough } from './_walkthrough'
import OrgAdminScreen from './_org'
import { FormState, emptyForm, CtxFieldState, OrgContext } from './_formState'
import { type Brand, DEFAULT_BRAND, vocab, reviewCount } from '@/lib/okrAllyBrand'

type RoleWalkthrough = 'org_admin' | 'employee'

type Phase = 'loading' | 'intro' | 'walkthrough' | 'email' | 'app' | 'signedout'
type Tab = 'ally' | 'pricing' | 'history' | 'help' | 'admin' | 'company'

interface Me {
  authenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    isAdmin: boolean
    isOrgAdmin: boolean
    organizationId: string | null
  }
  orgContext?: OrgContext | null
  seenWalkthroughs?: string[]
}
interface Status {
  creditsRemaining: number
  personalCredits: number
  orgCredits: { name: string; credits: number }[]
  freeReviewAvailable: boolean
  links: { booking: string | null; substack: string | null; linkedin: string | null }
}

export default function OkrAllyClient({ brand = DEFAULT_BRAND }: { brand?: Brand }) {
  const v = vocab(brand)
  const [phase, setPhase] = useState<Phase>('loading')
  const [tab, setTab] = useState<Tab>('ally')
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [draft, setDraft] = useState<FormState | null>(null)
  const [profilePrefill, setProfilePrefill] = useState<FormState | null>(null)
  const [resumeOffer, setResumeOffer] = useState<FormState | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [report, setReport] = useState<FullReport | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [roleWalkthrough, setRoleWalkthrough] = useState<RoleWalkthrough | null>(null)

  const isAdmin = !!me?.user?.isAdmin
  const isOrgAdmin = !!me?.user?.isOrgAdmin
  const orgCtx = me?.orgContext ?? null
  const seenWalkthroughs = me?.seenWalkthroughs
  // "Seen" is authoritative from the server (`/me`), but we also stamp
  // localStorage on dismiss so an immediate reload can't race the POST and
  // re-pop the walkthrough on the same device.
  const localSeenKey = (k: RoleWalkthrough) => `okr_ally_wt_seen_${k}`
  const localSeen = (k: RoleWalkthrough) => {
    try {
      return localStorage.getItem(localSeenKey(k)) === '1'
    } catch {
      return false
    }
  }
  const hasSeen = (k: RoleWalkthrough) => !!seenWalkthroughs?.includes(k) || localSeen(k)

  // Dismiss a role walkthrough — record it (idempotent) so it won't auto-pop
  // again, and reflect that locally. It stays reopenable from the "see this
  // again" link, which calls setRoleWalkthrough directly.
  const dismissRoleWalkthrough = useCallback(
    (k: RoleWalkthrough) => {
      setRoleWalkthrough(null)
      try {
        localStorage.setItem(`okr_ally_wt_seen_${k}`, '1')
      } catch {
        /* private mode / storage blocked — the server POST still covers it */
      }
      setMe((m) =>
        m && !m.seenWalkthroughs?.includes(k)
          ? { ...m, seenWalkthroughs: [...(m.seenWalkthroughs ?? []), k] }
          : m
      )
      fetch('/api/okr-ally/walkthrough-seen', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: k }),
        keepalive: true,
      }).catch(() => {})
    },
    []
  )

  // Register the minimal service worker — the last PWA-installability criterion
  // (Chrome/Edge, desktop + Android). It does no caching.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${v.path}/sw.js`, { scope: v.path }).catch(() => {})
    }
  }, [v.path])

  const refreshStatus = useCallback(() => {
    fetch('/api/okr-ally/status')
      .then((r) => r.json())
      .then((s: Status) => setStatus(s))
      .catch(() => {})
  }, [])

  const refreshMe = useCallback(() => {
    fetch('/api/okr-ally/me')
      .then((r) => r.json())
      .then((m: Me) => m.authenticated && setMe(m))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Leave ?signedout=1 in the URL until the user leaves the screen — stripping
    // it here would make a StrictMode re-run of this effect fall through to the
    // normal load and skip the signed-out screen.
    if (params.get('signedout') === '1') {
      setPhase('signedout')
      return
    }
    // `?tab=company` — the corporate admin-welcome email links here directly.
    const wantsCompanyTab = params.get('tab') === 'company'
    if (params.has('tab')) window.history.replaceState({}, '', v.path)
    ;(async () => {
      try {
        const m: Me = await (await fetch('/api/okr-ally/me')).json()
        setMe(m)
        if (!m.authenticated) {
          setPhase('intro')
          return
        }
        // A corporate admin whose org context isn't published yet has one real
        // job — set it up. Route them straight to the Company tab instead of the
        // generic intro/chat. Once context_confirmed_at is set, they land
        // normally (the Company tab stays available in the tab bar).
        if (m.user?.isOrgAdmin && (wantsCompanyTab || (m.orgContext && !m.orgContext.confirmed))) {
          setTab('company')
        }
        refreshStatus()
        const [d, prof] = await Promise.all([
          (await fetch('/api/okr-ally/draft')).json(),
          (await fetch('/api/okr-ally/profile')).json().catch(() => null),
        ])
        const prefill = prof ? prefillFromProfile(prof, m) : null
        setProfilePrefill(prefill)
        // "Meaningful progress" = past the first stop of whichever flow applies.
        // 'name' (stepwise start) and 'profile_summary' (summary start) don't count.
        const savedStep = d.formState?.step
        if (d.formState && savedStep && savedStep !== 'name' && savedStep !== 'profile_summary') {
          setResumeOffer(d.formState as FormState)
        } else {
          setDraft(prefill)
        }
        setPhase('app')
      } catch {
        setPhase('intro')
      }
    })()
  }, [refreshStatus, v.path])

  // Org-admin walkthrough — auto once, the first time the Company tab is opened.
  useEffect(() => {
    if (
      phase === 'app' &&
      tab === 'company' &&
      isOrgAdmin &&
      seenWalkthroughs !== undefined &&
      !hasSeen('org_admin') &&
      !roleWalkthrough
    ) {
      setRoleWalkthrough('org_admin')
    }
    // hasSeen is derived from seenWalkthroughs; roleWalkthrough guards re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tab, isOrgAdmin, seenWalkthroughs, roleWalkthrough])

  // load the full report when reportId is set
  useEffect(() => {
    if (!reportId) return
    setReport(null)
    fetch(`/api/okr-ally/submission/${reportId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rep: FullReport | null) => setReport(rep))
      .catch(() => setReport(null))
  }, [reportId])

  const startForm = useCallback((f: FormState | null) => {
    setDraft(f)
    setResumeOffer(null)
    setReportId(null)
    setTab('ally')
  }, [])

  function prefillFromProfile(
    prof: {
      name?: string
      phone?: string | null
      companyName?: string | null
      companyContext?: string | null
      businessContext?: string | null
      roleContext?: string | null
    },
    m: Me
  ): FormState | null {
    const hasContext = prof.companyContext || prof.businessContext || prof.roleContext
    if (!prof.companyName && !hasContext && !prof.phone) return null

    // A "full" saved profile — company name + all three context fields — gets the
    // returning-user summary screen. Anything partial falls back to the
    // step-by-step flow (prefilled), unchanged.
    const full =
      !!prof.companyName && !!prof.companyContext && !!prof.businessContext && !!prof.roleContext

    const f = emptyForm()
    f.mode = full ? 'summary' : 'stepwise'
    f.step = full ? 'profile_summary' : 'name'
    f.saveProfile = full // returning users keep their profile current by default
    f.name = prof.name || m.user?.name || ''
    f.phone = prof.phone || ''
    f.companyName = prof.companyName || ''
    const seed = (text: string | null | undefined): CtxFieldState => {
      const t = (text || '').trim()
      return {
        raw: t,
        lastCheckedText: t,
        clarifyingQuestion: null,
        clarifyingAnswer: null,
        paraphraseSuggested: null,
        finalText: t,
        paraphraseAction: t ? 'not_offered' : '',
        // 'done' in summary mode: the field is already resolved and is skipped
        // unless the user edits it on the summary screen.
        phase: full ? 'done' : 'input',
      }
    }
    f.ctx = { company: seed(prof.companyContext), business: seed(prof.businessContext), role: seed(prof.roleContext) }
    return f
  }

  if (phase === 'loading') {
    return (
      <Page>
        <style>{keyframes}</style>
        <TopBar brand={brand} />
        <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>
      </Page>
    )
  }

  const showingReport = phase === 'app' && reportId !== null
  const showingAdmin = phase === 'app' && adminId !== null
  // Admin / Company tabs only make sense with the matching flag; fall back if
  // it isn't (or is no longer) set.
  const activeTab: Tab =
    (tab === 'admin' && !isAdmin) || (tab === 'company' && !isOrgAdmin) ? 'ally' : tab

  return (
    <Page>
      <style>{keyframes}</style>

      {roleWalkthrough && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: T.cream, overflowY: 'auto' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px 80px' }}>
            {roleWalkthrough === 'org_admin' ? (
              <OrgAdminWalkthrough brand={brand} onClose={() => dismissRoleWalkthrough('org_admin')} />
            ) : (
              <EmployeeWalkthrough brand={brand} onClose={() => dismissRoleWalkthrough('employee')} />
            )}
          </div>
        </div>
      )}

      <TopBar
        brand={brand}
        right={
          me?.authenticated ? (
            <>
              <span
                style={{ color: T.muted }}
                title={
                  status && status.orgCredits.length
                    ? `${status.personalCredits} personal · ` +
                      status.orgCredits.map((o) => `${o.credits} from ${o.name}`).join(' · ')
                    : undefined
                }
              >
                {reviewCount(brand, status?.creditsRemaining ?? 0)}
                {status && status.orgCredits.length > 0 && (
                  <span style={{ color: T.emeraldDark }}>
                    {' '}
                    ({status.orgCredits.reduce((s, o) => s + o.credits, 0)} company)
                  </span>
                )}
              </span>
              <a href={`/api/okr-ally/logout?brand=${brand}`} style={{ color: T.emeraldDark, fontWeight: 600 }}>
                Sign out
              </a>
            </>
          ) : null
        }
      />

      <InstallAppBanner brand={brand} />

      {me?.authenticated && !showingReport && !showingAdmin && (
        <TabBar tab={activeTab} onChange={setTab} isAdmin={isAdmin} isOrgAdmin={isOrgAdmin} />
      )}

      {phase === 'signedout' && (
        <SignedOut
          brand={brand}
          onContinue={() => {
            window.history.replaceState({}, '', v.path)
            setPhase('intro')
          }}
        />
      )}
      {phase === 'intro' && (
        <Intro brand={brand} onStart={() => setPhase('email')} onSeeHow={() => setPhase('walkthrough')} />
      )}
      {phase === 'walkthrough' && (
        <Walkthrough brand={brand} onBack={() => setPhase('intro')} onStart={() => setPhase('email')} />
      )}
      {phase === 'email' && <EmailGate brand={brand} />}

      {phase === 'app' && showingReport && (
        <>
          <button
            onClick={() => {
              setReportId(null)
              setTab('ally')
            }}
            style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginBottom: 12, padding: 0 }}
          >
            ← Back
          </button>
          {report ? (
            <ReportScreen
              report={report}
              brand={report.brand ?? brand}
              onStartAnother={() => startForm(null)}
              bookingUrl={status?.links.booking ?? null}
              substackUrl={status?.links.substack ?? null}
              linkedinUrl={status?.links.linkedin ?? null}
            />
          ) : (
            <p style={{ color: T.muted, fontSize: 14 }}>Loading your report…</p>
          )}
        </>
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'ally' && orgCtx && !orgCtx.confirmed && (
        <OrgContextPending orgCtx={orgCtx} isOrgAdmin={isOrgAdmin} brand={brand} onGoToCompany={() => setTab('company')} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'ally' && !(orgCtx && !orgCtx.confirmed) && resumeOffer && (
        <>
          <AllyRow>You have a review in progress. Pick up where you left off, or start fresh?</AllyRow>
          <div className="flex gap-2 mb-4">
            <Btn onClick={() => startForm(resumeOffer)}>Resume</Btn>
            <Btn variant="ghost" onClick={() => startForm(profilePrefill)}>
              Start fresh
            </Btn>
          </div>
        </>
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'ally' && !(orgCtx && !orgCtx.confirmed) && !resumeOffer && (
        <>
          {orgCtx?.confirmed && (
            <SeeAgainLink onClick={() => setRoleWalkthrough('employee')}>
              See how {v.product} works at your company
            </SeeAgainLink>
          )}
          <StepForm
            initialForm={draft}
            orgContext={orgCtx}
            brand={brand}
            onReachedContextScreens={() => {
              if (!hasSeen('employee')) setRoleWalkthrough('employee')
            }}
            onSubmitted={(r) => {
              setReportId(r.submissionId)
              refreshStatus()
            }}
          />
        </>
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'pricing' && (
        <PricingTab brand={brand} onBalanceChange={(n) => setStatus((s) => (s ? { ...s, creditsRemaining: n } : s))} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'history' && (
        <HistoryTab brand={brand} onOpen={(id) => setReportId(id)} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'help' && <HelpTab brand={brand} />}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'company' && isOrgAdmin && (
        <>
          <SeeAgainLink onClick={() => setRoleWalkthrough('org_admin')}>
            See the admin walkthrough again
          </SeeAgainLink>
          <OrgAdminScreen
            brand={brand}
            onPoolChange={() => {
              refreshStatus()
              refreshMe()
            }}
          />
        </>
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'admin' && isAdmin && (
        <AdminList brand={brand} onOpen={(id) => setAdminId(id)} />
      )}

      {phase === 'app' && showingAdmin && (
        <AdminReviewScreen
          submissionId={adminId!}
          onBack={() => {
            setAdminId(null)
            setTab('admin')
          }}
        />
      )}
    </Page>
  )
}

function TabBar({
  tab,
  onChange,
  isAdmin,
  isOrgAdmin,
}: {
  tab: Tab
  onChange: (t: Tab) => void
  isAdmin: boolean
  isOrgAdmin: boolean
}) {
  const tabs: [Tab, string][] = [
    ['ally', 'Ally'],
    ['pricing', 'Pricing & Plans'],
    ['history', 'History'],
    ['help', 'Help'],
    ...(isOrgAdmin ? ([['company', 'Company']] as [Tab, string][]) : []),
    ...(isAdmin ? ([['admin', 'Admin']] as [Tab, string][]) : []),
  ]
  return (
    <div
      className="flex gap-1 mb-6"
      style={{ borderBottom: `1px solid ${T.hairline}`, overflowX: 'auto' }}
    >
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '.03em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            color: tab === id ? T.charcoal : T.muted,
            background: 'none',
            border: 'none',
            padding: '10px 8px',
            cursor: 'pointer',
            borderBottom: `2px solid ${tab === id ? T.emerald : 'transparent'}`,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Intro({ brand, onStart, onSeeHow }: { brand: Brand; onStart: () => void; onSeeHow: () => void }) {
  const v = vocab(brand)
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt={v.product} width={84} height={84} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 24, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        Hi, I&apos;m Ally.
      </h1>
      <p style={{ color: T.muted, marginTop: 12, lineHeight: 1.6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        Send me the {v.objective} and {v.krPlural} you wrote, and I&apos;ll tell you honestly where they&apos;re strong,
        where they&apos;re not, score them against a clear rubric, and rewrite them two ways.
      </p>
      <p style={{ color: T.muted, marginTop: 14, fontSize: 13.5, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        I&apos;m built by Subramaniam P G, who has spent over 40 years helping leadership teams turn strategy into
        goals their people can actually execute. He&apos;s authored 7 books, including <em>The Language of OKRs</em>,
        and is a certified OKR and executive coach who has guided over 100 companies. I bring his rubric and his ear
        for a sharp goal to whatever you send me.
      </p>
      <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={onStart}>Say hi to Ally</Btn>
        <Btn variant="ghost" onClick={onSeeHow}>
          See how it works
        </Btn>
      </div>
      <p style={{ marginTop: 12, fontSize: 12.5, color: T.muted }}>Your first review is free.</p>
      <div
        style={{
          marginTop: 28,
          paddingTop: 12,
          borderTop: `1px solid ${T.hairline}`,
          fontSize: 11.5,
          color: T.muted,
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span>More from PGS:</span>
        <a href="/work/okr-consulting" style={{ color: T.muted, textDecoration: 'underline' }}>
          OKR consulting
        </a>
        <a href="/assessment" style={{ color: T.muted, textDecoration: 'underline' }}>
          Leadership Execution Assessment
        </a>
      </div>
    </div>
  )
}

function SeeAgainLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        marginBottom: 12,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: 12.5,
        color: T.emeraldDark,
        textDecoration: 'underline',
      }}
    >
      {children}
    </button>
  )
}

function OrgContextPending({
  orgCtx,
  isOrgAdmin,
  brand,
  onGoToCompany,
}: {
  orgCtx: OrgContext
  isOrgAdmin: boolean
  brand: Brand
  onGoToCompany: () => void
}) {
  return (
    <div>
      <AllyRow>
        <strong>{orgCtx.organizationName}</strong> runs {vocab(brand).product} on a shared company context, and it hasn&apos;t
        been published yet. Until it is, reviews are on hold for everyone on the team.
      </AllyRow>
      {isOrgAdmin ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.6, marginBottom: 12 }}>
            You&apos;re the admin. Open the Company tab, write your company and business context, and click
            <strong> Confirm and publish</strong>. Your team can run reviews the moment you do.
          </p>
          <Btn onClick={onGoToCompany}>Go to the Company tab</Btn>
        </div>
      ) : (
        <p style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.6, marginTop: 12 }}>
          Ask your company admin{orgCtx.adminEmail ? <> (<a href={`mailto:${orgCtx.adminEmail}`} style={{ color: T.emeraldDark, fontWeight: 600 }}>{orgCtx.adminEmail}</a>)</> : null}{' '}
          to set it up on the Company tab. You&apos;ll be able to run reviews as soon as they publish it —
          your role context is still yours to fill in when you do.
        </p>
      )}
    </div>
  )
}

function SignedOut({ brand, onContinue }: { brand: Brand; onContinue: () => void }) {
  const v = vocab(brand)
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt={v.product} width={72} height={72} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 22, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        You&apos;re signed out.
      </h1>
      <p style={{ color: T.muted, marginTop: 10, fontSize: 13.5, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        Your history and {v.reviews} are saved — sign back in any time with your email.
      </p>
      <div
        style={{
          marginTop: 20,
          textAlign: 'left',
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
          border: `1px solid ${T.hairline}`,
          borderRadius: 14,
          padding: 18,
          background: T.card,
        }}
      >
        <ShareCard brand={brand} />
      </div>
      <div style={{ marginTop: 20 }}>
        <Btn variant="ghost" onClick={onContinue}>
          Back to the start
        </Btn>
      </div>
    </div>
  )
}

const RESEND_COOLDOWN_S = 60
const MAX_RESENDS = 3

function EmailGate({ brand }: { brand: Brand }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [resends, setResends] = useState(0)
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0)
  const [, setTick] = useState(0)
  const [justResent, setJustResent] = useState(false)

  // One interval per cooldown period; `cooldown` is derived from the clock so a
  // dropped tick can't strand the button as disabled.
  useEffect(() => {
    if (cooldownEndsAt <= Date.now()) return
    const id = setInterval(() => {
      setTick((n) => n + 1)
      if (Date.now() >= cooldownEndsAt) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownEndsAt])
  const cooldown = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000))

  async function request(isResend: boolean) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalErr('That doesn’t look like an email address.')
      return
    }
    setBusy(true)
    setLocalErr(null)
    setJustResent(false)
    try {
      const r = await fetch('/api/okr-ally/sign-in-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, brand }),
      })
      if (r.status === 429) {
        const j = await r.json().catch(() => ({}))
        setLocalErr(j.error || 'Too many sign-in codes requested — please wait a few minutes.')
        return
      }
      if (!r.ok) {
        setLocalErr('Could not send the code. Try again in a moment.')
        return
      }
      setSent(true)
      setCode('')
      setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_S * 1000)
      if (isResend) {
        setResends((n) => n + 1)
        setJustResent(true)
      }
    } catch {
      setLocalErr('Could not send the code. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }
  const send = () => request(false)
  const resend = () => request(true)

  async function verify() {
    if (!/^\d{6}$/.test(code)) {
      setLocalErr('Enter the 6-digit code from the email.')
      return
    }
    setBusy(true)
    setLocalErr(null)
    setJustResent(false)
    try {
      const r = await fetch('/api/okr-ally/sign-in-code/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code, brand }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        // Full reload so the load effect picks up the freshly-set session cookie.
        window.location.assign(j.redirect || vocab(brand).path)
        return
      }
      setLocalErr(j.error || 'That code isn’t right. Check it and try again, or request a new one.')
    } catch {
      setLocalErr('Something went wrong signing you in. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    const hitCap = resends >= MAX_RESENDS
    return (
      <>
        <AllyRow>
          I&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below — it expires in 10 minutes.
        </AllyRow>
        {justResent && (
          <p style={{ fontSize: 12.5, color: T.emeraldDark, marginTop: 4 }}>New code sent to {email}.</p>
        )}
        {localErr && (
          <div className="mt-2 mb-1 text-sm rounded-lg px-4 py-3" style={{ background: T.errorLight, color: T.error, border: `1px solid ${T.errorBorder}` }}>
            {localErr}
          </div>
        )}
        <div className="flex gap-2" style={{ marginTop: 10 }}>
          <div className="flex-1">
            <Field
              value={code}
              onChange={(x) => setCode(x.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              ariaLabel="6-digit sign-in code"
              onEnter={verify}
              autoFocus
            />
          </div>
          <Btn onClick={verify} disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Verify'}
          </Btn>
        </div>
        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 8 }}>
          Didn&apos;t get it? Check your spam or junk folder{cooldown > 0 ? ', then resend it below' : ''}.
        </p>
        <div style={{ marginTop: 10 }}>
          {hitCap ? (
            <p style={{ fontSize: 12.5, color: T.muted }}>
              That&apos;s the resend limit for now. If it still hasn&apos;t arrived, email{' '}
              <a href="mailto:pgs@embiggen.co.in" style={{ color: T.emeraldDark, fontWeight: 600 }}>
                pgs@embiggen.co.in
              </a>
              .
            </p>
          ) : (
            <Btn variant="ghost" onClick={resend} disabled={busy || cooldown > 0}>
              {busy ? 'Sending…' : cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
            </Btn>
          )}
        </div>
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => { setSent(false); setCode(''); setLocalErr(null); setJustResent(false) }}
            style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 600, cursor: 'pointer', fontSize: 12.5, padding: 0 }}
          >
            Use a different email
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <AllyRow>
        Before we start, what&apos;s your email? I&apos;ll send a one-time 6-digit code — no password. It&apos;s how
        your history and {vocab(brand).reviews} stay with you.
      </AllyRow>
      {localErr && (
        <div className="mb-3 text-sm rounded-lg px-4 py-3" style={{ background: T.errorLight, color: T.error, border: `1px solid ${T.errorBorder}` }}>
          {localErr}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <Field value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" onEnter={send} autoFocus />
        </div>
        <Btn onClick={send} disabled={busy}>
          {busy ? 'Sending…' : 'Send code'}
        </Btn>
      </div>
    </>
  )
}
