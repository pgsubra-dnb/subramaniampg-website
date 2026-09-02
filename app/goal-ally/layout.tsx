import type { Metadata, Viewport } from 'next'
import { tokens } from '@/lib/okrAllyTokens'

export const metadata: Metadata = {
  title: 'Goal Ally — Powered by AI',
  description:
    'Goal Ally reviews the Goal and Sub-goals you wrote, scores them against a clear rubric, and rewrites them two ways. Powered by AI.',
  robots: { index: false, follow: false },
  applicationName: 'Goal Ally',
  manifest: '/goal-ally/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Goal Ally', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/goal-ally/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/goal-ally/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/goal-ally/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/goal-ally/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: tokens.primary,
}

export default function GoalAllyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Catch `beforeinstallprompt` even if Chrome fires it before React has
          hydrated (common for repeat visitors). InstallAppBanner reads this. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__okrDeferredInstall=e;});",
        }}
      />
      {children}
    </>
  )
}
