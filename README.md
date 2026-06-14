# ApplyTrack

AI destekli iş başvuru takip platformu. Kullanıcı bir iş ilanı linkini yapıştırır, ApplyTrack
şirket/pozisyon/açıklamayı otomatik çeker; CV'sini yükler, AI uyum skoru ve öneriler verir;
başvurularını Beklemede / Mülakat / Teklif / Reddedildi kanban'ında takip eder; mülakat öncesi
AI ile sohbet ederek hazırlanır.

## Tech Stack

- **Next.js 14** (App Router, TypeScript) + **Tailwind CSS**
- **Supabase** — veritabanı + auth (email & GitHub OAuth)
- **Anthropic Claude API** — AI chat ve CV uyum skoru
- **Lemon Squeezy** — ödeme/abonelik
- **Vercel** — deploy

## Kurulum

```bash
npm install
cp .env.example .env.local   # ardından .env.local'i gerçek değerlerle doldur
npm run dev
```

`http://localhost:3000` adresini aç.

> **Not:** `.env.local` doldurulmadan da uygulama açılır. Supabase/Claude/Lemon Squeezy
> anahtarları eksikse ilgili API rotaları (AI, ödeme) çökme yerine `503` ile
> "yapılandırılmadı" hatası döner. Auth/DB işlemleri Supabase projesi kurulana kadar hata
> verir — bu beklenen bir durumdur.

## Supabase Kurulumu

1. [supabase.com](https://supabase.com) üzerinde yeni proje oluştur.
2. Project Settings > API'den `Project URL`, `anon key` ve `service_role key`'i al,
   `.env.local`'e yaz.
3. SQL Editor'de sırasıyla şu migration dosyalarını çalıştır:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
4. Authentication > Providers'dan Email ve GitHub OAuth'u etkinleştir
   (GitHub OAuth callback URL: `<APP_URL>/auth/callback`).

## Klasör Yapısı & Sorumluluk Haritası

| Klasör | Kim? | Açıklama |
|---|---|---|
| `app/api/**` | Sadettin | Backend API rotaları |
| `lib/**`, `utils/**` | Sadettin | Supabase, AI, ödeme, plan, yardımcı kodlar |
| `supabase/**` | Sadettin | DB migration'ları |
| `middleware.ts`, `.env*`, root config dosyaları | Sadettin | |
| `app/**/page.tsx` (API hariç) | Taha | Sayfalar |
| `components/**` | Taha | UI bileşenleri |

Detaylar için [CONTRIBUTING.md](./CONTRIBUTING.md)'ye bak.

## Fiyatlandırma

| Plan | Fiyat | İçerik |
|---|---|---|
| Free | $0/ay | 10 başvuru, 10 AI soru/ay, temel kanban |
| Pro | $9/ay | Sınırsız başvuru, 200 AI soru/ay, CV uyum skoru, CV otomatik uyarlama |
| Career Coach | $29/ay | Pro + sınırsız AI, şirket içgörüsü, maaş müzakere koçu, rakip analizi |

Plan limitleri/özellikleri `lib/plans.ts` içinde tanımlıdır.
