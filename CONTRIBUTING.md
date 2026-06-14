# Katkı Rehberi (Taha için)

## Günlük Rutin

**Sabah — çalışmaya başlarken:**
```bash
git checkout main
git pull origin main
npm install        # package.json değiştiyse
npm run dev
```
`http://localhost:3000` açılıyor mu kontrol et.

**Akşam — işi bitirirken:**
```bash
git add .
git commit -m "kanban board kartları eklendi"
git push origin feature/taha-<özellik-adı>
```
Sonra GitHub'da `main`'e PR aç.

## Branch Kuralları

- `main` korumalı — **doğrudan push yapma**.
- Kendi branch'in: `feature/taha-<özellik-adı>` (örn. `feature/taha-landing`, `feature/taha-kanban`).
- İş bitince PR aç, açıklamada ne değiştiğini Türkçe yaz.

## Dokunma / Dokunabilirsin

✅ **Dokunabilirsin:**
- `components/**`
- `app/**/page.tsx` (API rotaları hariç)
- `app/(dashboard)/layout.tsx` (sidebar/topbar görünümü)
- Tailwind class'ları, renkler, layout

❌ **Kesinlikle dokunma:**
- `app/api/**` — backend API
- `lib/**`, `utils/**` — yardımcı kodlar, Supabase/AI/ödeme bağlantıları
- `.env*` — API anahtarları
- `middleware.ts`, `supabase/**`
- `package.json`'a yeni paket eklemeden önce Sadettin'e sor

Bir şey çalışmıyorsa önce Sadettin'e sor, backend koduna kendiliğinden girme.

## Ortak Kontrat

Sayfalarda kullanacağın tipler ve sabitler:
- `lib/types.ts` — `Application`, `AiMessage`, `Profile` vb. tipler
- `utils/constants.ts` — kanban sütunları, durum etiketleri/renkleri
- `lib/plans.ts` — fiyatlandırma/plan bilgisi (pricing sayfası için)

Yeni bir tip/sabite ihtiyacın olursa Sadettin'den `lib/types.ts` veya
`utils/constants.ts`'e ekleme yapmasını iste.

## Renk Paleti

| Renk | Tailwind class | Kullanım |
|---|---|---|
| Ana mor (#6D5FD8) | `purple-600` | Butonlar, vurgular, aktif durum |
| Açık mor (#EEF0FF) | `purple-50` | Kart arka planları, badge'ler |
| Koyu metin (#1E293B) | `slate-800` | Başlıklar |
| Gri metin (#64748B) | `slate-500` | Açıklamalar |
| Yeşil (#1B7A5E) | `emerald-700` | Başarı, onay |
| Kırmızı (#E24B4A) | `red-500` | Hata, reddedildi |

## Commit Mesajı Örnekleri

```
git commit -m "landing page hero kısmı tamamlandı"
git commit -m "kanban board kartları eklendi"
git commit -m "dashboard metrik kartları düzenlendi"
```

Türkçe yazabilirsin, ne yaptığın anlaşılsın yeter.

## Bir Şeyi Bozdun mu?

Panikleme:
```bash
git status        # ne değişti gör
git checkout .     # son commit'e geri dön (kaydedilmemiş değişiklikler gider)
```
Hâlâ sorun varsa Sadettin'e ulaş.
