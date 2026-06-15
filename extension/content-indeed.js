function applytrackGetIndeedJob() {
  const position_title = applytrackText([
    '.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title',
    'h1',
  ])

  const company_name = applytrackText([
    '[data-testid="inlineHeader-companyName"]',
    '.jobsearch-CompanyInfoContainer a',
    '.jobsearch-CompanyInfoContainer',
  ])

  const job_description = applytrackText(['#jobDescriptionText']).slice(0, 5000)

  return {
    position_title,
    company_name,
    job_description,
    job_url: window.location.href,
  }
}

if (window.location.href.includes('viewjob') || window.location.pathname.includes('/viewjob')) {
  applytrackCreateButton(applytrackGetIndeedJob)
}

const applytrackObserver = new MutationObserver(() => {
  if (window.location.href.includes('viewjob') || window.location.pathname.includes('/viewjob')) {
    applytrackCreateButton(applytrackGetIndeedJob)
  }
})
applytrackObserver.observe(document.body, { childList: true, subtree: true })
