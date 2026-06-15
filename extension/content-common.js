function applytrackCreateButton(getJobData) {
  if (document.getElementById('applytrack-save-btn')) return

  const btn = document.createElement('button')
  btn.id = 'applytrack-save-btn'
  btn.textContent = "ApplyTrack'e Kaydet"
  document.body.appendChild(btn)

  btn.addEventListener('click', () => {
    const job = getJobData()
    if (!job.company_name || !job.position_title) {
      btn.dataset.state = 'error'
      btn.textContent = 'İlan bilgisi bulunamadı'
      setTimeout(() => {
        btn.dataset.state = ''
        btn.textContent = "ApplyTrack'e Kaydet"
      }, 2500)
      return
    }

    btn.dataset.state = 'loading'
    btn.textContent = 'Kaydediliyor...'

    chrome.runtime.sendMessage({ type: 'APPLYTRACK_SAVE_JOB', payload: job }, (response) => {
      if (response?.ok) {
        btn.dataset.state = 'success'
        btn.textContent = 'Kaydedildi ✓'
      } else {
        btn.dataset.state = 'error'
        btn.textContent = response?.error || 'Kaydedilemedi'
      }

      setTimeout(() => {
        btn.dataset.state = ''
        btn.textContent = "ApplyTrack'e Kaydet"
      }, 2500)
    })
  })
}

function applytrackText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    const text = el?.textContent?.replace(/\s+/g, ' ').trim()
    if (text) return text
  }
  return ''
}
