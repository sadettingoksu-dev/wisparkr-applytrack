/**
 * Kariyer Koçu sayfalarında (AI Asistan + Mülakat Simülatörü) seçili başvuruyu çözer.
 * Öncelik: URL query param > cookie (sayfalar arası ortak hafıza) > en yeni başvuru.
 */
export function resolveSelectedApp(
  apps: { id: string }[],
  queryAppId?: string,
  cookieAppId?: string
): string | undefined {
  const isValid = (id?: string) => Boolean(id && apps.some((a) => a.id === id))
  if (isValid(queryAppId)) return queryAppId
  if (isValid(cookieAppId)) return cookieAppId
  return apps[0]?.id
}
