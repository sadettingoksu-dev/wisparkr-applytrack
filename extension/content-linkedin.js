function applytrackGetLinkedInJob() {
  const position_title = applytrackText([
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title',
    'h1.t-24',
    'h1',
  ])

  const company_name = applytrackText([
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
  ])

  const job_description = applytrackText([
    '#job-details',
    '.jobs-description__content',
    '.jobs-box__html-content',
  ]).slice(0, 5000)

  return {
    position_title,
    company_name,
    job_description,
    job_url: window.location.href,
  }
}

applytrackCreateButton(applytrackGetLinkedInJob)

// LinkedIn is a single-page app: re-inject the button when navigating between job postings.
const applytrackObserver = new MutationObserver(() => applytrackCreateButton(applytrackGetLinkedInJob))
applytrackObserver.observe(document.body, { childList: true, subtree: true })
