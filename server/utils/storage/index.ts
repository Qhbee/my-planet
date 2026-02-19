import type { StorageAdapter } from './types'
import { createLocalFSAdapter } from './localAdapter'

let _adapter: StorageAdapter | null = null

export function getDriveStorage(): StorageAdapter {
  if (!_adapter) {
    const driver = process.env.NUXT_DRIVE_STORAGE ?? 'local'
    if (driver === 'local') {
      _adapter = createLocalFSAdapter()
    } else {
      // SeaweedFS adapter can be added later
      throw new Error(`Unknown drive storage driver: ${driver}`)
    }
  }
  return _adapter
}
