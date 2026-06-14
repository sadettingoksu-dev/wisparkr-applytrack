# ApplyTrack Yol Haritası

ApplyTrack, pasif bir "başvuru listesi"nden çıkıp kullanıcı için aktif iş yapan bir
**iş arama planlayıcısı + asistanı** olmayı hedefliyor. Aşağıdaki fazlar, mevcut
kanban/AI altyapısı üzerine kurularak bu hedefe ilerler.

## Durum (güncel)

- ✅ Supabase + Anthropic API key'leri `.env.local`'a girildi, DB şeması ve RLS
  policy'leri kuruldu, model `claude-haiku-4-5-20251001` olarak güncellendi.
- ✅ Faz 1 kodu tamamlandı: Dashboard "Yapılacaklar" listesi (`lib/planner.ts`),
  başvuru silme butonu, Google/GitHub OAuth butonları (login + signup).
- 🔄 **Devam ediyor — Google OAuth kurulumu**: Google Cloud Console'da
  `applytrack` projesi oluşturuldu, OAuth consent screen ("Get started" akışı,
  App information adımı) dolduruluyor. Sıradaki adımlar:
  1. Consent screen'i tamamla (Audience: External, contact info, finish)
  2. Clients sekmesinden **OAuth Client ID** oluştur (Web application, redirect URI:
     `https://vuvemrdnriljghbssqse.supabase.co/auth/v1/callback`)
  3. Çıkan Client ID/Secret'i Supabase Dashboard → Authentication → Providers →
     Google'a gir ve enable et
  4. (Aynı şekilde GitHub OAuth da bekliyor — github.com/settings/developers)
- ❓ Faz 1 sonrası net bir değişiklik talebi yok — Faz 2'ye (email entegrasyonu)
  veya "Faz 5 — CV Oluşturucu" fikrine (bkz. konuşma notları) geçilebilir, henüz
  karar verilmedi.

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
