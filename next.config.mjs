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
}

export default nextConfig
