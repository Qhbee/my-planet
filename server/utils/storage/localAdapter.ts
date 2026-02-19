import { createReadStream, createWriteStream, promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import type { Readable } from 'node:stream'
import type { FileEntry, StorageAdapter } from './types'
import { normalizeAndValidatePath, resolveUserPath } from './pathUtils'

function getStorageRoot(): string {
  if (process.env.NUXT_DRIVE_STORAGE_PATH) {
    return process.env.NUXT_DRIVE_STORAGE_PATH
  }
  return join(process.cwd(), 'server', 'storage')
}

function nodeStreamToWebStream(readable: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      readable.on('data', chunk => controller.enqueue(chunk))
      readable.on('end', () => controller.close())
      readable.on('error', err => controller.error(err))
    }
  })
}

export function createLocalFSAdapter(): StorageAdapter {
  const root = getStorageRoot()

  return {
    async list(userId: string, path: string): Promise<FileEntry[]> {
      const normalized = normalizeAndValidatePath(path)
      const fullPath = resolveUserPath(root, userId, normalized)

      try {
        const stat = await fs.stat(fullPath)
        if (!stat.isDirectory()) {
          return []
        }
      } catch (err: any) {
        if (err?.code === 'ENOENT') {
          return []
        }
        throw err
      }

      const entries: FileEntry[] = []
      const names = await fs.readdir(fullPath)

      for (const name of names) {
        const childFullPath = join(fullPath, name)
        const childUserPath = normalized === '/' ? `/${name}` : `${normalized}/${name}`

        try {
          const stat = await fs.stat(childFullPath)
          entries.push({
            name,
            path: childUserPath,
            size: stat.size,
            modified: stat.mtime,
            isDirectory: stat.isDirectory()
          })
        } catch {
          // Skip entries we can't stat
        }
      }

      return entries.sort((a, b) => {
        // Directories first, then by name
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    },

    async get(userId: string, path: string) {
      const normalized = normalizeAndValidatePath(path)
      if (normalized === '/') {
        throw new Error('Cannot get root as file')
      }
      const fullPath = resolveUserPath(root, userId, normalized)

      const stat = await fs.stat(fullPath)
      if (stat.isDirectory()) {
        throw new Error('Cannot get directory as file')
      }

      const stream = createReadStream(fullPath)
      const webStream = nodeStreamToWebStream(stream)

      return {
        stream: webStream,
        size: stat.size
      }
    },

    async put(userId: string, path: string, stream: ReadableStream<Uint8Array>) {
      const normalized = normalizeAndValidatePath(path)
      if (normalized === '/' || normalized.endsWith('/')) {
        throw new Error('Invalid path for file')
      }
      const fullPath = resolveUserPath(root, userId, normalized)

      await fs.mkdir(dirname(fullPath), { recursive: true })

      const reader = stream.getReader()
      const writeStream = createWriteStream(fullPath)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          writeStream.write(Buffer.from(value))
        }
        writeStream.end()
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })
      } finally {
        reader.releaseLock()
      }
    },

    async delete(userId: string, path: string) {
      const normalized = normalizeAndValidatePath(path)
      if (normalized === '/') {
        throw new Error('Cannot delete root')
      }
      const fullPath = resolveUserPath(root, userId, normalized)

      const stat = await fs.stat(fullPath)
      if (stat.isDirectory()) {
        await fs.rm(fullPath, { recursive: true })
      } else {
        await fs.unlink(fullPath)
      }
    },

    async mkdir(userId: string, path: string) {
      const normalized = normalizeAndValidatePath(path)
      if (normalized === '/') {
        return // Root already exists conceptually
      }
      const fullPath = resolveUserPath(root, userId, normalized)
      await fs.mkdir(fullPath, { recursive: true })
    },

    async rename(userId: string, oldPath: string, newPath: string) {
      const oldNorm = normalizeAndValidatePath(oldPath)
      const newNorm = normalizeAndValidatePath(newPath)
      if (oldNorm === '/' || newNorm === '/') {
        throw new Error('Invalid path for rename')
      }
      const oldFull = resolveUserPath(root, userId, oldNorm)
      const newFull = resolveUserPath(root, userId, newNorm)
      await fs.rename(oldFull, newFull)
    },

    async move(userId: string, oldPath: string, newPath: string) {
      // For local FS, move = rename
      await this.rename(userId, oldPath, newPath)
    },

    async exists(userId: string, path: string): Promise<boolean> {
      const normalized = normalizeAndValidatePath(path)
      const fullPath = resolveUserPath(root, userId, normalized)
      try {
        await fs.access(fullPath)
        return true
      } catch {
        return false
      }
    }
  }
}
