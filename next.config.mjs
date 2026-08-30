/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // The OKR Ally service worker is served from /okr-ally/ but must control
        // the /okr-ally page (and its start_url), so it needs a broader scope
        // than its own path — granted via Service-Worker-Allowed. no-cache so
        // an updated worker is picked up promptly.
        source: '/okr-ally/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/okr-ally' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
};

export default nextConfig;
