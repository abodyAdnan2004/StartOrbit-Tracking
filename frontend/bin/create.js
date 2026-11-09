#!/usr/bin/env node
// Copyright (c) 2026 Sajad Salam
// https://github.com/SajadSalam/nuxt-starter-kit

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ANSI colors (no deps)
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[97m',
}

const clr = (color, text) => `${c[color]}${text}${c.reset}`

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())))
}

function getFlag(flag) {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null
}

async function main() {
  console.log()
  console.log(clr('cyan', '  ╔══════════════════════════════════════════╗'))
  console.log(
    clr('cyan', '  ║') +
      clr('bold', '    ▲ Nuxt 3 Admin Starter Kit  —  Project Setup       ') +
      clr('cyan', '║')
  )
  console.log(clr('cyan', '  ╚══════════════════════════════════════════╝'))
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  // Resolve from argv flags or positional arg, then fall back to interactive prompt
  let appName = getFlag('--name') || (!process.argv[2]?.startsWith('--') ? process.argv[2] : null)
  let apiUrl = getFlag('--api-url')

  if (!appName) {
    appName = (await ask(rl, clr('blue', '  ? App name') + clr('dim', ' (my-app): '))) || 'my-app'
  }

  if (!apiUrl) {
    apiUrl =
      (await ask(
        rl,
        clr('blue', '  ? API base URL') + clr('dim', ' (http://localhost:3000/api): ')
      )) || 'http://localhost:3000/api'
  }

  rl.close()

  const targetDir = path.resolve(appName)

  if (fs.existsSync(targetDir)) {
    console.error()
    console.error(clr('yellow', `  ⚠  Directory "${appName}" already exists. Aborting.`))
    console.error()
    process.exit(1)
  }

  console.log()
  console.log(clr('dim', '  Scaffolding project...'))
  console.log()

  // Copy template, skip heavy/generated dirs
  const SKIP = new Set([
    'node_modules',
    '.nuxt',
    '.output',
    '.git',
    '.github',
    '.claude',
    '.vscode',
    'bin',
  ])
  const srcRoot = path.resolve(__dirname, '..')
  fs.cpSync(srcRoot, targetDir, {
    recursive: true,
    filter: (src) => {
      if (src === srcRoot) return true
      const rel = path.relative(srcRoot, src)
      return !SKIP.has(rel.split(/[\\/]/)[0])
    },
  })

  // Patch package.json name
  const pkgPath = path.join(targetDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = appName
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  // Write .env
  const env = [`NUXT_PUBLIC_API_BASE=${apiUrl}`, `NUXT_APP_NAME=${appName}`].join('\n') + '\n'
  fs.writeFileSync(path.join(targetDir, '.env'), env)

  console.log(clr('green', '  ✔  Template copied'))
  console.log(clr('green', '  ✔  package.json  →  name: ' + clr('white', appName)))
  console.log(clr('green', '  ✔  .env          →  NUXT_PUBLIC_API_BASE: ' + clr('white', apiUrl)))
  console.log()
  console.log(clr('cyan', '  ╔══════════════════════════════════════════╗'))
  console.log(
    clr('cyan', '  ║') +
      clr('bold', `    Ready!  "${appName}"`) +
      clr('cyan', '\n  ║') +
      clr('dim', '                                          ') +
      clr('cyan', '')
  )
  // simpler finish box
  console.log(clr('cyan', '  ╚══════════════════════════════════════════╝'))
  console.log()
  console.log(clr('white', '  Get started:'))
  console.log()
  console.log('   ' + clr('dim', '$') + ' ' + clr('yellow', `cd ${appName}`))
  console.log('   ' + clr('dim', '$') + ' ' + clr('yellow', 'npm install'))
  console.log('   ' + clr('dim', '$') + ' ' + clr('yellow', 'npm run dev'))
  console.log()
  console.log(clr('dim', `  API  →  `) + clr('magenta', apiUrl))
  console.log(
    clr('dim', '  Repo →  ') + clr('cyan', 'https://github.com/SajadSalam/nuxt-starter-kit')
  )
  console.log()
}

main().catch((err) => {
  console.error(clr('yellow', '\n  Error: ') + err.message)
  process.exit(1)
})
