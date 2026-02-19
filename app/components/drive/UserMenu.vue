<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const { user, clear } = useUserSession()
</script>

<template>
  <UDropdownMenu
    :items="[[{
      type: 'label',
      label: user?.name || user?.username,
      avatar: {
        src: user?.avatar,
        alt: user?.name || user?.username
      }
    }], [{
      label: 'Log out',
      icon: 'i-lucide-log-out',
      async onSelect() {
        await clear()
      }
    }]]"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        label: collapsed ? undefined : (user?.name || user?.username),
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      :avatar="{
        src: user?.avatar || undefined,
        alt: user?.name || user?.username
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
