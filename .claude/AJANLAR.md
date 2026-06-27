# ApplyTrack — AI Ajan Takımı

Bu projede 3 uzman alt-ajan (subagent) tanımlı. Hepsi **"önce sana sorar"** modunda çalışır:
kod değiştirmeden veya komut çalıştırmadan önce Claude Code izin ister.

## Ajanlar

| Ajan | Dosya | Ne yapar |
|------|-------|----------|
| **backend** | `.claude/agents/backend.md` | API route, Supabase/SQL, webhook, billing, AI endpoint, eklenti API'si |
| **frontend** | `.claude/agents/frontend.md` | React/Next.js bileşenleri, Tailwind UI, dashboard sayfaları, dnd-kit |
| **security** | `.claude/agents/security.md` | Güvenlik denetimi (sadece okur/raporlar, kod değiştirmez) |

## Nasıl kullanılır?

Sadece normal dilde ne istediğini yaz; Claude doğru ajanı kendi seçer. Ya da açıkça çağır:

- "backend ajanını kullanarak başvurulara not ekleme endpoint'i yaz"
- "frontend ajanı ile board sayfasına filtre ekle"
- "security ajanını çalıştır, extension API'sini denetle"

Birden fazla ajanı zincirleyebilirsin:
- "Önce backend ajanı X endpoint'ini yazsın, sonra security ajanı denetlesin, sonunda ben onaylayınca commit edelim."

## Otomatik / sürekli çalışma (makinen açıkken)

- **Tekrarlayan görev:** `/loop` komutu — örn. `/loop 30m security ajanı ile hızlı güvenlik taraması yap`
- **Olay tetikli:** `.claude/settings.json` içine **hook** eklenebilir (örn. her commit öncesi lint/güvenlik kontrolü).
- Not: "önce sor" modunda ajanlar onay beklediği için tam otomatik (insansız) akış için onay adımlarını gevşetmek gerekir — bunu istersen ayrıca kurarız.

## Güvenlik notları
- Ajanlar yalnızca bu projede ve senin makinende çalışır; kod/sırlar dışarı gönderilmez.
- `.env.local` ve gerçek anahtarlar asla commit edilmez (security ajanı bunu denetler).
- Yıkıcı işlem (veri silme, prod deploy) öncesi her zaman onayın istenir.
