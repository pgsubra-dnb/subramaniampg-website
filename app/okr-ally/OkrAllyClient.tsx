'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Page, TopBar, InstallAppBanner, AllyRow, Btn, Field, ShareCard, T, AVATAR, keyframes } from './_ui'
import StepForm from './_form'
import ReportScreen, { FullReport } from './_report'
import PricingTab from './_pricing'
import HistoryTab from './_history'
import HelpTab from './_help'
import { AdminList, AdminReviewScreen } from './_admin'
import OrgAdminScreen from './_org'
import { FormState, emptyForm, CtxFieldState } from './_formState'

type Phase = 'loading' | 'intro' | 'email' | 'app' | 'signedout'
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
}
interface Status {
  creditsRemaining: number
  personalCredits: number
  orgCredits: { name: string; credits: number }[]
  freeReviewAvailable: boolean
  links: { booking: string | null; substack: string | null; linkedin: string | null }
}

const VERIFY_ERROR: Record<string, string> = {
  'invalid-link': 'That sign-in link isn’t valid. Enter your email below for a new one.',
  'link-expired': 'That link has expired — they last 15 minutes. Enter your email for a new one.',
  'server-error': 'Something went wrong signing you in. Try again below.',
}

export default function OkrAllyClient() {
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
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const isAdmin = !!me?.user?.isAdmin
  const isOrgAdmin = !!me?.user?.isOrgAdmin

  // Register the minimal service worker — the last PWA-installability criterion
  // (Chrome/Edge, desktop + Android). It does no caching.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/okr-ally/sw.js', { scope: '/okr-ally' }).catch(() => {})
    }
  }, [])

  const refreshStatus = useCallback(() => {
    fetch('/api/okr-ally/status')
      .then((r) => r.json())
      .then((s: Status) => setStatus(s))
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
    const err = params.get('error')
    if (err) {
      setVerifyError(VERIFY_ERROR[err] || VERIFY_ERROR['invalid-link'])
      window.history.replaceState({}, '', '/okr-ally')
    }
    ;(async () => {
      try {
        const m: Me = await (await fetch('/api/okr-ally/me')).json()
        setMe(m)
        if (!m.authenticated) {
          setPhase(err ? 'email' : 'intro')
          return
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
  }, [refreshStatus])

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
        <TopBar />
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
      <TopBar
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
                {status?.creditsRemaining ?? 0} credit{(status?.creditsRemaining ?? 0) === 1 ? '' : 's'}
                {status && status.orgCredits.length > 0 && (
                  <span style={{ color: T.emeraldDark }}>
                    {' '}
                    ({status.orgCredits.reduce((s, o) => s + o.credits, 0)} company)
                  </span>
                )}
              </span>
              <a href="/api/okr-ally/logout" style={{ color: T.emeraldDark, fontWeight: 600 }}>
                Sign out
              </a>
            </>
          ) : null
        }
      />

      <InstallAppBanner />

      {me?.authenticated && !showingReport && !showingAdmin && (
        <TabBar tab={activeTab} onChange={setTab} isAdmin={isAdmin} isOrgAdmin={isOrgAdmin} />
      )}

      {phase === 'signedout' && (
        <SignedOut
          onContinue={() => {
            window.history.replaceState({}, '', '/okr-ally')
            setPhase('intro')
          }}
        />
      )}
      {phase === 'intro' && <Intro onStart={() => setPhase('email')} />}
      {phase === 'email' && <EmailGate error={verifyError} />}

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

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'ally' && resumeOffer && (
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

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'ally' && !resumeOffer && (
        <StepForm
          initialForm={draft}
          onSubmitted={(r) => {
            setReportId(r.submissionId)
            refreshStatus()
          }}
        />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'pricing' && (
        <PricingTab onBalanceChange={(n) => setStatus((s) => (s ? { ...s, creditsRemaining: n } : s))} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'history' && (
        <HistoryTab onOpen={(id) => setReportId(id)} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'help' && <HelpTab />}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'company' && isOrgAdmin && (
        <OrgAdminScreen onPoolChange={() => refreshStatus()} />
      )}

      {phase === 'app' && !showingReport && !showingAdmin && activeTab === 'admin' && isAdmin && (
        <AdminList onOpen={(id) => setAdminId(id)} />
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

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="OKR Ally" width={84} height={84} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 24, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        Hi, I&apos;m Ally.
      </h1>
      <p style={{ color: T.muted, marginTop: 12, lineHeight: 1.6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        Send me the Objective and Key Results you wrote, and I&apos;ll tell you honestly where they&apos;re strong,
        where they&apos;re not, score them against a clear rubric, and rewrite them two ways.
      </p>
      <p style={{ color: T.muted, marginTop: 14, fontSize: 13.5, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        I&apos;m built by Subramaniam P G, who has spent over 40 years helping leadership teams turn strategy into
        goals their people can actually execute. He&apos;s authored 7 books, including <em>The Language of OKRs</em>,
        and is a certified OKR and executive coach who has guided over 100 companies. I bring his rubric and his ear
        for a sharp goal to whatever you send me.
      </p>
      <div style={{ marginTop: 22 }}>
        <Btn onClick={onStart}>Say hi to Ally</Btn>
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

function SignedOut({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="OKR Ally" width={72} height={72} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        You&apos;re signed out.
      </h1>
      <p style={{ color: T.muted, marginTop: 10, fontSize: 13.5, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        Your reviews and credits are saved — sign back in any time with your email.
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
        <ShareCard />
      </div>
      <div style={{ marginTop: 20 }}>
        <Btn variant="ghost" onClick={onContinue}>
          Back to the start
        </Btn>
      </div>
    </div>
  )
}

function EmailGate({ error }: { error: string | null }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  async function send() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalErr('That doesn’t look like an email address.')
      return
    }
    setBusy(true)
    setLocalErr(null)
    try {
      await fetch('/api/okr-ally/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setLocalErr('Could not send the link. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <>
        <AllyRow>
          Check your inbox — I&apos;ve sent a sign-in link to <strong>{email}</strong>. It works once and expires in 15
          minutes. Come back here after you click it.
        </AllyRow>
        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 8 }}>
          Didn&apos;t get it? Check your spam or junk folder, or wait a minute and try again.
        </p>
      </>
    )
  }

  return (
    <>
      <AllyRow>
        Before we start, what&apos;s your email? I&apos;ll send a one-time sign-in link — no password. It&apos;s how
        your reviews and credits stay with you.
      </AllyRow>
      {(error || localErr) && (
        <div className="mb-3 text-sm rounded-lg px-4 py-3" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
          {localErr || error}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <Field value={email} onChange={setEmail} placeholder="you@company.com" autoFocus />
        </div>
        <Btn onClick={send} disabled={busy}>
          {busy ? 'Sending…' : 'Send link'}
        </Btn>
      </div>
    </>
  )
}
