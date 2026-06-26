/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfkit'],
    // pdfkit, standart fontların .afm metrik dosyalarını çalışma anında fs ile
    // okur; Vercel serverless izleyicisi bunları otomatik bundle'a almadığı için
    // PDF rotaları (CV indir / paylaşılan CV PDF) 500 veriyordu. Aşağıda bu
    // dosyaları ilgili rotaların bundle'ına açıkça dahil ediyoruz.
    outputFileTracingIncludes: {
      '/cv/[token]/pdf': ['./node_modules/pdfkit/js/data/**/*', './assets/fonts/**/*'],
      '/api/cv/pdf': ['./node_modules/pdfkit/js/data/**/*', './assets/fonts/**/*'],
    },
  },
}

export default nextConfig
