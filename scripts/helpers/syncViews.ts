import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

export function parseCssVariables(css: string): Record<string, string> {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
  const vars: Record<string, string> = {}
  if (rootMatch) {
    for (const match of rootMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars[match[1].trim()] = match[2].trim()
    }
  }
  return vars
}

export function resolveCssVariables(css: string, customVars: Record<string, string> = {}): string {
  const rootVars = parseCssVariables(css)
  const vars = { ...rootVars, ...customVars }
  let resolved = css.replace(/(?:\/\*[\s\S]*?\*\/\s*)?:root\s*\{[\s\S]*?\}\s*/, '')
  for (let i = 0; i < 3; i++) {
    resolved = resolved.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (fullMatch, varName, fallback) => {
      if (vars[varName]) return vars[varName]
      if (fallback) return fallback.trim()
      return fullMatch
    })
  }
  return resolved
}

// 1. Sync src/email.template.html -> src/email.html -> src/email/emailHtml.ts
export function syncEmailHtml() {
  const templatePath = path.join(rootDir, 'src/email.template.html')
  const htmlPath = path.join(rootDir, 'src/email.html')
  const domainTsPath = path.join(rootDir, 'src/email/emailHtml.ts')

  // Compile CSS variables from template into concrete AMP4EMAIL-valid styles
  if (fs.existsSync(templatePath)) {
    const templateHtml = fs.readFileSync(templatePath, 'utf8')
    const styleMatch = templateHtml.match(/<style amp-custom>([\s\S]*?)<\/style>/)
    if (styleMatch) {
      const resolvedCss = resolveCssVariables(styleMatch[1])
      const compiledHtml = templateHtml.replace(
        /<style amp-custom>[\s\S]*?<\/style>/,
        `<style amp-custom>\n${resolvedCss.trim()}\n    </style>`
      )
      fs.writeFileSync(htmlPath, compiledHtml, 'utf8')
      console.log('✅ Compiled src/email.template.html -> src/email.html (resolved CSS variables for AMP)')
    }
  }

  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8')
    const escaped = html
      .replaceAll('\\', '\\\\')
      .replaceAll('`', '\\`')
      .replaceAll('${', '\\${')

    const tsContent = `export const EMAIL_HTML = \`${escaped}\`;\n`
    fs.writeFileSync(domainTsPath, tsContent, 'utf8')
    console.log('✅ Synchronized src/email/emailHtml.ts')
  }
}

// Helper to bundle an html + css view into its template.ts
function syncView(folderRel: string, name: string, prefix: string) {
  const folder = path.join(rootDir, 'src/views', folderRel)
  const htmlPath = path.join(folder, `${name}.html`)
  const cssPath = path.join(folder, `${name}.css`)
  const templatePath = path.join(folder, `${name}Template.ts`)

  if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath)) return

  const css = fs.readFileSync(cssPath, 'utf8')
  const html = fs.readFileSync(htmlPath, 'utf8')

  const cssExportName = `${prefix}_CSS`
  const htmlExportName = `${prefix}_HTML`

  const combinedHtml = html
    .replace(new RegExp(`\\s*<link rel="stylesheet" href="\\./${name}\\.css">`), '')
    .replace('/* INJECT_CSS */', css.trim())

  const escapedHtml = combinedHtml
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')

  const escapedCss = css
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')

  const content = `export const ${cssExportName} = \`${escapedCss}\`;\n\nexport const ${htmlExportName} = \`${escapedHtml}\`;\n`
  fs.writeFileSync(templatePath, content, 'utf8')
  console.log(`✅ Synchronized src/views/${folderRel}/${name}Template.ts`)
}

export function syncAllViews() {
  syncEmailHtml()
  syncView('signup', 'signup', 'SIGNUP')
  syncView('confirm', 'confirm', 'CONFIRM')
  syncView('invalid', 'invalid', 'INVALID')
  syncView('privacy', 'privacy', 'PRIVACY')
  syncView('updates', 'updates', 'UPDATES')
  syncView('account', 'account', 'ACCOUNT')
  syncView('fallback', 'fallback', 'FALLBACK')
  syncView('unsubscribe', 'unsubscribe', 'UNSUBSCRIBE')
  syncView('dev', 'devWorkbench', 'DEV_WORKBENCH')
  syncView('dev', 'devSubscribers', 'DEV_SUBSCRIBERS')
  syncView('dev', 'devDashboard', 'DEV_DASHBOARD')
}

syncAllViews()
