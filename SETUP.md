# Kurulum (Klonla → Çalıştır)

Bu projeyi başka bir bilgisayarda sıfırdan çalıştırmak için adımlar.

## Gereksinimler
- **Node.js 20+** (öneri: 20 veya 22 LTS)
- **Git**
- npm (Node ile gelir)

## 1) Klonla
```bash
git clone https://github.com/sadettingoksu-dev/wisparkr-applytrack.git
cd wisparkr-applytrack
git checkout master
```

## 2) Bağımlılıkları kur
```bash
npm install
```

## 3) Ortam değişkenlerini ayarla (EN ÖNEMLİ ADIM)
Repo'da gizli anahtarlar **yoktur** (`.env.local` `.gitignore`'da). Proje çalışmaz, önce bunu doldurman gerekir.

```bash
# Şablonu kopyala
cp .env.example .env.local
```

Sonra `.env.local` içindeki tüm değerleri doldur. **Değerler proje sahibinde** — mevcut `.env.local` dosyasını güvenli bir kanaldan (parola yöneticisi, şifreli mesaj vb.) al; GitHub'a/sohbete koyma.

Doldurulması gereken anahtarlar:

| Değişken | Nereden | Zorunlu |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API (gizli) | ✅ |
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✅ (AI özellikleri) |
| `ANTHROPIC_MODEL` | — | ⬜ (boş bırakılabilir) |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy → Settings → API | ✅ (ödeme) |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy → Stores | ✅ |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy → Webhooks (max 40 karakter) | ✅ |
| `LEMONSQUEEZY_VARIANT_PRO` | Lemon Squeezy → Products → Variant | ✅ |
| `LEMONSQUEEZY_VARIANT_CAREER_COACH` | Lemon Squeezy → Products → Variant | ✅ |
| `NEXT_PUBLIC_APP_URL` | Lokal: `http://localhost:3000` | ✅ |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | (gelen e-posta entegrasyonu) | ⬜ opsiyonel |

> Not: Veritabanı (Supabase) **bulutta barınıyor ve tablolar zaten kurulu** — lokal veritabanı kurulumuna gerek yok. Sadece yukarıdaki Supabase anahtarları doğru olmalı. (Şema dosyaları `supabase/migrations/` altında.)

## 4) Çalıştır (geliştirme)
```bash
npm run dev
```
→ http://localhost:3000

## 5) Canlı yayın (production build testi)
```bash
npm run build
npm run start
```

## Notlar
- `master` dalı her zaman en güncel/temiz halidir.
- Anahtarlar test modundaysa (Lemon Squeezy) gerçek ödeme alınmaz; canlı için live mod anahtarları gerekir.
