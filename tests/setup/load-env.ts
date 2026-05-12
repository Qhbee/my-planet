import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnv(root: string) {
  const p = resolve(root, '.env')
  if (!existsSync(p)) {
    return
  }
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) {
      continue
    }
    const eq = t.indexOf('=')
    if (eq <= 0) {
      continue
    }
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"'))
      || (val.startsWith('\'') && val.endsWith('\''))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}

/** Vitest 默认在仓库根执行；用 cwd 避免依赖 import.meta（部分 tsconfig module 不设会报 TS1343） */
loadDotEnv(process.cwd())
