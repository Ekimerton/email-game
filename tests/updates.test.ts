import { describe, it, expect } from 'vitest'
import { app } from '../src/index'
import { UPDATES, LATEST_UPDATE, getUpdatesHtml } from '../src/views'

describe('Updates & Patch Notes Feature (/updates)', () => {
  it('should have valid updates data structure with October 6 update and First update', () => {
    expect(UPDATES).toBeDefined()
    expect(Array.isArray(UPDATES)).toBe(true)
    expect(UPDATES.length).toBeGreaterThanOrEqual(2)
    expect(LATEST_UPDATE.title).toBe('New styles & customizable colors in user preferences!')
    expect(LATEST_UPDATE.id).toBe('october-6-2026')
    expect(UPDATES.some(u => u.id === 'first-update')).toBe(true)
  })

  it('should render the updates page at GET /updates with 200 OK', async () => {
    const res = await app.request('/updates')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('Updates &amp; Patch Notes')
    expect(html).toContain('New styles &amp; customizable colors in user preferences!')
    expect(html).toContain('actively working on a mascot')
    expect(html).toContain('pick your own color combinations')
    expect(html).toContain('First update &amp; where Inboxed is headed')
    expect(html).toContain('Hello! Thank you for playing Inboxed.')
    expect(html).toContain('much to the chagrin of Steve Jobs')
    expect(html).toContain('https://www.youtube.com/watch?v=EZll3dJ2AjY')
    expect(html).toContain('feedback form')
    expect(html).toContain('logo-tiles')
    expect(html).toContain('https://forms.gle/o3rAMb56i7cL1T1n8')
  })

  it('getUpdatesHtml function should produce complete HTML with accordion', () => {
    const html = getUpdatesHtml()
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('New styles &amp; customizable colors in user preferences!')
    expect(html).toContain('First update &amp; where Inboxed is headed')
    expect(html).toContain('class="update-accordion"')
    expect(html).toContain('class="update-header"')
    expect(html).toContain('class="update-date"')
    expect(html).toContain('class="update-title"')
    expect(html).toContain('October 6, 2026')
    expect(html).toContain('September 2026')
    expect(html).not.toContain('class="update-tag"')
  })

  it('should only expand the latest update accordion by default', () => {
    const html = getUpdatesHtml()
    expect(html).toContain('id="october-6-2026" open')
    expect(html).toContain('id="first-update"')
    expect(html).not.toContain('id="first-update" open')
  })

  it('should render the news ticker announcement box in the game interface with borderless card, left aligned text, and right aligned read more button', async () => {
    const res = await app.request('/?email=player@company.com&forceHttps=true')
    expect(res.status).toBe(200)
    const html = await res.text()

    // Announcement bar under the header
    expect(html).toContain('class="news-ticker-container"')
    expect(html).toContain('class="news-ticker-box"')
    expect(html).toContain('border-radius: 6px')
    expect(html).toContain('class="news-ticker-content"')
    expect(html).toContain('class="news-ticker-text"')
    expect(html).toContain('class="news-ticker-tag"')
    expect(html).toContain('Update October 6th:')
    expect(html).toContain('New styles & customizable colors in user preferences!')
    expect(html).toContain('color: #000000')
    expect(html).toContain('class="news-ticker-btn"')
    expect(html).toContain('.news-ticker-btn:hover')
    expect(html).not.toContain('.news-ticker-box:hover')
    expect(html).toContain('background-color: #bfdbfe')
    expect(html).toContain('background-color: #ffffff')
    expect(html).toContain('border: none')
    expect(html).toContain('Read more')
    expect(html).not.toContain('&nearr;')
    expect(html).toContain('/updates')
  })

  it('should support news ticker styling in dark theme with borderless card and read more button', async () => {
    const res = await app.request('/?email=player@company.com&forceHttps=true&theme=dark')
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('.news-ticker-box')
    expect(html).toContain('border-radius: 6px')
    expect(html).toContain('justify-content: space-between')
    expect(html).toContain('.news-ticker-btn')
    expect(html).toContain('.news-ticker-btn:hover')
    expect(html).not.toContain('.news-ticker-box:hover')
    expect(html).toContain('background-color: #bfdbfe')
    expect(html).toContain('background-color: #121212')
    expect(html).toContain('Read more')
    expect(html).not.toContain('&nearr;')
  })

  it('should serve dev preview at /dev/page/updates in development', async () => {
    const res = await app.request('http://localhost:8787/dev/page/updates')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('First update &amp; where Inboxed is headed')
    expect(html).toContain('Updates &amp; Patch Notes')
  })

  it('should include updates page in dev workbench at GET /dev', async () => {
    const res = await app.request('http://localhost:8787/dev')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('data-page="updates"')
    expect(html).toContain('Updates &amp; Patch Notes')
    expect(html).toContain('/dev/page/updates')
  })
})
