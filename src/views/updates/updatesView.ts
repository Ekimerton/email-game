import { escapeHtml } from '../../game'
import { UPDATES, LATEST_UPDATE, type PatchNote } from './updatesData'
import { UPDATES_HTML } from './updatesTemplate'

export { UPDATES, LATEST_UPDATE, type PatchNote }

export function renderUpdateCard(update: PatchNote): string {
  const paragraphsHtml = (update.paragraphs || []).map((p) => `<p>${p}</p>`).join('')

  const sectionsHtml = (update.sections || []).map((sec) => {
    const headingHtml = sec.heading ? `<h3>${escapeHtml(sec.heading)}</h3>` : ''
    const bodyHtml = sec.body ? `<p>${sec.body}</p>` : ''
    const bulletsHtml = sec.bullets && sec.bullets.length > 0
      ? `<ul>${sec.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : ''
    return `<div class="update-section">${headingHtml}${bodyHtml}${bulletsHtml}</div>`
  }).join('')

  const leadHtml = update.summary ? `<p class="update-lead">${update.summary}</p>` : ''
  const sectionsWrapper = sectionsHtml ? `<div class="update-sections">${sectionsHtml}</div>` : ''
  const bodyContent = (leadHtml || paragraphsHtml || sectionsWrapper)
    ? `<div class="update-body">${leadHtml}${paragraphsHtml}${sectionsWrapper}</div>`
    : ''

  return `
    <details class="update-accordion" id="${escapeHtml(update.id)}" open>
      <summary class="update-header">
        <div class="update-header-info">
          <span class="update-date">${escapeHtml(update.date)}</span>
          <span class="update-title">${escapeHtml(update.title)}</span>
        </div>
        <span class="accordion-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </summary>
      ${bodyContent}
    </details>
  `
}

export function getUpdatesHtml(): string {
  const updatesContent = UPDATES.map(renderUpdateCard).join('\n')
  return UPDATES_HTML.replace('{{UPDATES_CONTENT}}', updatesContent)
}
