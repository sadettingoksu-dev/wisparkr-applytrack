# Ekip Çalışma Rehberi (Wisparkr)

İki kişilik ekip için anlaşılan geliştirme akışı. **Özet kural: `master` = CANLI.**
master'a giren her şey saniyeler içinde www.wisparkr.com'a deploy olur. O yüzden
master'a doğrudan push **yoktur** — her şey branch + PR + onay ile gider.

## Akış: GitHub Flow

```
master (korumalı = canlı)
   ├── feature/sadettin-<ozellik>   → PR → onay → merge → otomatik canlı
   └── feature/taha-<ozellik>       → PR → onay → merge → otomatik canlı
```

**İşe başlarken:**
```bash
git checkout master
git pull origin master
npm install            # package.json değiştiyse
git checkout -b feature/<isim>-<ozellik>   # örn. feature/taha-takvim-filtreleri
npm run dev            # http://localhost:3000
```

**İş bittiğinde:**
```bash
git add -A
git commit -m "takvim filtreleri eklendi"
git push origin feature/<isim>-<ozellik>
```
Sonra GitHub'da **`master`'a PR aç** (main değil — bu repo `master` kullanır).

## PR Kuralları

- Her PR **tek bir özelliğe** odaklı olsun (küçük PR = kolay review).
- PR açıklamasını şablona göre Türkçe doldur (ne/neden/nasıl test ettim).
- **CI kontrolü** (tsc + lint) otomatik çalışır; kırmızıysa merge edilemez.
- **Diğer kişi PR'ı inceleyip onaylamadan merge yok.** İstersen PR'da `/code-review`
  çalıştırıp Claude'a da denetlet.
- Merge sonrası branch'i sil.

## İş Bölümü: Özellik Bazında Sahiplik

Her kişi bir özelliği **baştan sona** (frontend + gerekiyorsa backend) üstlenir.
Böylece paralel çalışır, aynı dosyada az çakışırsınız.

- Bir özelliğe başlamadan önce "ben bunu alıyorum" diye haber ver (issue/board/mesaj).
- Mümkün olduğunca farklı dosya/sayfalarda çalışın.

### Ortak çekirdek dosyalar — önce konuşun
Bunlara iki kişi de dokunabilir ama **çakışma riski yüksek**, önce koordine olun:
- `lib/plans.ts` — plan/fiyat/özellik tanımları
- `lib/types.ts`, `utils/constants.ts` — ortak tipler ve sabitler
- `lib/i18n.ts` — çok dilli metinler (5 dil; aynı anahtarlar her dilde olmalı)
- `middleware.ts`, `supabase/**` — auth ve şema
- `package.json` — yeni paket eklemeden önce haber ver

## Veritabanı / Ortam

- **Şema değişikliği** = `supabase/migrations/` altına yeni numaralı SQL dosyası ekle.
  Migration'lar deploy ile **otomatik uygulanmaz** — Supabase SQL Editor'de elle
  çalıştırılır. PR açıklamasına bunu not düş.
- Test için **ayrı bir dev Supabase projesi** kullanıyoruz; gerçek kullanıcı verisine
  dokunmayın. (Prod Supabase yalnızca canlı.)
- `.env*` dosyaları repoda yok; anahtarları kimseyle paylaşmayın, commit etmeyin.

## Deploy

- `master`'a merge = otomatik production deploy (www.wisparkr.com). Ekstra komut yok.
- Her PR'a Vercel otomatik bir **preview URL** verir — merge'den önce orada test edin.
- Lokalden `vercel --prod` **ÇALIŞTIRMAYIN** (yanlış projeye gider).

## Renk Paleti

| Renk | Tailwind | Kullanım |
|---|---|---|
| Ana mor (#6D5FD8) | `purple-600` | Butonlar, vurgular, aktif durum |
| Açık mor (#EEF0FF) | `purple-50` | Kart arka planları, badge'ler |
| Koyu metin (#1E293B) | `slate-800` | Başlıklar |
| Gri metin (#64748B) | `slate-500` | Açıklamalar |
| Yeşil (#1B7A5E) | `emerald-700` | Başarı, onay |
| Kırmızı (#E24B4A) | `red-500` | Hata, reddedildi |

## Bir Şeyi Bozdun mu?

```bash
git status          # ne değişti gör
git restore .       # kaydedilmemiş değişiklikleri geri al
git checkout master # temiz master'a dön
```
master'a hiçbir şey doğrudan gitmediği için canlı güvende. Takılırsan diğer kişiye sor.
