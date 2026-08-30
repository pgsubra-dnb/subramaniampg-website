import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'OKR Ally — Powered by AI',
  description:
    'OKR Ally reviews the Objective and Key Results you wrote, scores them against a clear rubric, and rewrites them two ways. Powered by AI.',
  robots: { index: false, follow: false },
  applicationName: 'OKR Ally',
  // Home-screen install: the manifest drives Android/Chrome; the apple-touch-icon
  // is what iOS Safari uses (iOS ignores manifest icons entirely).
  manifest: '/okr-ally/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'OKR Ally', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/okr-ally/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/okr-ally/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/okr-ally/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/okr-ally/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#1D9E75',
}

export default function OkrAllyLayout({ children }: { children: React.ReactNode }) {
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
