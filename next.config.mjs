/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // @react-pdf/renderer (yoga/wasm + fontkit) webpack ile paketlenince sorun
    // çıkarabiliyor; harici tutuluyor. pdf-parse de aynı şekilde.
    serverComponentsExternalPackages: ['pdf-parse', '@react-pdf/renderer'],
    // CV PDF motoru gömülü Roboto fontunu (Türkçe) çalışma anında fs ile okur;
    // Vercel serverless izleyicisi otomatik almadığı için font dosyalarını
    // ilgili rotaların bundle'ına açıkça dahil ediyoruz.
    outputFileTracingIncludes: {
      '/cv/[token]/pdf': ['./assets/fonts/**/*'],
      '/api/cv/pdf': ['./assets/fonts/**/*'],
    },
  },
  async headers() {
    // Güvenlik başlıkları (clickjacking, MIME-sniff, downgrade, kaynak kısıtı).
    // CSP bilinçli olarak makul-geçirgen: Next hidrasyonu inline script ister,
    // bazı kütüphaneler eval kullanır. Yine de framing, object/embed, base-uri
    // ele geçirme, form exfiltrasyonu ve bilinmeyen connect/img kaynakları
    // engellenir. Canlıda doğrulandıkça 'unsafe-inline'/'unsafe-eval' daraltılmalı.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lemonsqueezy.com",
      "frame-src 'self' https://*.lemonsqueezy.com https://accounts.google.com",
      "form-action 'self' https://*.lemonsqueezy.com",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            // Mülakat simülatörü mikrofon kullanır → microphone=(self).
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
