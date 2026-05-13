const tokenDisplay: Record<string, string> = {
  deepseek: 'DeepSeek',
  mimo: 'MiMo',
  gpt: 'GPT'
}

/** 单条模型：改 `selectable` 即可控制下拉是否可选，无需改其它逻辑 */
export interface ModelCatalogEntry {
  id: string
  selectable: boolean
}

/**
 * 全部展示在模型列表中的条目；未列入的 id 视为不可选。增删模型或切换开放状态只改此表。
 */
export const modelCatalog: ModelCatalogEntry[] = [
  { id: 'deepseek/deepseek-v4', selectable: false },
  { id: 'deepseek/deepseek-v4-pro', selectable: false },
  { id: 'xiaomi/mimo-v2.5', selectable: true },
  { id: 'xiaomi/mimo-v2.5-pro', selectable: true },
  { id: 'openai/gpt-5-nano', selectable: false },
  { id: 'anthropic/claude-haiku-4.5', selectable: false },
  { id: 'google/gemini-2.5-flash', selectable: false }
]

const selectableIds = new Set(
  modelCatalog.filter(e => e.selectable).map(e => e.id)
)

export function isModelSelectable(modelId: string): boolean {
  return selectableIds.has(modelId)
}

export function formatModelName(modelId: string): string {
  const modelName = modelId.split('/')[1] || modelId

  return modelName
    .split('-')
    .map((word) => {
      const lowerWord = word.toLowerCase()
      const display = tokenDisplay[lowerWord]
      return display ?? word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function useModels() {
  const models = modelCatalog.map(e => e.id)

  const model = useCookie<string>('model', { default: () => 'xiaomi/mimo-v2.5' })

  return {
    models,
    model,
    isModelSelectable,
    formatModelName
  }
}
