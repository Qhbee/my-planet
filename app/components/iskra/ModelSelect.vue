<script setup lang="ts">
import { useModels } from '~/composables/projects/iskra/useModels'

const { model, models, formatModelName, isModelSelectable } = useModels()

const items = computed(() => models.map((model) => {
  const selectable = isModelSelectable(model)
  return {
    label: formatModelName(model),
    value: model,
    icon: `i-simple-icons-${model.split('/')[0]}`,
    disabled: !selectable,
    class: selectable ? 'text-highlighted' : 'text-muted/50 opacity-50 grayscale-[50%]'
  }
}))
</script>

<template>
  <USelectMenu
    v-model="model"
    :items="items"
    size="sm"
    :icon="`i-simple-icons-${model.split('/')[0]}`"
    variant="ghost"
    value-key="value"
    class="hover:bg-default focus:bg-default data-[state=open]:bg-default"
    :ui="{
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
      content:
        'min-w-(--reka-combobox-trigger-width) !w-max max-w-[min(100vw-2rem,25rem)]'
    }"
  />
</template>
