chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'APPLYTRACK_SAVE_JOB') return undefined

  chrome.storage.sync.get(['apiBase', 'token'], async ({ apiBase, token }) => {
    if (!apiBase || !token) {
      sendResponse({ ok: false, error: 'Eklenti ayarlanmadı. Lütfen popup üzerinden API adresi ve anahtarı gir.' })
      return
    }

    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/extension/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message.payload),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        sendResponse({ ok: false, error: json?.error?.message || `İstek başarısız (${res.status})` })
        return
      }

      sendResponse({ ok: true, data: json.data })
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : 'Bilinmeyen hata' })
    }
  })

  return true
})
