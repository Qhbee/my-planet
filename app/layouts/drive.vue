<script setup lang="ts">
const localePath = useLocalePath()
const { loggedIn, openInPopup } = useUserSession()

const open = ref(false)
const driveBase = '/projects/drive'
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="drive-sidebar"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="bg-elevated/50"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          :to="localePath(driveBase)"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-hard-drive"
            class="size-8 shrink-0 text-primary"
          />
          <span
            v-if="!collapsed"
            class="text-xl font-bold text-highlighted"
          >
            Drive
          </span>
        </NuxtLink>
        <div
          v-if="!collapsed"
          class="flex items-center gap-1.5 ms-auto"
        >
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div
          v-if="collapsed"
          class="flex flex-col gap-1.5"
        >
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full flex-col gap-0">
          <div
            v-if="!collapsed"
            class="mb-3 border-t border-default/80 pt-3"
          >
            <DriveTagline />
          </div>
          <DriveUserMenu
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
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
