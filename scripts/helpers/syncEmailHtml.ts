import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const htmlPath = path.join(rootDir, 'src/email.html')
const domainTsPath = path.join(rootDir, 'src/email/emailHtml.ts')

const html = fs.readFileSync(htmlPath, 'utf8')
const escaped = html
  .replaceAll('\\', '\\\\')
  .replaceAll('`', '\\`')
  .replaceAll('${', '\\${')

const tsContent = `export const EMAIL_HTML = \`${escaped}\`;\n`
fs.writeFileSync(domainTsPath, tsContent, 'utf8')

console.log('✅ Successfully synchronized src/email/emailHtml.ts from src/email.html')
