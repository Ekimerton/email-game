import { describe, it, expect } from 'vitest'
import amphtmlValidator from 'amphtml-validator'
import fs from 'fs'
import path from 'path'
import { EMAIL_HTML } from '../src/emailHtml'

describe('AMP HTML Validation', () => {
  it('should validate src/email.html as valid AMP4EMAIL', async () => {
    const validator = await amphtmlValidator.getInstance()
    const filePath = path.join(__dirname, '../src/email.html')
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    
    const result = validator.validateString(htmlContent, 'AMP4EMAIL')
    
    if (result.status !== 'PASS') {
      const errorDetails = result.errors
        .map(e => `[Line ${e.line}:${e.col}] ${e.message} ${e.specUrl || ''}`)
        .join('\n')
      expect.fail(`AMP Validation Failed for src/email.html:\n${errorDetails}`)
    }

    expect(result.status).toBe('PASS')
  })

  it('should validate EMAIL_HTML export as valid AMP4EMAIL', async () => {
    const validator = await amphtmlValidator.getInstance()
    const result = validator.validateString(EMAIL_HTML, 'AMP4EMAIL')

    if (result.status !== 'PASS') {
      const errorDetails = result.errors
        .map(e => `[Line ${e.line}:${e.col}] ${e.message} ${e.specUrl || ''}`)
        .join('\n')
      expect.fail(`AMP Validation Failed for EMAIL_HTML export:\n${errorDetails}`)
    }

    expect(result.status).toBe('PASS')
  })
})
