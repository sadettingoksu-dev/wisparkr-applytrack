const apiBaseInput = document.getElementById('apiBase')
const tokenInput = document.getElementById('token')
const statusEl = document.getElementById('status')

chrome.storage.sync.get(['apiBase', 'token'], ({ apiBase, token }) => {
  apiBaseInput.value = apiBase || 'http://localhost:3000'
  tokenInput.value = token || ''
})

document.getElementById('save').addEventListener('click', () => {
  const apiBase = apiBaseInput.value.trim()
  const token = tokenInput.value.trim()

  chrome.storage.sync.set({ apiBase, token }, () => {
    statusEl.textContent = 'Kaydedildi.'
    statusEl.style.color = '#16a34a'
    setTimeout(() => {
      statusEl.textContent = ''
    }, 2000)
  })
})
