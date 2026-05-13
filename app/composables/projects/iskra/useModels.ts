const tokenDisplay: Record<string, string> = {
  deepseek: 'DeepSeek',
  mimo: 'MiMo',
  gpt: 'GPT'
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
  const models = [
    'deepseek/deepseek-v4',
    'deepseek/deepseek-v4-pro',
    'xiaomi/mimo-v2.5',
    'xiaomi/mimo-v2.5-pro',
    'openai/gpt-5-nano',
    'anthropic/claude-haiku-4.5',
    'google/gemini-2.5-flash'
  ]

  const model = useCookie<string>('model', { default: () => 'xiaomi/mimo-v2.5' })

  return {
    models,
    model,
    formatModelName
  }
}
