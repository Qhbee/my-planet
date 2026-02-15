<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RawFile, StegImage } from 'steg'
import { scryptAsync } from '@noble/hashes/scrypt.js'

const { t } = useI18n()

useSeoMeta({
  title: t('projects.fileEncrypt.seoTitle')
})

const MAX_FILE_SIZE = 5 * 1024 * 1024
const SCRYPT_SALT = new TextEncoder().encode('file-encrypt-steg-v1')
const BITS_TAKEN_OPTIONS = [1, 2, 4]

type Mode = 'encrypt' | 'decrypt'
const mode = ref<Mode>('encrypt')

// Encrypt state
const fileInputRef = ref<HTMLInputElement | null>(null)
const carrierInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const carrierSource = ref<'preset' | 'custom'>('preset')
const selectedCarrierId = ref<string>('1')
const customCarrierFile = ref<File | null>(null)
const carrierDimensions = ref<{ w: number, h: number } | null>(null)
const password = ref('')
const bitsTaken = ref(1)
const encryptLoading = ref(false)
const encryptError = ref('')
const stegoImageUrl = ref<string | null>(null)

// Decrypt state
const stegoInputRef = ref<HTMLInputElement | null>(null)
const stegoFile = ref<File | null>(null)
const decryptPassword = ref('')
const decryptLoading = ref(false)
const decryptError = ref('')
const extractedFile = ref<RawFile | null>(null)

// Preset carriers: URLs that we fetch to get bytes (avoids CORS canvas tainting)
const presetCarriers = [
  { id: '1', url: 'https://placehold.co/4000x4000/1e3a5f/94a3b8.png', label: '1', w: 4000, h: 4000 },
  { id: '2', url: 'https://placehold.co/4000x4000/334155/64748b.png', label: '2', w: 4000, h: 4000 },
  { id: '3', url: 'https://placehold.co/4000x4000/475569/94a3b8.png', label: '3', w: 4000, h: 4000 }
]

const deriveKey = async (pwd: string): Promise<Uint8Array> => {
  const passwordBytes = new TextEncoder().encode(pwd)
  return scryptAsync(passwordBytes, SCRYPT_SALT, {
    N: 2 ** 18,
    r: 8,
    p: 1,
    dkLen: 32
  })
}

const loadCarrierAsBytes = async (): Promise<Uint8Array> => {
  if (carrierSource.value === 'custom' && customCarrierFile.value) {
    const f = customCarrierFile.value
    const ab = await f.arrayBuffer()
    return new Uint8Array(ab)
  }
  const carrier = presetCarriers.find(c => c.id === selectedCarrierId.value)
  if (!carrier) throw new Error(t('projects.fileEncrypt.invalidImage'))
  const res = await fetch(carrier.url)
  if (!res.ok) throw new Error(t('projects.fileEncrypt.invalidImage'))
  const ab = await res.arrayBuffer()
  return new Uint8Array(ab)
}

const doEncrypt = async () => {
  encryptError.value = ''
  stegoImageUrl.value = null

  if (!selectedFile.value) {
    encryptError.value = t('projects.fileEncrypt.uploadFile')
    return
  }
  if (selectedFile.value.size > MAX_FILE_SIZE) {
    encryptError.value = t('projects.fileEncrypt.fileTooBig')
    return
  }
  if (!password.value) {
    encryptError.value = t('projects.fileEncrypt.password')
    return
  }

  if (carrierSource.value === 'custom' && !carrierInputRef.value?.files?.[0]) {
    encryptError.value = t('projects.fileEncrypt.selectCarrier')
    return
  }

  encryptLoading.value = true
  try {
    const carrierBytes = await loadCarrierAsBytes()
    const stegImg = await StegImage.fromBytesOrURL(carrierBytes)
    const bits = Number(bitsTaken.value) || 1
    const capacity = stegImg.calcCapacity(bits)

    // Account for encryption overhead (~41 bytes)
    const usableBytes = capacity.bytes - 41
    if (selectedFile.value.size > usableBytes) {
      encryptError.value = t('projects.fileEncrypt.fileTooBig')
      return
    }

    const file = selectedFile.value ?? fileInputRef.value?.files?.[0]
    if (!file) {
      encryptError.value = t('projects.fileEncrypt.uploadFile')
      return
    }

    const ab = await file.arrayBuffer()
    const rawFile = new RawFile(new Uint8Array(ab), file.name)
    const key = await deriveKey(password.value)
    const url = await stegImg.hide(rawFile, key, bits)
    stegoImageUrl.value = url
  } catch (e) {
    encryptError.value = e instanceof Error ? e.message : String(e)
  } finally {
    encryptLoading.value = false
  }
}

const downloadStegoImage = () => {
  if (!stegoImageUrl.value) return
  const link = document.createElement('a')
  link.href = stegoImageUrl.value
  link.download = 'stego-image.png'
  link.click()
}

const doDecrypt = async () => {
  decryptError.value = ''
  extractedFile.value = null

  if (!stegoFile.value) {
    decryptError.value = t('projects.fileEncrypt.uploadStegoImage')
    return
  }
  if (!decryptPassword.value) {
    decryptError.value = t('projects.fileEncrypt.password')
    return
  }

  decryptLoading.value = true
  try {
    const ab = await stegoFile.value.arrayBuffer()
    const bytes = new Uint8Array(ab)
    const stegImg = await StegImage.fromBytesOrURL(bytes)
    const key = await deriveKey(decryptPassword.value)
    const raw = await stegImg.reveal(key)
    extractedFile.value = raw
  } catch (e) {
    decryptError.value = e instanceof Error ? e.message : String(e)
  } finally {
    decryptLoading.value = false
  }
}

const downloadExtractedFile = () => {
  extractedFile.value?.download()
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

const onFileDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) selectedFile.value = file
}

const onStegoDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type === 'image/png') stegoFile.value = file
}

const onStegoFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  stegoFile.value = input.files?.[0] ?? null
}

const onCarrierChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  customCarrierFile.value = input.files?.[0] ?? null
  carrierSource.value = 'custom'
}

const calcUsableBytes = (w: number, h: number, bits: number) =>
  Math.floor(((w * h - 1) * 3 * bits) / 8) - 41

const loadImageDimensions = (file: File): Promise<{ w: number, h: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })

watch([carrierSource, selectedCarrierId, customCarrierFile], async () => {
  carrierDimensions.value = null
  if (carrierSource.value === 'preset') {
    const c = presetCarriers.find(x => x.id === selectedCarrierId.value)
    if (c) carrierDimensions.value = { w: c.w, h: c.h }
  } else if (customCarrierFile.value) {
    try {
      carrierDimensions.value = await loadImageDimensions(customCarrierFile.value)
    } catch {
      carrierDimensions.value = null
    }
  }
}, { immediate: true })

const capacityHint = computed(() => {
  const d = carrierDimensions.value
  if (!d) return null
  const bits = Number(bitsTaken.value) || 1
  const bytes = calcUsableBytes(d.w, d.h, bits)
  return t('projects.fileEncrypt.capacityHint', { size: formatSize(bytes) })
})

const formatSize = (bytes: number) => {
  const KB = 1024
  const MB = 1024 * 1024
  if (bytes < KB) return `${bytes}B`
  if (bytes < MB) return `${(bytes / KB).toFixed(2)}KB`
  return `${(bytes / MB).toFixed(2)}MB`
}

const canEncrypt = computed(() => {
  if (!selectedFile.value || !password.value) return false
  if (carrierSource.value === 'custom' && !carrierInputRef.value?.files?.[0]) return false
  return true
})

const canDecrypt = computed(() => stegoFile.value && decryptPassword.value)
</script>

<template>
  <UContainer class="max-w-4xl">
    <div class="mt-6 space-y-6">
      <div class="flex items-center gap-2">
        <UTabs
          v-model="mode"
          :items="[
            { label: t('projects.fileEncrypt.encrypt'), value: 'encrypt' },
            { label: t('projects.fileEncrypt.decrypt'), value: 'decrypt' }
          ]"
        />
      </div>

      <!-- Encrypt -->
      <div
        v-if="mode === 'encrypt'"
        class="space-y-6"
      >
        <UCard>
          <template #header>
            <div class="font-semibold">
              {{ t('projects.fileEncrypt.encrypt') }}
            </div>
          </template>
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.uploadFile') }}
              </div>
              <label
                class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 cursor-pointer transition-colors hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                :class="{ 'opacity-60 pointer-events-none': encryptLoading }"
                @dragover.prevent
                @drop.prevent="onFileDrop"
              >
                <UIcon
                  name="i-lucide-upload"
                  class="size-8 text-muted"
                />
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="*"
                  class="sr-only"
                  @change="onFileChange"
                >
                <span class="text-sm text-muted">
                  {{ selectedFile ? selectedFile.name + ' (' + formatSize(selectedFile.size) + ')' : t('projects.fileEncrypt.clickOrDrop') }}
                </span>
              </label>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.selectCarrier') }}
              </div>
              <div class="flex gap-2 items-center flex-wrap">
                <UButton
                  v-for="c in presetCarriers"
                  :key="c.id"
                  :variant="carrierSource === 'preset' && selectedCarrierId === c.id ? 'solid' : 'soft'"
                  size="sm"
                  @click="carrierSource = 'preset'; selectedCarrierId = c.id"
                >
                  {{ c.label }}
                </UButton>
                <UButton
                  :variant="carrierSource === 'custom' ? 'solid' : 'soft'"
                  size="sm"
                  @click="carrierInputRef?.click(); carrierSource = 'custom'"
                >
                  {{ t('projects.fileEncrypt.uploadCarrier') }}
                </UButton>
                <input
                  ref="carrierInputRef"
                  type="file"
                  accept="image/png"
                  class="hidden"
                  @change="onCarrierChange"
                >
              </div>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.password') }}
              </div>
              <UInput
                v-model="password"
                type="password"
                autocomplete="new-password"
                :placeholder="t('projects.fileEncrypt.password')"
              />
            </div>

            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.bitsTaken') }}
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <USelect
                  v-model="bitsTaken"
                  :items="BITS_TAKEN_OPTIONS.map(v => ({ label: String(v), value: v }))"
                  class="w-24"
                />
                <span
                  v-if="capacityHint"
                  class="text-sm text-muted"
                >
                  {{ capacityHint }}
                </span>
              </div>
            </div>

            <div
              v-if="encryptLoading"
              class="flex items-center gap-2 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 px-4 py-3 text-sm text-primary-600 dark:text-primary-400"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="size-4 animate-spin"
              />
              {{ t('projects.fileEncrypt.processing') }}
            </div>

            <UButton
              :disabled="!canEncrypt"
              :loading="encryptLoading"
              @click="doEncrypt"
            >
              {{ t('projects.fileEncrypt.generate') }}
            </UButton>

            <div
              v-if="encryptError"
              class="text-sm text-red-600 dark:text-red-400"
            >
              {{ encryptError }}
            </div>

            <div
              v-if="stegoImageUrl"
              class="space-y-2"
            >
              <p class="text-sm text-muted">
                {{ t('projects.fileEncrypt.downloadImage') }}
              </p>
              <UButton
                variant="soft"
                @click="downloadStegoImage"
              >
                {{ t('projects.fileEncrypt.downloadImage') }}
              </UButton>
            </div>
          </div>
          <template #footer>
            <div class="text-xs text-muted">
              {{ t('projects.common.localOnly') }}
            </div>
          </template>
        </UCard>
      </div>

      <!-- Decrypt -->
      <div
        v-else
        class="space-y-6"
      >
        <UCard>
          <template #header>
            <div class="font-semibold">
              {{ t('projects.fileEncrypt.decrypt') }}
            </div>
          </template>
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.uploadStegoImage') }}
              </div>
              <label
                class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 cursor-pointer transition-colors hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                :class="{ 'opacity-60 pointer-events-none': decryptLoading }"
                @dragover.prevent
                @drop.prevent="onStegoDrop"
              >
                <UIcon
                  name="i-lucide-image"
                  class="size-8 text-muted"
                />
                <input
                  ref="stegoInputRef"
                  type="file"
                  accept="image/png"
                  class="sr-only"
                  @change="onStegoFileChange"
                >
                <span class="text-sm text-muted">
                  {{ stegoFile ? stegoFile.name : t('projects.fileEncrypt.clickOrDrop') }}
                </span>
              </label>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">
                {{ t('projects.fileEncrypt.password') }}
              </div>
              <UInput
                v-model="decryptPassword"
                type="password"
                autocomplete="current-password"
                :placeholder="t('projects.fileEncrypt.password')"
              />
            </div>

            <div
              v-if="decryptLoading"
              class="flex items-center gap-2 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 px-4 py-3 text-sm text-primary-600 dark:text-primary-400"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="size-4 animate-spin"
              />
              {{ t('projects.fileEncrypt.processing') }}
            </div>

            <UButton
              :disabled="!canDecrypt"
              :loading="decryptLoading"
              @click="doDecrypt"
            >
              {{ t('projects.fileEncrypt.extract') }}
            </UButton>

            <div
              v-if="decryptError"
              class="text-sm text-red-600 dark:text-red-400"
            >
              {{ decryptError }}
            </div>

            <div
              v-if="extractedFile"
              class="space-y-2"
            >
              <p class="text-sm text-muted">
                {{ extractedFile.name }} ({{ formatSize(extractedFile.size) }})
              </p>
              <UButton
                variant="soft"
                @click="downloadExtractedFile"
              >
                {{ t('projects.fileEncrypt.downloadFile') }}
              </UButton>
            </div>
          </div>
          <template #footer>
            <div class="text-xs text-muted">
              {{ t('projects.common.localOnly') }}
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
