<script setup lang="ts">
import { computed, ref } from 'vue'

useSeoMeta({
  title: 'Color Mixer'
})

type MixMode = 'light' | 'pigment'

type Preset = {
  name: string
  r: number
  g: number
  b: number
  a: number
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const toHex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase()

const rgbaToHex = (r: number, g: number, b: number) => `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`

const rgbaToHex8 = (r: number, g: number, b: number, a: number) => {
  const alpha = clamp(a, 0, 1)
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(alpha * 255)}`
}

const presets: Preset[] = [
  { name: 'Black', r: 0, g: 0, b: 0, a: 1 },
  { name: 'Gray', r: 128, g: 128, b: 128, a: 1 },
  { name: 'White', r: 255, g: 255, b: 255, a: 1 },
  { name: 'Red', r: 255, g: 0, b: 0, a: 1 },
  { name: 'Green', r: 0, g: 255, b: 0, a: 1 },
  { name: 'Blue', r: 0, g: 0, b: 255, a: 1 },
  { name: 'Cyan', r: 0, g: 255, b: 255, a: 1 },
  { name: 'Magenta', r: 255, g: 0, b: 255, a: 1 },
  { name: 'Yellow', r: 255, g: 255, b: 0, a: 1 }
]

// Channels
const r = ref(255)
const g = ref(255)
const b = ref(255)
const a = ref(1)

const overlay = ref(1.00)

const mode = ref<MixMode>('light')

const setPreset = (p: Preset) => {
  r.value = p.r
  g.value = p.g
  b.value = p.b
  a.value = p.a
}

const reset = () => {
  r.value = 255
  g.value = 255
  b.value = 255
  a.value = 1
  overlay.value = 1.00
  mode.value = 'light'
}

const cssRgba = computed(() => {
  const rr = clamp(r.value, 0, 255)
  const gg = clamp(g.value, 0, 255)
  const bb = clamp(b.value, 0, 255)
  const aa = clamp(a.value, 0, 1)
  return `rgba(${rr}, ${gg}, ${bb}, ${aa.toFixed(2)})`
})

const rgbText = computed(() => `rgb(${clamp(r.value, 0, 255)}, ${clamp(g.value, 0, 255)}, ${clamp(b.value, 0, 255)})`)
const rgbaText = computed(() => `rgba(${clamp(r.value, 0, 255)}, ${clamp(g.value, 0, 255)}, ${clamp(b.value, 0, 255)}, ${clamp(a.value, 0, 1).toFixed(2)})`)
const hexText = computed(() => rgbaToHex(r.value, g.value, b.value))
const hex8Text = computed(() => rgbaToHex8(r.value, g.value, b.value, a.value))

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text)
}

// --- 3-circle mixing demo ---
const mix3 = (mode: MixMode) => {
  type RGB = [number, number, number]

  const c1: RGB = [1, 0, 0]
  const c2: RGB = [0, 1, 0]
  const c3: RGB = [0, 0, 1]

  const combine = (x: number, y: number) => {
    if (mode === 'light') {
      return 1 - (1 - x) * (1 - y)
    }
    return x * y
  }

  const mix2 = (a: RGB, b: RGB): RGB => [
    combine(a[0], b[0]),
    combine(a[1], b[1]),
    combine(a[2], b[2])
  ]

  const rg = mix2(c1, c2)
  const rb = mix2(c1, c3)
  const gb = mix2(c2, c3)
  const rgb = mix2(rg, c3)

  const toCss = (c: RGB) => {
    const rr = Math.round(c[0] * 255)
    const gg = Math.round(c[1] * 255)
    const bb = Math.round(c[2] * 255)
    return `rgb(${rr}, ${gg}, ${bb})`
  }

  return {
    rg: toCss(rg),
    rb: toCss(rb),
    gb: toCss(gb),
    rgb: toCss(rgb)
  }
}

const demo = computed(() => mix3(mode.value))
const circleOpacity = computed(() => clamp(overlay.value, 0, 1))

// Circle geometry (keep inside stage)
const circleSize = 160
const radius = 48
const dx = Math.round(radius * Math.sqrt(3) / 2)
const dy = Math.round(radius / 2)
</script>

<template>
  <UContainer class="max-w-6xl">
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Left column: Channels + Presets -->
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="font-semibold">
                Channels
              </div>
              <UButton
                variant="soft"
                @click="reset"
              >
                Reset
              </UButton>
            </div>
          </template>

          <div class="space-y-5">
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="w-6 font-medium">
                  R
                </div>
                <UInput
                  v-model.number="r"
                  type="number"
                  :min="0"
                  :max="255"
                  class="w-24"
                />
              </div>
              <USlider
                v-model="r"
                :min="0"
                :max="255"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="w-6 font-medium">
                  G
                </div>
                <UInput
                  v-model.number="g"
                  type="number"
                  :min="0"
                  :max="255"
                  class="w-24"
                />
              </div>
              <USlider
                v-model="g"
                :min="0"
                :max="255"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="w-6 font-medium">
                  B
                </div>
                <UInput
                  v-model.number="b"
                  type="number"
                  :min="0"
                  :max="255"
                  class="w-24"
                />
              </div>
              <USlider
                v-model="b"
                :min="0"
                :max="255"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="w-6 font-medium">
                  A
                </div>
                <UInput
                  v-model.number="a"
                  type="number"
                  :min="0"
                  :max="1"
                  step="0.01"
                  class="w-24"
                />
              </div>
              <USlider
                v-model="a"
                :min="0"
                :max="1"
                :step="0.01"
                class="w-full"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="font-semibold">
                Presets
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="p in presets"
              :key="p.name"
              class="text-left rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 w-full"
              @click="setPreset(p)"
            >
              <div class="font-medium truncate">
                {{ p.name }}
              </div>
              <div class="text-xs text-muted truncate">
                {{ rgbaToHex(p.r, p.g, p.b) }}
              </div>
              <div
                class="mt-2 h-6 w-full rounded "
                :style="{ background: `rgba(${p.r},${p.g},${p.b},${p.a})` }"
              />
            </button>
          </div>
        </UCard>
      </div>

      <!-- Right column: Mixing + Formats -->
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="font-semibold">
                  Mixing
                </div>
                <div class="text-sm text-muted">
                  Preview + 3-circle demo
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  :variant="mode === 'pigment' ? 'solid' : 'soft'"
                  @click="mode = 'pigment'"
                >
                  Pigment
                </UButton>
                <UButton
                  :variant="mode === 'light' ? 'solid' : 'soft'"
                  @click="mode = 'light'"
                >
                  Light
                </UButton>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div
                class="h-40"
                :style="{ background: cssRgba }"
              />
              <div class="p-3 text-sm">
                <div class="font-medium">
                  Preview
                </div>
                <div class="text-xs text-muted break-words">
                  {{ cssRgba }}
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 p-6 overflow-hidden">
              <div class="mx-auto w-full max-w-md aspect-square relative">
                <div
                  class="absolute left-1/2 top-1/2 rounded-full"
                  :style="{ width: `${circleSize}px`, height: `${circleSize}px`, background: 'rgb(255,0,0)', opacity: circleOpacity, transform: `translate(-50%, -50%) translate(0, -${radius}px)`, mixBlendMode: mode === 'light' ? 'screen' : 'multiply' }"
                />
                <div
                  class="absolute left-1/2 top-1/2 rounded-full"
                  :style="{ width: `${circleSize}px`, height: `${circleSize}px`, background: 'rgb(0,255,0)', opacity: circleOpacity, transform: `translate(-50%, -50%) translate(-${dx}px, ${dy}px)`, mixBlendMode: mode === 'light' ? 'screen' : 'multiply' }"
                />
                <div
                  class="absolute left-1/2 top-1/2 rounded-full"
                  :style="{ width: `${circleSize}px`, height: `${circleSize}px`, background: 'rgb(0,0,255)', opacity: circleOpacity, transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`, mixBlendMode: mode === 'light' ? 'screen' : 'multiply' }"
                />
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium">
                    Demo opacity
                  </div>
                  <div class="text-sm text-muted">
                    {{ Math.round(circleOpacity * 100) }}%
                  </div>
                </div>
                <USlider
                  v-model="overlay"
                  :min="0"
                  :max="1"
                  :step="0.01"
                />
              </div>

              <div class="mt-2 text-center">
                <div class="text-xs text-muted break-words">
                  RG: {{ demo.rg }} · RB: {{ demo.rb }} · GB: {{ demo.gb }} · RGB: {{ demo.rgb }}
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold">
                  Formats
                </div>
                <div class="text-sm text-muted">
                  Copy RGB / RGBA / HEX / HEX8
                </div>
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-medium">
                RGB
              </div>
              <code class="text-sm min-w-0 truncate">{{ rgbText }}</code>
              <UButton
                size="xs"
                variant="link"
                @click="copy(rgbText)"
              >
                Copy
              </UButton>
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-medium">
                RGBA
              </div>
              <code class="text-sm min-w-0 truncate">{{ rgbaText }}</code>
              <UButton
                size="xs"
                variant="link"
                @click="copy(rgbaText)"
              >
                Copy
              </UButton>
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-medium">
                HEX
              </div>
              <code class="text-sm min-w-0 truncate">{{ hexText }}</code>
              <UButton
                size="xs"
                variant="link"
                @click="copy(hexText)"
              >
                Copy
              </UButton>
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-medium">
                HEX8
              </div>
              <code class="text-sm min-w-0 truncate">{{ hex8Text }}</code>
              <UButton
                size="xs"
                variant="link"
                @click="copy(hex8Text)"
              >
                Copy
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
