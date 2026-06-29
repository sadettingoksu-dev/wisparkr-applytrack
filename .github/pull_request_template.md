<!-- master = CANLI. Merge edilince www.wisparkr.com'a otomatik deploy olur. -->

## Ne değişti?
<!-- Kısaca, Türkçe. Hangi özellik/sayfa/dosya? -->

## Neden?
<!-- Bağlam: hangi ihtiyaç/istek için? -->

## Nasıl test ettim?
<!-- Vercel preview URL'inde ne denedin? Hangi senaryolar çalışıyor? -->
- [ ] Vercel preview deploy'unda denendi
- [ ] `npx tsc --noEmit` ve `npm run lint` lokalde geçti

## Kontrol listesi
- [ ] Bu PR tek bir özelliğe/işe odaklı (küçük ve gözden geçirilebilir)
- [ ] Ortak çekirdek dosyalara (`lib/plans.ts`, `lib/types.ts`, `lib/i18n.ts`, `supabase/**`, `middleware.ts`) dokunduysam diğer kişiyle konuştum
- [ ] Şema değişikliği varsa migration ekledim **ve** PR açıklamasına Supabase'de elle çalıştırılacağını not düştüm
- [ ] Gözden geçiren atandı (diğer ekip üyesi) — onay olmadan merge yok
