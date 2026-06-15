# ApplyTrack Yol Haritası

ApplyTrack, pasif bir "başvuru listesi"nden çıkıp kullanıcı için aktif iş yapan bir
**iş arama planlayıcısı + asistanı** olmayı hedefliyor. Aşağıdaki fazlar, mevcut
kanban/AI altyapısı üzerine kurularak bu hedefe ilerler.

## Durum (güncel)

- ✅ Supabase + Anthropic API key'leri `.env.local`'a girildi, DB şeması ve RLS
  policy'leri kuruldu, model `claude-haiku-4-5-20251001` olarak güncellendi.
- ✅ Faz 1 kodu tamamlandı: Dashboard "Yapılacaklar" listesi (`lib/planner.ts`),
  başvuru silme butonu, Google/GitHub OAuth butonları (login + signup).
- ✅ **Google OAuth kurulumu tamamlandı**: Google Cloud Console'da `applytrack`
  projesi, OAuth consent screen, Web application Client ID/Secret oluşturuldu;
  Supabase Authentication > Providers > Google'a girildi ve enable edildi.
- ✅ **GitHub OAuth kurulumu tamamlandı**: github.com/settings/developers'da
  ApplyTrack OAuth App oluşturuldu (callback:
  `https://vuvemrdnriljghbssqse.supabase.co/auth/v1/callback`), Client ID/Secret
  Supabase'e girildi ve enable edildi.
- ✅ OAuth test edildi, login akışı çalışıyor.
- ✅ **Takvim / zaman çizelgesi görünümü tamamlandı** (2026-06-15): `applications`
  tablosuna `interview_date` eklendi (migration `0003_add_interview_date.sql`),
  başvuru detayında mülakat tarihi girilebiliyor, `/calendar` sayfasında
  "Yaklaşan Mülakatlar" ve "Takip Hatırlatmaları" listeleniyor, planner görevleri
  mülakat tarihine göre önceliklendiriliyor. **Faz 1 tamamen bitti.**
- 🔄 **Faz 2 kod tarafı yazıldı ama beklemede** (2026-06-15): migration
  `0004_inbound_email_notifications.sql` (inbound_emails + notifications
  tabloları, Supabase'de çalıştırıldı), `lib/anthropic.ts` →
  `classifyInboundEmail()`, webhook `app/api/webhooks/inbound-email/route.ts`
  (Svix doğrulama), `app/api/notifications/route.ts`, `NotificationBell`
  component, `/settings`'te forwarding adresi kartı (`user_<id>@inbox.wisparkr.com`
  + Gmail kurulum rehberi) — hepsi hazır ve type-check geçiyor.
  **Bekleme sebebi**: Resend Inbound (mail alma) özelliği Pro plana ($20/ay)
  özel; ücretsiz alternatif (Cloudflare Email Routing + Worker) ek geliştirme
  gerektiriyor. Kullanıcı şu an bu maliyeti/işi istemiyor — Resend Pro alınınca
  veya Cloudflare'e karar verilince: domain DNS kaydı + webhook secret
  (`INBOUND_EMAIL_WEBHOOK_SECRET`) eklenip test edilecek.
- ✅ **Faz 3 kod tarafı yazıldı** (2026-06-15): Faz 2, Resend $20/ay engeline
  takıldığı için roadmap sırasına göre Faz 3'e geçildi. `profiles.extension_token`
  (migration `0005_extension_token.sql`), `requireExtensionAuth()`
  (`lib/apiAuth.ts`), `POST /api/extension/applications` (CORS + Bearer token,
  başvuruyu `pending` olarak ekler, plan limiti kontrolü dahil),
  `GET/POST /api/extension/token` (token görüntüleme/yenileme), Ayarlar'da
  `ExtensionTokenCard`, ve `extension/` klasöründe MV3 tarayıcı eklentisi
  (LinkedIn `/jobs/view/*` ve Indeed `viewjob` sayfalarında "ApplyTrack'e
  Kaydet" düğmesi, popup'tan site adresi + kişisel anahtar girilir).
  **Migration 0005 Supabase'de çalıştırıldı, eklenti yüklendi ve gerçek
  LinkedIn ilanından kayıt başarıyla test edildi (2026-06-15). Faz 3
  TAMAMLANDI.**
- ✅ **CV otomatik optimizasyon + PDF (cvAutoTailoring) tamamlandı**
  (2026-06-15, commit `95944c0`): `lib/anthropic.ts` → `tailorCv()` —
  kullanıcının CV'sini seçili ilana göre yeniden düzenler, 0-100 arası
  "başvuru hazırlık skoru" + 3 öneri döner. `POST /api/ai/tailor-cv`
  (Pro/Career Coach, aylık AI limitine dahil — `ai_usage.cv_tailors_used`),
  `GET /api/applications/[id]/cv-pdf` (pdfkit ile optimize edilmiş CV'yi PDF
  olarak indirir). Başvuru detayında `CvTailorCard`: skor < 75 ise
  "Henüz hazır değil", >= 75 ise PDF indirme butonu açılır, >= 90 "Mükemmel"
  etiketi. Migration `0006_cv_tailoring.sql` (applications.tailored_cv_text/
  tailored_fit_score, ai_usage.cv_tailors_used) — **Supabase'de henüz
  ÇALIŞTIRILMADI, kullanıcı tarafında bekleyen adım**. AI prompt + PDF
  üretimi gerçek Anthropic API ile test edildi (skor 78 döndü, geçerli PDF
  üretildi).
- ✅ **CV yükleme butonu düzeltildi** (2026-06-15): Ayarlar sayfasındaki CV
  yükleme alanı statik HTML'di, hiçbir işlevi yoktu. `CvUploadCard` client
  component eklendi, mevcut `/api/cv/upload` endpoint'ine bağlandı.
- ✅ **Sektöre özel belge kontrol listesi (cvAutoTailoring genişletmesi)
  tamamlandı** (2026-06-15): `lib/anthropic.ts` → `analyzeRequiredDocuments()`
  ilanı analiz edip o sektöre özel en fazla 5 belge/sertifika önerir, her
  birine `critical/important/optional` önem derecesi atar.
  `POST /api/ai/required-documents` bu listeyi üretip
  `applications.required_documents` (jsonb) kolonuna kaydeder. Kullanıcının
  cevapları `tailorCv()`'e iletilir ve skor hesabını etkiler (kritik belge
  eksikse -15/-25, önemli eksikse -5/-10, opsiyonel eksikse 0/-3; belirtilmemiş
  belgeler skoru etkilemez).
- ✅ **Belge yükleme + UI sadeleştirme tamamlandı** (2026-06-15, commit
  `fa4372d`): `RequiredDocumentsCard` — her sektöre özel belge için PDF
  yükleme alanı (`POST /api/applications/[id]/documents/upload`, metni
  çıkarıp `tailorCv()` promptuna ekler) ve Var/Yok toggle
  (`PATCH /api/applications/[id]/documents`). Başvuru detayındaki "İlan
  Açıklaması" kartı kaldırıldı, yerine bu kart geldi. Mülakat asistanı
  (chat) paneline örnek soru çipleri + açıklayıcı metin eklendi. Tüm AI
  metin üretimlerine Türkçe yazım kuralı talimatı (`TURKISH_WRITING_RULE`)
  eklendi.
- ✅ **Migration `0007_required_documents.sql` Supabase'de çalıştırıldı**
  (2026-06-15) — kolon mevcut, doğrulandı.
- ✅ **Test sonucu (2026-06-15)**: `npm run build` temiz geçti (tek uyarı:
  `@supabase/supabase-js`'in Edge Runtime uyarısı — bu projeye özel değil,
  önceden de vardı, sorun değil). Yeni API route'ları (`/api/ai/
  required-documents`, `/api/applications/[id]/documents`,
  `/api/applications/[id]/documents/upload`) auth olmadan 401 dönüyor,
  500/çökme yok. AI promptları gerçek Anthropic API ile test edildi (belge
  tespiti, skor düşürme, Türkçe metin kalitesi — hepsi doğru çalışıyor).
  **Tarayıcıda gerçek kullanıcı akışı (dosya yükleme, Var/Yok tıklama, PDF
  indirme butonunun gerçek dosya ile çalışması) henüz manuel test
  edilmedi** — bir sonraki oturumda `/applications/[id]` sayfasında uçtan
  uca denenmeli.
- ✅ **Faz 4 — Mock Mülakat Simülasyonu (yazılı, AI destekli) kod tarafı
  tamamlandı** (2026-06-15): `lib/anthropic.ts` → `generateMockInterviewTurn()`
  (çok turlu, soru-cevap akışı, son turda kapanış mesajı + `is_final:true`) ve
  `generateMockInterviewFeedback()` (özet, güçlü/geliştirilecek yönler,
  kategori bazlı 0-100 skorlar, genel skor). 4 yeni route:
  `POST /api/mock-interview/start`, `POST /api/mock-interview/[id]/message`,
  `POST /api/mock-interview/[id]/finish`, `POST /api/mock-interview/[id]/
  retry-feedback` (hepsi Pro/Career Coach plan gate'i + aylık AI limitine dahil
  — `ai_usage.mock_interviews_used`). Başvuru detayında `MockInterviewCard`
  (yeni prova başlat + geçmiş oturumlar listesi) ve
  `/applications/[id]/mock-interview/[interviewId]` sayfasında `MockInterviewChat`
  (6 soruluk sohbet, ilerleme göstergesi, "Mülakatı Bitir" butonu) +
  tamamlanınca `InterviewFeedbackReport` (genel skor, kategori skorları,
  güçlü/geliştirilecek yönler). Migration `0008_mock_interview.sql`
  (`mock_interviews`, `mock_interview_messages` tabloları + RLS,
  `ai_usage.mock_interviews_used`) — **Supabase'de henüz ÇALIŞTIRILMADI,
  kullanıcı tarafında bekleyen adım** (migration çalıştırılmadan bu özellik
  500 döner). `npx tsc --noEmit`, `npx eslint .` ve `npm run build` temiz
  geçti; tüm yeni route'lar auth olmadan 401 dönüyor. AI promptları gerçek
  Anthropic API ile 6 soruluk tam akış + geri bildirim raporu uçtan uca test
  edildi (7. turda `is_final:true` + kapanış mesajı, feedback şeması
  doğrulandı).
  **Kapsam dışı / sonraki adım**: sesli mod (mikrofon ile cevap, AI
  sorularının sesli okunması — STT/TTS) ve geçmiş mülakat oturumlarının
  silinmesi, bu fazda yapılmadı.
- ❓ Sıradaki adım: migration `0008` Supabase'de çalıştırılıp tarayıcıda
  uçtan uca mock mülakat akışı test edilmeli (önceki bekleyen migration
  `0006` ile birlikte).

## Faz 1 — Planlayıcı / Proaktif Dashboard
*Yeni dış servis gerektirmez, mevcut altyapı üzerine kurulur.*

- Dashboard "bugün ne yapmalıyım" görünümüne dönüşür: AI, başvuru durumlarına göre
  görev üretir (örn. "Bu başvurudan 5 gündür yanıt yok, takip maili at",
  "Yarın mülakatın var, hazırlık sohbetine başla").
- Takvim / zaman çizelgesi görünümü: mülakat tarihleri, takip hatırlatmaları.
- Başvuru silme (UI) — backend API zaten mevcut (`DELETE /api/applications/[id]`).
- Google OAuth ile giriş (GitHub OAuth ile aynı pattern, Supabase provider ayarı).

## Faz 2 — Email Entegrasyonu (otomatik durum takibi)
*Yeni altyapı gerekir: inbound email servisi + yeni tablo.*

- Her kullanıcıya kayıt sırasında otomatik, benzersiz bir forwarding adresi
  üretilir: `user_<id>@inbox.applytrack.com` (kullanıcının giriş maili ile
  1:1 eşleştirilir, kullanıcıya tekrar soru sorulmaz).
- Kullanıcı kendi mail istemcisinde (Gmail/Outlook) basit bir forwarding/filtre
  kuralı kurar: belirli göndericilerden (şirket, LinkedIn, ATS sistemleri) gelen
  mailleri bu adrese de yönlendirir.
- Inbound email servisi (örn. Resend/Postmark inbound parsing) gelen maili
  webhook ile bize iletir.
- Claude API ile mail içeriği sınıflandırılır (mülakat daveti / red / bilgi
  talebi / diğer) ve ilgili başvurunun durumu **otomatik güncellenir** +
  kullanıcıya in-app bildirim gösterilir.
- Yeni tablo: `inbound_emails` (user_id, application_id, from, subject, body,
  classification, created_at).

## Faz 3 — Tarayıcı Eklentisi
- LinkedIn / Indeed gibi sitelerde "Apply" sırasında tek tıkla başvuruyu
  ApplyTrack'e kaydetme — manuel link yapıştırma ihtiyacını ortadan kaldırır.

## Faz 4 — Mock Mülakat Simülasyonu
- AI ile gerçekçi yazılı/sesli mülakat provası ve sonunda geri bildirim raporu.

---

**Öncelik sırası:** Faz 1 → Faz 2 → Faz 3 → Faz 4. Faz 2, en yüksek değeri
sağlayan ama en maliyetli/karmaşık parça olduğu için Faz 1 oturduktan sonra
ele alınacak.
