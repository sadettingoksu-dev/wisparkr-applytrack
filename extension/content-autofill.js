// Otomatik form doldurma — LinkedIn Easy Apply ve Indeed Apply formları

function applytrackFill(selector, value) {
  const el = document.querySelector(selector)
  if (!el || !value) return false
  const nativeSetter =
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  if (nativeSetter) nativeSetter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function applytrackHasApplyForm() {
  // LinkedIn Easy Apply modal veya herhangi bir başvuru formu
  return !!(
    document.querySelector('.jobs-easy-apply-modal') ||
    document.querySelector('[data-test-modal]') ||
    document.querySelector('div[role="dialog"] input') ||
    document.querySelector('form input[type="text"]') ||
    document.querySelector('form input[type="email"]')
  )
}

function applytrackInjectAutofill(profile) {
  if (!profile) return
  // Butonu kaldır ve yeniden ekle (modal kapanıp açılınca tazele)
  const existing = document.getElementById('applytrack-autofill-btn')
  if (existing) existing.remove()

  if (!applytrackHasApplyForm()) return

  const btn = document.createElement('button')
  btn.id = 'applytrack-autofill-btn'
  btn.textContent = '⚡ ApplyTrack Doldur'
  btn.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 2147483647;
    background: #7c3aed; color: white; border: none; border-radius: 8px;
    padding: 8px 14px; font-size: 13px; font-weight: 600;
    cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.4);
    font-family: sans-serif;
  `

  btn.addEventListener('click', () => {
    let filled = 0

    if (profile.full_name) {
      const nameParts = profile.full_name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      ;['input[name="firstName"]', 'input[id*="first-name"]', 'input[id*="firstName"]',
        'input[placeholder*="Ad"]', 'input[autocomplete="given-name"]',
      ].forEach((s) => { if (applytrackFill(s, firstName)) filled++ })

      ;['input[name="lastName"]', 'input[id*="last-name"]', 'input[id*="lastName"]',
        'input[placeholder*="Soyad"]', 'input[autocomplete="family-name"]',
      ].forEach((s) => { if (applytrackFill(s, lastName)) filled++ })

      ;['input[name="name"]', 'input[autocomplete="name"]',
      ].forEach((s) => { if (applytrackFill(s, profile.full_name)) filled++ })
    }

    if (profile.email) {
      ;['input[type="email"]', 'input[name="email"]', 'input[id*="email"]',
        'input[autocomplete="email"]',
      ].forEach((s) => { if (applytrackFill(s, profile.email)) filled++ })
    }

    if (profile.phone) {
      ;['input[type="tel"]', 'input[name="phone"]', 'input[id*="phone"]',
        'input[autocomplete="tel"]',
      ].forEach((s) => { if (applytrackFill(s, profile.phone)) filled++ })
    }

    btn.textContent = filled > 0 ? `✓ ${filled} alan dolduruldu` : '⚠ Doldurulacak alan yok'
    btn.style.background = filled > 0 ? '#16a34a' : '#dc2626'
    setTimeout(() => {
      btn.textContent = '⚡ ApplyTrack Doldur'
      btn.style.background = '#7c3aed'
    }, 3000)
  })

  document.body.appendChild(btn)
}

// Profil bir kez yükle, observer'da tekrar kullan
let applytrackProfile = null

chrome.runtime.sendMessage({ type: 'APPLYTRACK_GET_PROFILE' }, (response) => {
  if (response?.profile) {
    applytrackProfile = response.profile
    applytrackInjectAutofill(applytrackProfile)
  }
})

// Modal açılıp kapanınca butonu güncelle
let applytrackDebounceTimer = null
const applytrackAutofillObserver = new MutationObserver(() => {
  clearTimeout(applytrackDebounceTimer)
  applytrackDebounceTimer = setTimeout(() => {
    if (!applytrackProfile) return
    applytrackInjectAutofill(applytrackProfile)
  }, 300)
})
applytrackAutofillObserver.observe(document.body, { childList: true, subtree: true })
