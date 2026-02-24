#!/usr/bin/env node
/**
 * 在 typecheck 前修补 steg 和 micro-aes-gcm 的 TypeScript 类型错误。
 * 这些依赖在 strict + noUncheckedIndexedAccess 下会报错，需在 node_modules 做最小修改。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const microAesGcm = join(root, 'node_modules/micro-aes-gcm/index.ts')
const steg = join(root, 'node_modules/steg/index.ts')

function patchMicroAesGcm() {
  let content = readFileSync(microAesGcm, 'utf8')
  content = content.replace(
    '  if (arrays.length === 1) return arrays[0];\n  const length = arrays.reduce((a, arr) => a + arr.length, 0);\n  const result = new Uint8Array(length);\n  for (let i = 0, pad = 0; i < arrays.length; i++) {\n    const arr = arrays[i];\n    result.set(arr, pad);\n    pad += arr.length;\n  }',
    '  if (arrays.length === 1) return arrays[0]!\n  const length = arrays.reduce((a, arr) => a + (arr?.length ?? 0), 0)\n  const result = new Uint8Array(length)\n  for (let i = 0, pad = 0; i < arrays.length; i++) {\n    const arr = arrays[i]!\n    result.set(arr, pad)\n    pad += arr.length\n  }'
  )
  writeFileSync(microAesGcm, content)
}

function patchSteg() {
  let content = readFileSync(steg, 'utf8')
  content = content.replace(
    `      reader.addEventListener('load', () => {\n        let res = reader.result;\n        if (typeof res === 'string') res = utils.utf8ToBytes(res);\n        if (!res) return reject(new Error('No file'));\n        resolve(new RawFile(new Uint8Array(res), file.name));`,
    `      reader.addEventListener('load', () => {\n        let res: string | ArrayBuffer | Uint8Array | null = reader.result\n        if (typeof res === 'string') res = utils.utf8ToBytes(res)\n        if (!res) return reject(new Error('No file'))\n        const buf = res instanceof Uint8Array ? res : new Uint8Array(res as ArrayBuffer)\n        resolve(new RawFile(buf, file.name))`
  )
  content = content.replace(
    '    function writeChannel(data: number, bits = bitsTaken) {\n      const curr = channels[channelId];\n      channels[channelId++] = clearBits(curr, bits) | data;',
    '    function writeChannel(data: number, bits = bitsTaken) {\n      const curr = channels[channelId] ?? 0\n      channels[channelId++] = clearBits(curr, bits) | data'
  )
  content = content.replace('      let hiddenDataByte = hData[byte];', '      let hiddenDataByte = hData[byte] ?? 0')
  content = content.replace(
    '  revealBitsTaken(): number {\n    const channels = this.imageData.data;\n    const bit0 = readBit(channels[0], 7) << 2;\n    const bit1 = readBit(channels[1], 7) << 1;\n    const bit2 = readBit(channels[2], 7);',
    '  revealBitsTaken(): number {\n    const channels = this.imageData.data\n    const bit0 = readBit(channels[0] ?? 0, 7) << 2\n    const bit1 = readBit(channels[1] ?? 0, 7) << 1\n    const bit2 = readBit(channels[2] ?? 0, 7)'
  )
  content = content.replace(
    '      buf = (buf << bitsTaken) | (channels[channelId] & mask);',
    '      buf = (buf << bitsTaken) | ((channels[channelId] ?? 0) & mask)'
  )
  content = content.replace(
    '  bytesToURL(bytes: Uint8Array) {\n    return URL.createObjectURL(new Blob([bytes]));\n  },',
    '  bytesToURL(bytes: Uint8Array) {\n    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer\n    return URL.createObjectURL(new Blob([ab]))\n  },'
  )
  writeFileSync(steg, content)
}

try {
  patchMicroAesGcm()
  patchSteg()
} catch (e) {
  console.error('patch-typecheck-deps failed:', e.message)
  process.exit(1)
}
