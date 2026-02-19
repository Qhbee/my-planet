<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  path: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

const crumbs = computed(() => {
  if (!props.path || props.path === '/') {
    return [{ label: t('projects.drive.root'), path: '/' }]
  }
  const parts = props.path.split('/').filter(Boolean)
  const result: { label: string, path: string }[] = [
    { label: t('projects.drive.root'), path: '/' }
  ]
  let acc = ''
  for (const part of parts) {
    acc += `/${part}`
    result.push({ label: part, path: acc })
  }
  return result
})

function goTo(path: string) {
  emit('navigate', path)
}
</script>

<template>
  <nav class="flex items-center gap-1 text-sm flex-wrap">
    <template
      v-for="(crumb, i) in crumbs"
      :key="crumb.path"
    >
      <button
        v-if="i > 0"
        type="button"
        class="text-muted px-0.5"
        disabled
      >
        /
      </button>
      <button
        type="button"
        class="hover:text-primary transition-colors text-left"
        :class="i === crumbs.length - 1 ? 'font-medium' : 'text-muted'"
        @click="goTo(crumb.path)"
      >
        {{ crumb.label }}
      </button>
    </template>
  </nav>
</template>
