import { join, posix } from 'path'

/**
 * Normalize and validate user path. Rejects path traversal and absolute paths.
 * @param path - User-provided path (e.g. "/", "/docs/readme.txt")
 * @returns Normalized path like "/" or "/docs/readme.txt"
 */
export function normalizeAndValidatePath(path: string): string {
  if (typeof path !== 'string' || path.trim() === '') {
    return '/'
  }

  // Use posix for consistent /-based paths
  let normalized = posix.normalize(path)

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }

  // Remove trailing slash except for root
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  // Reject path traversal
  if (normalized.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed')
  }

  return normalized
}

/**
 * Resolve full filesystem path for a user's storage.
 */
export function resolveUserPath(baseDir: string, userId: string, userPath: string): string {
  const normalized = normalizeAndValidatePath(userPath)
  // For root "/", we get userId dir; otherwise userId + path
  const relativePath = normalized === '/' ? '' : normalized.slice(1)
  const fullPath = join(baseDir, userId, relativePath)
  return fullPath
}
