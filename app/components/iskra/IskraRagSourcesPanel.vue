<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { IskraProsePreStream } from '#components'

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

/** 与对话页 assistant 的 MDCCached 一致，代码块走 IskraProsePreStream */
const components = {
  pre: IskraProsePreStream as unknown as DefineComponent
}

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

/** 生成类似 Markdown frontmatter 的 YAML 块（仅展示，不解析执行） */
function metaParts(s: IskraRagSourceItem): string[] {
  const lines: string[] = ['---']
  if (s.rel_path?.trim()) lines.push(`路径: ${s.rel_path.trim()}`)
  if (s.book?.trim()) lines.push(`书目: ${s.book.trim()}`)
  if (s.title?.trim()) lines.push(`标题: ${s.title.trim()}`)
  if (s.chunk_index != null) lines.push(`片段: #${s.chunk_index}`)
  if (s.score != null && Number.isFinite(s.score)) lines.push(`得分: ${s.score.toFixed(4)}`)
  lines.push('---')
  return lines
}

/** 元数据 YAML + 正文，一并交给 MDC；YAML 放在 fenced block 里，避免 ``---`` 被当成 MD 水平线。 */
function ragSourceItemMdc(s: IskraRagSourceItem): string {
  const metaYaml = metaParts(s).join('\n')
  const snippetMd = (s.snippet ?? '').trim()
  // 元数据必须以 fenced code 包一层：裸的 ``---`` 在 CommonMark 里是水平线，不能直接拼在 snippet 前面。
  const fencedMetaYaml = metaYaml ? `\`\`\`yaml\n${metaYaml}\n\`\`\`\n\n` : ''
  return `${fencedMetaYaml}${snippetMd}`.trimEnd()
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
          <div
            v-if="ragSourceItemMdc(s).trim()"
            class="max-h-64 overflow-y-auto rounded border border-default/40 bg-muted/20 p-2 space-y-2 text-xs leading-relaxed"
          >
            <MDCCached
              :value="ragSourceItemMdc(s).trim()"
              :cache-key="`rag-source-${i}-${s.chunk_id ?? i}`"
              :components="components"
              :parser-options="{ highlight: false }"
              class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0 [&_pre]:text-xs"
            />
          </div>
        </div>
      </details>
    </div>
  </details>
</template>
