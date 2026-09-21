import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

// 1. Sync src/email.html -> src/email/emailHtml.ts
function syncEmailHtml() {
  const htmlPath = path.join(rootDir, 'src/email.html')
  const domainTsPath = path.join(rootDir, 'src/email/emailHtml.ts')

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
  syncView('account', 'account', 'ACCOUNT')
  syncView('fallback', 'fallback', 'FALLBACK')
  syncView('unsubscribe', 'unsubscribe', 'UNSUBSCRIBE')
  syncView('dev', 'devWorkbench', 'DEV_WORKBENCH')
  syncView('dev', 'devSubscribers', 'DEV_SUBSCRIBERS')
}

syncAllViews()
