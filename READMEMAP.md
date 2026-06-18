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

### claude.ai tarzı hesap menüsü + Flowcase'den ilhamla CV/AI paketi (5 faz)
- [x] **Hesap menüsü (`UserMenu` + `NavbarAuth`):** avatar+isim+plan rozeti; açılır menü (Ayarlar, Planı yükselt, Uygulama & eklentiler, Yardım, **Google ile hesap değiştir**, **Çıkış**). Sidebar altı, landing navbar ve `/pricing` artık oturumu tanıyor. Çıkış → `/` (web'e dönüş). Giriş yapan kullanıcı `/login` & `/signup`'tan dashboard'a yönlendirilir.
- [x] **AI Ön Yazı (cover letter):** başvuruya özel Türkçe ön yazı (`generateCoverLetter`, `/api/ai/cover-letter`, `CoverLetterCard`). Pro+ özelliği.
- [x] **AI CV Cila:** master CV'yi EN/TR çevir, dil-yazım düzelt, tek sayfaya kısalt (`polishCv`, `/api/ai/polish-cv`, `CvPolishCard` → Ayarlar). `/api/cv/upload` PATCH ile "master CV olarak kaydet". Pro+.
- [x] **Beceri açığı (skills gap):** ilan vs CV becerileri var/eksik (`analyzeSkillsGap`, `/api/ai/skills-gap`, `SkillsGapCard`). Tüm planlara açık, fit_score sayacıyla metered.
- [x] **Çoklu CV/ön yazı PDF şablonu + Belgelerim:** cv-pdf rotası `?type=cv|cover_letter&template=classic|modern|minimal`; `TemplatePicker`; `/documents` (Belgelerim) sayfası tüm hazır belgeleri tek yerden indirir.
- [x] Her faz ayrı commit, build geçince master'a push edildi (canlı). Commit'ler: 3e5a00a, 14b8cf9, e7fb659, a11bd63, d901941
- [ ] **⚠️ DB ön koşulu:** `0009_cv_ai_suite.sql` Supabase'de ÇALIŞTIRILMALI (yeni kolonlar: applications.cover_letter_text/skills_gap, ai_usage.cover_letters_used/cv_polish_used). 0006-0008'in de uygulandığı doğrulanmalı — yoksa ön yazı/skills gap sonuçları kaydolmaz (oturum içinde görünür ama persist etmez).
- **Durum: Kod canlıda, migration 0009 bekliyor.**

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
- [ ] **⚠️ Migration `0009_cv_ai_suite.sql` çalıştır** (Supabase SQL editörü) + 0006/0007/0008'in uygulandığını doğrula — yeni AI özellikleri (ön yazı, skills gap, kullanım sayaçları) bu kolonlara bağlı.
- [ ] **Hesap menüsü + CV/AI özellikleri canlı testi** (migration sonrası): ön yazı üret/indir, CV cila, skills gap, Belgelerim PDF şablonları
- [ ] **Google OAuth uçtan uca test:** Redirect zinciri doğru görünüyor (Google login sayfasına kadar hatasız gidiyor, test ettik) ama gerçek bir Google hesabıyla tam giriş hiç denenmedi
- [ ] **NEXT_PUBLIC_APP_URL** Vercel'de wisparkr.com olarak güncelle (şu an localhost olabilir) — LemonSqueezy checkout redirect'i bunu kullanıyor (`lib/lemonsqueezy.ts:30`)

### Ödeme / Gelir
- [ ] LemonSqueezy entegrasyonu (API key, store ID, variant ID'ler boş)
- [ ] Vercel Pro'ya geç (ticari kullanım için $20/ay) — ekiple karar verilecek

### Supabase
- [ ] Migration 0006-0009 çalıştır/doğrula (CV optimizasyon, gerekli belgeler, mock mülakat, CV/AI paketi)

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
