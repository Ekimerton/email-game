import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const htmlPath = path.join(rootDir, 'src/email.html')
const tsPath = path.join(rootDir, 'src/emailHtml.ts')

const html = fs.readFileSync(htmlPath, 'utf8')
const escaped = html
  .replaceAll('\\', '\\\\')
  .replaceAll('`', '\\`')
  .replaceAll('${', '\\${')

const tsContent = `export const EMAIL_HTML = \`${escaped}\`;\n`
fs.writeFileSync(tsPath, tsContent, 'utf8')

console.log('✅ Successfully synchronized src/emailHtml.ts from src/email.html')
