<script setup lang="ts">
export type IskraRagSourceItem = {
  rel_path?: string | null
  title?: string | null
  book?: string | null
  chunk_index?: number | null
  chunk_id?: number | null
  score?: number | null
  snippet?: string
}

defineProps<{
  sources: IskraRagSourceItem[]
}>()

function head(s: IskraRagSourceItem): string {
  return s.title?.trim() || s.rel_path?.trim() || '来源'
}

function previewLine(s: IskraRagSourceItem, index: number): string {
  const h = head(s)
  const p = s.rel_path?.trim()
  const raw = p && p !== h ? `${h} · ${p}` : h
  const one = raw.replace(/\s+/g, ' ').trim()
  const max = 100
  return `${index + 1}. ${one.length > max ? `${one.slice(0, max)}…` : one}`
}

function metaParts(s: IskraRagSourceItem): string[] {
  const out: string[] = []
  if (s.rel_path) out.push(`路径: ${s.rel_path}`)
  if (s.book) out.push(`书目: ${s.book}`)
  if (s.title) out.push(`标题: ${s.title}`)
  if (s.chunk_index != null) out.push(`片段: chunk#${s.chunk_index}`)
  if (s.score != null && Number.isFinite(s.score)) out.push(`得分: ${s.score.toFixed(4)}`)
  return out
}
</script>

<template>
  <details
    v-if="sources.length > 0"
    class="mt-3 rounded-lg border border-default/60 bg-elevated/40 text-sm"
  >
    <summary class="cursor-pointer select-none px-3 py-2 font-medium text-highlighted hover:bg-elevated/80">
      参考来源（{{ sources.length }} 条）
    </summary>
    <div class="space-y-2 border-t border-default/40 px-3 py-3">
      <details
        v-for="(s, i) in sources"
        :key="i"
        class="rounded-md border border-default/40 bg-default/30"
      >
        <summary class="cursor-pointer select-none px-2 py-1.5 text-muted hover:text-default">
          {{ previewLine(s, i) }}
        </summary>
        <div class="space-y-2 border-t border-default/30 px-2 py-2 text-default">
          <p
            v-if="metaParts(s).length"
            class="text-xs text-muted"
          >
            {{ metaParts(s).join(' · ') }}
          </p>
          <pre
            v-if="(s.snippet ?? '').trim()"
            class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-2 text-xs leading-relaxed"
          >{{ (s.snippet ?? '').trim() }}</pre>
        </div>
      </details>
    </div>
  </details>
</template>
