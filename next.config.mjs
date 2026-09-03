/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    // Both review surfaces register a service worker from `<base>/sw.js` that
    // must control the bare `<base>` page (and its manifest start_url), i.e. a
    // scope one level broader than the script's own directory. `Service-Worker-
    // Allowed` grants that; without it `register('<base>/sw.js', {scope:'<base>'})`
    // is rejected outright and the PWA never becomes installable. no-cache so an
    // updated worker is picked up promptly.
    const swHeaders = (base) => ({
      source: `${base}/sw.js`,
      headers: [
        { key: 'Service-Worker-Allowed', value: base },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
      ],
    })
    return [swHeaders('/okr-ally'), swHeaders('/goal-ally')]
  },
};

export default nextConfig;
