// Otomatik form doldurma — LinkedIn Easy Apply ve Indeed Apply formları

function applytrackFill(selector, value) {
  const el = document.querySelector(selector)
  if (!el || !value) return false
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  if (nativeSetter) nativeSetter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function applytrackInjectAutofill(profile) {
  if (!profile || document.getElementById('applytrack-autofill-btn')) return

  const btn = document.createElement('button')
  btn.id = 'applytrack-autofill-btn'
  btn.textContent = '⚡ ApplyTrack Doldur'
  btn.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 99999;
    background: #7c3aed; color: white; border: none; border-radius: 8px;
    padding: 8px 14px; font-size: 13px; font-weight: 600;
    cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.4);
  `

  btn.addEventListener('click', () => {
    let filled = 0

    // Ad soyad
    if (profile.full_name) {
      const nameParts = profile.full_name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      const firstSelectors = [
        'input[name="firstName"]', 'input[id*="first"]', 'input[placeholder*="Ad"]',
        'input[autocomplete="given-name"]',
      ]
      const lastSelectors = [
        'input[name="lastName"]', 'input[id*="last"]', 'input[placeholder*="Soyad"]',
        'input[autocomplete="family-name"]',
      ]
      firstSelectors.forEach((s) => { if (applytrackFill(s, firstName)) filled++ })
      lastSelectors.forEach((s) => { if (applytrackFill(s, lastName)) filled++ })

      // Tek alan varsa
      const fullSelectors = ['input[name="name"]', 'input[autocomplete="name"]']
      fullSelectors.forEach((s) => { if (applytrackFill(s, profile.full_name)) filled++ })
    }

    // E-posta
    if (profile.email) {
      const emailSelectors = [
        'input[type="email"]', 'input[name="email"]',
        'input[id*="email"]', 'input[autocomplete="email"]',
      ]
      emailSelectors.forEach((s) => { if (applytrackFill(s, profile.email)) filled++ })
    }

    // Telefon
    if (profile.phone) {
      const phoneSelectors = [
        'input[type="tel"]', 'input[name="phone"]',
        'input[id*="phone"]', 'input[autocomplete="tel"]',
      ]
      phoneSelectors.forEach((s) => { if (applytrackFill(s, profile.phone)) filled++ })
    }

    btn.textContent = filled > 0 ? `✓ ${filled} alan dolduruldu` : '⚠ Alan bulunamadı'
    btn.style.background = filled > 0 ? '#16a34a' : '#dc2626'
    setTimeout(() => {
      btn.textContent = '⚡ ApplyTrack Doldur'
      btn.style.background = '#7c3aed'
    }, 3000)
  })

  document.body.appendChild(btn)
}

// Profil bilgisini background'dan al
chrome.runtime.sendMessage({ type: 'APPLYTRACK_GET_PROFILE' }, (response) => {
  if (response?.profile) {
    applytrackInjectAutofill(response.profile)
  }
})

// SPA navigasyonlarında yeniden dene
const applytrackAutofillObserver = new MutationObserver(() => {
  const hasForm = document.querySelector('form input[type="email"], form input[name="firstName"]')
  if (hasForm && !document.getElementById('applytrack-autofill-btn')) {
    chrome.runtime.sendMessage({ type: 'APPLYTRACK_GET_PROFILE' }, (response) => {
      if (response?.profile) applytrackInjectAutofill(response.profile)
    })
  }
})
applytrackAutofillObserver.observe(document.body, { childList: true, subtree: true })
