# Wisparkr — Kalite & Gelecek Yol Haritası

> Bu belge, MVP'den **en kaliteli, ölçeklenebilir ve gelir getiren** ürüne geçiş için
> yapılması gerekenleri fazlara böler. Güncel durum için `READMEMAP.md`, kurulum için
> `SETUP.md` kaynaktır. Bu dosya "bundan sonra ne?" sorusunun cevabıdır.
>
> Son güncelleme: 2026-06-26

---

## 0. Şu Anki Durum (özet)

- **MVP ≈ %90 hazır.** Çekirdek (auth, dashboard, başvurular, kanban, CV builder, AI özellikleri,
  paylaşım linkleri, 5 gün deneme, ödeme) **canlıda ve çalışıyor**.
- Bugün kapatılan iki büyük boşluk: **LemonSqueezy ödeme entegrasyonu** (uçtan uca doğrulandı)
  ve **eksik DB migration'ları** (0009–0012 uygulandı).
- Kalan ~%10: gerçek para tahsilatına geçiş (LS onayı + live key), test (Google OAuth, mobil),
  ve UX parlatma.

---

## FAZ 1 — Canlıya Tam Geçiş (KRİTİK · 1–2 hafta)

> Amaç: gerçek kullanıcıların kaydolup **gerçek para** ödeyebilmesi.

- [ ] **LemonSqueezy hesap onayı** bekle → onaylanınca **canlı (live) API key** oluştur,
      Vercel'deki `LEMONSQUEEZY_API_KEY`'i onunla değiştir, redeploy. (Şu an **test modunda**.)
- [ ] **`NEXT_PUBLIC_APP_URL`** Vercel'de kesin `https://www.wisparkr.com` olmalı
      (ödeme dönüş adresi bunu kullanıyor — `lib/lemonsqueezy.ts`). Bir kez yanlış adrese (404) düşmüştü.
- [ ] **Google OAuth** gerçek bir Google hesabıyla uçtan uca test (hiç tam denenmedi).
- [ ] **Mobil görünüm** — dashboard, başvurular, CV builder, billing mobilde test + düzelt.
- [ ] **Test alımlarını temizle** — LemonSqueezy'deki test abonelikleri iptal et.
- [ ] **Açığa çıkan API anahtarlarını döndür (rotate):** kurulum sırasında sohbette görünen
      LemonSqueezy/Supabase/Anthropic anahtarlarını yenile, eskilerini iptal et.

### Migration disiplini (kök sebep düzeltmesi)
- [ ] **Migration'lar deploy'da OTOMATİK uygulanmıyor** — bugünkü tüm "sessiz bozuk özellik"
      sorununun sebebi buydu. Çözüm seçenekleri:
  - Supabase CLI ile `supabase db push` adımını deploy akışına ekle, **veya**
  - Her şema değişikliğinde "SQL Editor'de migration'ı çalıştır" adımını bir **kontrol listesine** bağla.
- [ ] `types/database.types.ts` şu an **placeholder** — gerçek tiplerle değiştir:
      `npx supabase gen types typescript --project-id vuvemrdnriljghbssqse > types/database.types.ts`

---

## FAZ 2 — Kalite & Güven (2–4 hafta)

> Amaç: ürünün "ciddi/güvenilir" hissettirmesi; sorunları kullanıcıdan önce görmek.

### Gözlemlenebilirlik
- [ ] **Hata izleme:** Sentry (veya benzeri) — frontend + API route hataları otomatik yakalansın.
- [ ] **Ürün analitiği:** PostHog / Plausible — funnel (kayıt → ilk başvuru → upgrade) ölç.
- [ ] **Uptime/health check:** basit bir `/api/health` + dış izleme (BetterStack vb.).

### Performans
- [ ] Lighthouse audit (landing + dashboard) → hedef 90+ skor.
- [ ] Görsel optimizasyonu (`next/image`, AVIF/WebP), font yükleme stratejisi.
- [ ] Bundle analizi — büyük client component'leri ayır (özellikle CV builder, board).

### SEO & Erişilebilirlik
- [ ] Meta etiketleri, OpenGraph/Twitter kartları, `sitemap.xml`, `robots.txt`.
- [ ] Landing içeriği SEO için zenginleştir (başlık hiyerarşisi, alt metinler).
- [ ] a11y: klavye navigasyonu, odak halkaları, kontrast, `aria-*` denetimi.

### Test altyapısı
- [ ] Kritik akışlar için E2E (Playwright): kayıt → giriş → başvuru ekle → upgrade → webhook.
- [ ] `lib/` saf fonksiyonları için unit test (plans, cv flatten, i18n).
- [ ] CI'da `tsc --noEmit` + `next build` + testler (GitHub Actions).

### Yasal / uyum
- [ ] **Gizlilik Politikası + Kullanım Şartları** sayfaları (ödeme alan ürün için şart).
- [ ] **KVKK/GDPR:** veri silme talebi akışı, çerez bildirimi.
- [ ] LemonSqueezy "merchant of record" olduğu için vergi/fatura onlarda — yine de şartlarda belirt.

---

## FAZ 3 — Dönüşüm & Gelir Optimizasyonu (paralel, sürekli)

> Amaç: ziyaretçi → kayıt → **ödeyen müşteri** oranını artırmak.

- [ ] **Fiyatlandırma sayfası:** yıllık/aylık toggle (yıllık indirim), FAQ, ekran görüntüleri,
      özellik karşılaştırma tablosu.
- [ ] **Onboarding akışı:** ilk girişte yönlendirilmiş kurulum (CV ekle → ilk başvuru → eklenti).
      Dashboard'daki "Hoş Geldin" kartı bunun temeli; checklist'e dönüştür.
- [ ] **Upgrade CTA stratejisi:** dağınık "Planı yükselt" butonlarını sadeleştir —
      bağlamsal yerlerde tut (limit dolunca, premium özelliğe tıklayınca), her yere koyma.
- [ ] **Deneme bitiş e-postaları:** 2 gün kala + bitiş günü "Pro'ya geç" hatırlatması (Resend).
- [ ] **Win-back:** iptal eden / denemesi biten kullanıcıya geri kazanma e-postası.
- [ ] **Affiliate programı:** LemonSqueezy affiliate özelliği hazır — aç ve tanıt.
- [ ] **Sosyal kanıt:** kullanıcı sayısı, testimonial, "X başvuru takip edildi" sayaçları.

---

## FAZ 4 — Ürün Derinliği (yeni özellikler · 1–3 ay)

> Amaç: rakiplerden ayrışmak, kullanıcıyı elde tutmak (retention).

### AI derinleştirme
- [ ] **Mülakat hazırlık koçu** (mock interview'u genişlet: sektöre özel soru bankası, ses?).
- [ ] **Maaş müzakere koçu** (Career Coach planı vaadi — gerçek içerikle doldur).
- [ ] **Şirket içgörüleri** (Career Coach vaadi) + **rakip analizi**.
- [ ] **CV Builder AI (Faz B):** alan alan AI öneri; **PDF içe aktar (Faz C)**; **ATS skoru (Faz D)**.

### Chrome eklentisi
- [ ] Eklentiyi gerçek işlevsel hale getir (LinkedIn/iş ilanından tek tıkla başvuru kaydı).
      `extension_token` altyapısı hazır.

### Entegrasyonlar
- [ ] İş ilanı siteleri (LinkedIn, kariyer.net) parse iyileştirme.
- [ ] Takvim entegrasyonu (mülakat → Google Calendar).
- [ ] E-posta gelen kutusu entegrasyonu (inbound_emails altyapısı var — UI ile bağla).

---

## FAZ 5 — Ölçeklenme & Operasyon (gerektikçe)

- [ ] **Rate limiting** — AI rotalarına kötüye kullanım koruması (özellikle ücretsiz/deneme).
- [ ] **Caching** — pahalı AI sonuçlarını/şablonları önbellekle.
- [ ] **DB indeks & sorgu denetimi** — kullanıcı büyüdükçe.
- [ ] **Yedekleme & felaket kurtarma** planı (Supabase backup politikası).
- [ ] **Vercel Pro** ($20/ay) — ticari kullanım + analitik + daha yüksek limitler.
- [ ] **Müşteri desteği** akışı (yardım e-postası → Crisp/Intercom veya basit ticket).
- [ ] **Dev/Prod ayrımı** — şu an tek Supabase projesi (dev=prod, riskli). Ayrı staging kur.

---

## TEKNİK BORÇ & TUTARLILIK (sürekli)

- [x] Plan rozeti tutarlılığı: deneme = "Deneme" her yerde, sadece ödeyen Pro/Career Coach (2026-06-26).
- [x] Giriş yapmış kullanıcı ana sayfadan otomatik panele (2026-06-26).
- [ ] `types/database.types.ts` gerçek tiplerle değiştir (placeholder).
- [ ] Upgrade buton/CTA envanteri çıkar ve sadeleştir.
- [ ] i18n anahtar denetimi (kullanılmayan/eksik anahtarlar).
- [ ] Webhook **idempotency** — aynı olay iki kez gelirse tek kayıt (upsert var ama gözden geçir).
- [ ] Tutarlı hata gösterimi (toast/banner standardı).

---

## GÜVENLİK KONTROL LİSTESİ

- [ ] Tüm açığa çıkmış anahtarları döndür (LemonSqueezy, Supabase service role, Anthropic).
- [ ] Supabase **RLS politikalarını denetle** — her tablo sadece sahibine açık mı?
- [ ] `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucuda (asla `NEXT_PUBLIC_`).
- [ ] Webhook imza doğrulaması aktif (✅ var) + secret'lar Vercel'de.
- [ ] Bağımlılık güvenlik taraması (`npm audit`, Dependabot).
- [ ] CSP / güvenlik başlıkları (next.config headers).

---

## ÖNERİLEN ÖNCELİK SIRASI

1. **FAZ 1** (canlıya tam geçiş) — gerçek gelir için ön koşul.
2. **FAZ 2'den:** Sentry + yasal sayfalar + mobil — güven için minimum set.
3. **FAZ 3** (dönüşüm) — gelir geldikçe sürekli iyileştir.
4. **FAZ 4** (yeni özellikler) — ilk ödeyen kullanıcıların geri bildirimine göre önceliklendir.
5. **FAZ 5** (ölçeklenme) — kullanıcı sayısı arttıkça.

> **Altın kural:** Yeni özellik eklemeden önce FAZ 1 + FAZ 2'nin "güven" maddelerini bitir.
> İlk 10 ödeyen müşteri, hangi özelliğin gerçekten gerektiğini sana söyleyecek — ona göre yön ver.
