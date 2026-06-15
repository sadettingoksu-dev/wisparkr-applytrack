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
  **Bekleyen adım**: migration `0005`'i Supabase SQL Editor'de çalıştırmak
  (kullanıcı tarafında) + eklentiyi `chrome://extensions` üzerinden
  paketlenmemiş yükleyip gerçek LinkedIn/Indeed sayfalarında test etmek
  (bkz. `extension/README.md`).
- ❓ Sıradaki adım: Faz 3 testi sonrası Faz 4 (mock mülakat simülasyonu).

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
