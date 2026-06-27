# Wisparkr — Proje Durum Haritası

## Genel Bilgi
- **Uygulama adı:** Wisparkr
- **Repo:** github.com/sadettingoksu-dev/wisparkr-applytrack (master branch)
- **Canlı site:** wisparkr.com (Vercel — Hobby plan)
- **Supabase proje:** vuvemrdnriljghbssqse.supabase.co
- **Vercel hesabı:** sadettingoksu-dev
- **Mail gönderimi:** Resend (smtp.resend.com), domain wisparkr.com doğrulanmış, Resend hesabı sadettingk.6

---

## Tamamlananlar (kronolojik, en yeni en üstte)

### Büyük UI + Monetizasyon revizyonu (beyaz+mor tema, 5 gün deneme, plan iptal, şablon galerisi)
- [x] **Ücretsiz plan → 5 günlük deneme:** `profiles.trial_ends_at` (default now()+5g) + `plan_started_at` (mig `0012_trial.sql`). `lib/plans.ts` `isTrialActive`/`getEffectivePlanId`/`getEffectivePlan` (deneme = Pro seviyesi tam erişim, süre dolunca free/kilitli). `requireAuth` (lib/apiAuth) artık `profile.plan`'ı efektif plana çevirir + `realPlanId` taşır (link kalıcılığı gerçek plana bağlı). Paylaşım linki: TTL 5 gün, deneme linki tam **deneme bitiminde** sona erer; Pro+Career Coach kalıcı (public `/cv/[token]` owner efektif planına bakar).
- [x] **Plan iptal:** `app/api/billing/cancel` (LemonSqueezy `cancelSubscription` + yerel `status=cancelled, ends_at=renews_at`), `components/billing/CancelButton`. Billing sayfası: plan başlangıç tarihi, yenileme/iptal tarihi, **deneme gün sayacı**.
- [x] **Giriş/Kayıt → otomatik dashboard:** signup OTP başarısı oturumu koruyup `/dashboard`'a; middleware oturum açık kullanıcıyı `/login`,`/signup`'tan panele yönlendirir (plan param'ı korur).
- [x] **CV şablon galerisi (cvmaker tarzı):** `lib/cvTemplates.ts` (istemci-güvenli id'ler — pdfkit'i client bundle'dan ayırır), cvPdf 6 tema (classic/modern/minimal/elegant/professional/creative), `TemplatePicker` görsel wireframe thumbnail grid.
- [x] **Tüm site beyaz + açık mor tema:** ~45 dosya (ortak `ui/*` + `layout/*` + tüm sayfalar) koyu→beyaz, amber→mor. Gradyan yıldız logo geri (`/logo.png`). AuthShowcase düzeni korunup açık-mor'a uyarlandı.
- [x] **Sidebar:** logoya basınca daral/genişle (`localStorage`), Analitik nav kaldırıldı.
- [x] **Analitik → Dashboard'a gömüldü** (`/analytics` → `/dashboard` redirect), Takvim ayrı.
- [x] **Her sayfada "i" bilgi butonu:** `components/ui/PageInfo` + `i18n.pageInfo.*` (tr/en).
- [x] **DB:** `0012_trial.sql` uygulandı (0009/0010/0011 ile birlikte) — 2026-06-27 REST probe ile doğrulandı.
- **Durum: Canlıda, migration'lar uygulandı.**


### Yapılandırılmış CV Oluşturucu + Akıllı Paylaşılabilir Link (Faz A + F)
- [x] **CV Oluşturucu (Faz A):** `profiles.cv_data` (jsonb) yapılandırılmış CV; `lib/cv.ts` (`CvData` Zod + `flattenCvData`→`cv_text` türetimi, mevcut 7 AI tüketicisi bozulmaz); `/cv-builder` bölüm bölüm form + canlı önizleme (`CvPreview`) + kaydet; `/api/cv/builder` GET/PUT; `/api/cv/pdf` gerçek yerleşimli PDF (3 şablon, `lib/cvPdf.ts`); sidebar "CV Oluştur" + onboarding.
- [x] **Akıllı Paylaşılabilir Link (Faz F — monetizasyon):** `cv_shares` tablosu (token + dondurulmuş snapshot + expires_at + görüntülenme). Public `/cv/[token]` owner planına **canlı** bakar (cron yok): free **7 gün**, Pro **kalıcı**; Pro'ya geçince tüm linkler **anında canlanır**. Pasif durum profesyonel (`ExpiredCv`, itibar korunur). `/cv/[token]/pdf` public indirme. `/api/cv/share` POST/GET + `[id]` PATCH/DELETE; özel slug Pro+. 7 gün ücretsiz indirme penceresi (`cv_trial_started_at`). `SharePanel` (oluştur + Linklerim). **Google Drive/Dropbox bilinçli eklenmedi** (paywall'ı bypass eder).
- [x] Commit'ler: c53b943 (Faz A), fb47555 (Faz F)
- [x] **DB:** `0010_cv_data.sql` + `0011_cv_shares.sql` uygulandı (2026-06-27 doğrulandı). Builder kaydetme + link oluşturma DB tarafı hazır.
- **Durum: Kod canlıda, migration'lar uygulandı. Backlog: Faz B (builder AI), C (PDF içe aktar), D (ATS skoru).**

### claude.ai tarzı hesap menüsü + Flowcase'den ilhamla CV/AI paketi (5 faz)
- [x] **Hesap menüsü (`UserMenu` + `NavbarAuth`):** avatar+isim+plan rozeti; açılır menü (Ayarlar, Planı yükselt, Uygulama & eklentiler, Yardım, **Google ile hesap değiştir**, **Çıkış**). Sidebar altı, landing navbar ve `/pricing` artık oturumu tanıyor. Çıkış → `/` (web'e dönüş). Giriş yapan kullanıcı `/login` & `/signup`'tan dashboard'a yönlendirilir.
- [x] **AI Ön Yazı (cover letter):** başvuruya özel Türkçe ön yazı (`generateCoverLetter`, `/api/ai/cover-letter`, `CoverLetterCard`). Pro+ özelliği.
- [x] **AI CV Cila:** master CV'yi EN/TR çevir, dil-yazım düzelt, tek sayfaya kısalt (`polishCv`, `/api/ai/polish-cv`, `CvPolishCard` → Ayarlar). `/api/cv/upload` PATCH ile "master CV olarak kaydet". Pro+.
- [x] **Beceri açığı (skills gap):** ilan vs CV becerileri var/eksik (`analyzeSkillsGap`, `/api/ai/skills-gap`, `SkillsGapCard`). Tüm planlara açık, fit_score sayacıyla metered.
- [x] **Çoklu CV/ön yazı PDF şablonu + Belgelerim:** cv-pdf rotası `?type=cv|cover_letter&template=classic|modern|minimal`; `TemplatePicker`; `/documents` (Belgelerim) sayfası tüm hazır belgeleri tek yerden indirir.
- [x] Her faz ayrı commit, build geçince master'a push edildi (canlı). Commit'ler: 3e5a00a, 14b8cf9, e7fb659, a11bd63, d901941
- [x] **DB ön koşulu:** `0009_cv_ai_suite.sql` uygulandı (applications.cover_letter_text/skills_gap, ai_usage.cover_letters_used/cv_polish_used) + 0006-0008 de uygulanmış — 2026-06-27 doğrulandı. Ön yazı/skills gap sonuçları persist eder.
- **Durum: Kod canlıda, migration'lar uygulandı.**

### Navbar düzeni (masaüstü + mobil)
- [x] Logo / menü / giriş-avatar grid ile dengeli dağıtıldı (`col-start-1/2/3`)
- [x] Mobilde menü `hidden` olduğunda CSS grid auto-placement'ın giriş linkini kaydırması düzeltildi
- [x] Navbar kenardan boşluklu, yüzen kart görünümüne çevrildi (`mx-4 mt-4 rounded-[2rem]`)
- [x] Geniş ekranlarda içerik artık `max-w-6xl` ile ortalanmıyor, karta göre hizalı (büyük boşluk sorunu giderildi)
- [x] Hem `app/page.tsx` (landing) hem `components/layout/Navbar.tsx` (paylaşılan) güncellendi
- Commit'ler: a043d6b, 1d76fb3

### Signup / Email OTP akışı (büyük debug oturumu)
- [x] **Kök neden bulundu:** Supabase'in varsayılan "Confirm signup" mail şablonu sadece link içeriyordu, `{{ .Token }}` (kod) hiç yoktu → kullanıcılar kod hiç almıyordu
- [x] Şablon düzenlemek için **custom SMTP zorunlu** olduğu öğrenildi (Supabase kısıtlaması — Pro'ya geçmeden default mail servisiyle şablon değiştirilemiyor)
- [x] **Resend** ile ücretsiz SMTP kuruldu: domain doğrulandı, API key oluşturuldu, Supabase → Authentication → Emails → SMTP Settings'e bağlandı (host `smtp.resend.com`, port 465, user `resend`, sender `info@wisparkr.com`)
- [x] "Confirm signup" şablonuna `{{ .Token }}` eklendi (Source artık açık), bir defa şablona yanlışlıkla açıklama metni karışmıştı, temizlendi
- [x] Email OTP Length 6 haneye ayarlandı (Supabase Dashboard), frontend (`app/(auth)/signup/page.tsx`) buna göre 6 hane bekleyecek şekilde senkron tutuldu (8 haneye çıkarıp sonra 6'ya geri alma denemesi oldu, son hal: 6)
- [x] **Bulunan ek bug:** Aynı email ile tekrar denenince (özellikle zaten Google ile kayıtlı/onaylı hesaplarda) Supabase güvenlik nedeniyle hata DÖNMÜYOR, mail de göndermiyor — sessizce "başarılı" gibi görünüyordu. `data.user.identities.length === 0` kontrolü eklenip kullanıcıya "Bu e-postayla zaten hesabın var, Google ile devam et'i dene" hatası gösterildi
- [x] PKCE + link tabanlı onayın cihaz/tarayıcı bağımlılığı olduğu (çapraz cihazda çalışmayacağı) tespit edildi, bu yüzden OTP kod girişi (cihaz bağımsız) yöntemi tercih edildi, link de e-postada duruyor (alternatif)
- Commit'ler: c9122db (8 haneye geçiş, sonradan gereksiz), 3b532a0 (6 haneye geri dönüş), 32b97a2 (duplicate email hatası)
- **Durum: Çalışıyor, test edildi, canlıda.**

### Daha önceki oturumlardan (bkz. önceki commit geçmişi)
- [x] Landing page koyu tema, hero, app demo animasyonu, dashboard/pricing siyah+amber tema
- [x] Free plan limiti 5 başvuru, Google ile giriş butonu, "Plana Geç" akışı kayıt sonrası ödemeye yönlendiriyor
- [x] Vercel deploy + Hostinger DNS → wisparkr.com

---

## Yapılacaklar (Sıradaki)

### Öncelikli
- [x] **Migrationlar uygulandı (DOĞRULANDI 2026-06-27):** `0006`–`0012` arası TÜM migration'lar uzak Supabase'de mevcut. Service-role ile REST üzerinden her migration'ın kolon/tabloları tek tek yoklanarak teyit edildi (tailored_cv_text, mock_interviews, cover_letter_text, skills_gap, cv_data, cv_shares, trial_ends_at, plan_started_at vb. hepsi VAR). Şema güncel; CV builder/paylaşım/ön yazı/deneme DB tarafı hazır.
- [ ] **Hesap menüsü + CV/AI özellikleri canlı testi:** ön yazı üret/indir, CV cila, skills gap, Belgelerim PDF şablonları (DB hazır, fonksiyonel uçtan uca test kaldı)
- [ ] **Google OAuth uçtan uca test:** Redirect zinciri doğru görünüyor (Google login sayfasına kadar hatasız gidiyor, test ettik) ama gerçek bir Google hesabıyla tam giriş hiç denenmedi
- [ ] **NEXT_PUBLIC_APP_URL** Vercel'de wisparkr.com olarak güncelle (şu an localhost olabilir) — LemonSqueezy checkout redirect'i bunu kullanıyor (`lib/lemonsqueezy.ts:30`)

### Ödeme / Gelir
- [ ] LemonSqueezy entegrasyonu (API key, store ID, variant ID'ler boş)
- [ ] Vercel Pro'ya geç (ticari kullanım için $20/ay) — ekiple karar verilecek

### Supabase
- [x] Migration 0006-0012 çalıştırıldı/doğrulandı (2026-06-27, REST probe ile)

### Diğer
- [ ] Mobil görünüm — navbar düzeltildi ama dashboard/diğer sayfalar test edilmedi
- [ ] Fiyatlandırma + Özellikler bölümlerine ek içerik tartışıldı (yıllık/aylık toggle, FAQ, ekran görüntüleri) — henüz uygulanmadı
- [ ] Navbar'dan "Fiyatlandırma"/"Özellikler" linklerini kaldırıp yerine kayan yazı (marquee) koyma isteği vardı — ertelendi, henüz başlanmadı
- [ ] Resend → "Yeniden gönder" (resend OTP) butonuna loading/disabled state eklenmedi (öncelik verilmedi, ana sorun çözülünce ertelendi)

---

## Önemli Dosyalar
| Dosya | Ne işe yarar |
|-------|-------------|
| `lib/plans.ts` | Free/Pro/CareerCoach plan limitleri |
| `app/page.tsx` | Landing page + kendi navbar'ı |
| `components/layout/Navbar.tsx` | Paylaşılan navbar (dashboard vb.) |
| `components/landing/AppDemo.tsx` | Hero animasyonu |
| `app/(auth)/signup/page.tsx` | Kayıt sayfası + OTP doğrulama ekranı |
| `app/(auth)/login/page.tsx` | Giriş sayfası |
| `app/(auth)/auth/callback/route.ts` | OAuth/email confirm code exchange |
| `lib/supabase/client.ts` | Browser Supabase client (PKCE, cookie tabanlı) |
| `lib/supabase/middleware.ts` | Protected route kontrolü (/dashboard vb.) |
| `components/layout/UserMenu.tsx` | claude.ai tarzı hesap açılır menüsü (sidebar + navbar) |
| `components/layout/NavbarAuth.tsx` | Public navbar'da oturum-duyarlı giriş/menü |
| `lib/anthropic.ts` | Tüm AI fonksiyonları (tailorCv, generateCoverLetter, polishCv, analyzeSkillsGap, mock mülakat) |
| `app/api/ai/*` | AI rotaları (cover-letter, polish-cv, skills-gap, tailor-cv, fit-score, chat) |
| `components/cv/*` | CV kartları (CoverLetterCard, SkillsGapCard, CvTailorCard, TemplatePicker) |
| `app/(dashboard)/documents/page.tsx` | "Belgelerim" — hazır CV/ön yazı PDF indirme |
| `app/pricing/page.tsx` | Fiyatlandırma sayfası |
| `.env.local` | API anahtarları (Supabase, Anthropic, LemonSqueezy) |

## Ortam Değişkenleri (Vercel'de girilmesi gerekenler)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` = claude-haiku-4-5-20251001
- `NEXT_PUBLIC_APP_URL` = https://wisparkr.com ← güncellenmeli!
- `LEMONSQUEEZY_*` = henüz boş

## Teknik Notlar / Öğrenilenler
- `@supabase/ssr`'in `createBrowserClient`'ı `flowType: "pkce"`'yi sabit kodluyor, override edilemiyor — bu yüzden email confirmation linki sadece kaydın başlatıldığı tarayıcıda çalışır (cross-device/cross-app linkler exchangeCodeForSession'da patlar). OTP kod girişi bu sorunu yaşamaz.
- Supabase default mail servisini kullanırken (custom SMTP yokken) email template'lerinin **Source** görünümü kilitli — düzenlemek için ya Pro plan ya custom SMTP gerekiyor.
- `supabase.auth.signUp()` zaten var olan bir email için hata DÖNDÜRMEZ (enumeration koruması); `data.user.identities.length === 0` kontrolüyle ayırt edilebilir.
- Test/debug için tek kullanımlık kullanıcılar `supabase.auth.admin.createUser` / `generateLink` / `deleteUser` ile servis role key kullanılarak production Supabase projesinde oluşturulup silindi (READMEMAP'teki proje tek, dev/prod ayrımı yok — dikkat).
