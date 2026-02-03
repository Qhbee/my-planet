<script setup lang="ts">
import '~/assets/css/iskra.css'
import { useChats } from '~/composables/projects/iskra/useChats'
import { LazyIskraModalConfirm } from '#components'

const route = useRoute()
const toast = useToast()
const overlay = useOverlay()
const localePath = useLocalePath()
const { loggedIn, openInPopup } = useUserSession()

const open = ref(false)

const deleteModal = overlay.create(LazyIskraModalConfirm, {
  props: {
    title: 'Delete chat',
    description: 'Are you sure you want to delete this chat? This cannot be undone.'
  }
})

const iskraBase = '/projects/iskra'

const { data: chats, refresh: refreshChats } = await useFetch<Chat[]>('/api/iskra/chats', {
  key: 'iskra-chats',
  transform: data => data.map(chat => ({
    id: chat.id,
    label: chat.title || 'Untitled',
    to: localePath(`${iskraBase}/chat/${chat.id}`),
    icon: 'i-lucide-message-circle',
    createdAt: chat.createdAt
  }))
})

onNuxtReady(async () => {
  const first10 = (chats.value || []).slice(0, 10)
  for (const chat of first10) {
    await $fetch(`/api/iskra/chats/${chat.id}`)
  }
})

watch(loggedIn, async () => {
  await refreshChats()
  open.value = false
})

const { groups } = useChats(chats)

const items = computed(() => groups.value?.flatMap((group) => {
  return [{
    label: group.label,
    type: 'label' as const
  }, ...group.items.map(item => ({
    ...item,
    slot: 'chat' as const,
    icon: undefined,
    class: item.label === 'Untitled' ? 'text-muted' : ''
  }))]
}))

async function deleteChat(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) {
    return
  }

  await $fetch(`/api/iskra/chats/${id}`, { method: 'DELETE' })

  toast.add({
    title: 'Chat deleted',
    description: 'Your chat has been deleted',
    icon: 'i-lucide-trash'
  })

  await refreshChats()

  if (route.params.id === id) {
    await navigateTo(localePath(iskraBase))
  }
}

defineShortcuts({
  c: async () => {
    await navigateTo(localePath(iskraBase))
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="bg-elevated/50"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          :to="localePath(iskraBase)"
          class="flex items-end gap-0.5"
        >
          <IskraLogo class="h-8 w-auto shrink-0" />
          <span
            v-if="!collapsed"
            class="text-xl font-bold text-highlighted"
          >Iskra</span>
        </NuxtLink>

        <div
          v-if="!collapsed"
          class="flex items-center gap-1.5 ms-auto"
        >
          <UDashboardSearchButton collapsed />
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'New chat' }"
            variant="soft"
            block
            :to="localePath(iskraBase)"
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSearchButton collapsed />
            <UDashboardSidebarCollapse />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <IskraUserMenu
          v-if="loggedIn"
          :collapsed="collapsed"
        />
        <UButton
          v-else
          :label="collapsed ? '' : 'Login with GitHub'"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          class="w-full"
          @click="openInPopup('/auth/github')"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      placeholder="Search chats..."
      :groups="[{
        id: 'links',
        items: [{
          label: 'New chat',
          to: localePath(iskraBase),
          icon: 'i-lucide-square-pen'
        }]
      }, ...(groups ?? [])]"
    />

    <slot />
  </UDashboardGroup>
</template>
