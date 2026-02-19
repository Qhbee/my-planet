export interface FileEntry {
  name: string
  path: string
  size: number
  modified: Date
  isDirectory: boolean
}

export interface GetResult {
  stream: ReadableStream<Uint8Array>
  contentType?: string
  size?: number
}

export interface PutOptions {
  contentType?: string
}

export interface StorageAdapter {
  list(userId: string, path: string): Promise<FileEntry[]>
  get(userId: string, path: string): Promise<GetResult>
  put(userId: string, path: string, stream: ReadableStream<Uint8Array>, opts?: PutOptions): Promise<void>
  delete(userId: string, path: string): Promise<void>
  mkdir(userId: string, path: string): Promise<void>
  rename(userId: string, oldPath: string, newPath: string): Promise<void>
  move(userId: string, oldPath: string, newPath: string): Promise<void>
  exists(userId: string, path: string): Promise<boolean>
}
