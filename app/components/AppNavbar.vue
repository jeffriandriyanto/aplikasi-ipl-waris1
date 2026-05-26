<template>
  <!-- Mobile Top Bar -->
  <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-200">
    <div class="flex items-center justify-between px-4 h-16">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span class="font-bold text-surface-900 text-sm">IPL Manager</span>
      </div>
      <button
        id="mobile-menu-toggle"
        class="p-2 text-surface-600 hover:text-surface-900 transition-colors"
        @click="mobileOpen = !mobileOpen"
      >
        <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile Overlay -->
  <Transition name="fade">
    <div
      v-if="mobileOpen"
      class="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      @click="mobileOpen = false"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-surface-200 transition-transform duration-300 ease-out',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 h-16 border-b border-surface-200">
      <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <div>
        <h1 class="font-bold text-surface-900 text-sm tracking-tight">IPL Manager</h1>
        <p class="text-[10px] text-surface-500 font-medium">Iuran Pengelolaan</p>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="px-3 py-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive(item.path)
            ? 'bg-primary/10 text-primary'
            : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50',
        ]"
        @click="mobileOpen = false"
      >
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            isActive(item.path) ? 'bg-primary/15' : 'bg-surface-100',
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
        </div>
        <span>{{ item.label }}</span>
        <div
          v-if="isActive(item.path)"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
        />
      </NuxtLink>
    </nav>

    <!-- User Section -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-200">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-sm font-bold text-surface-600">
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-900 truncate">{{ userProfile?.name || 'User' }}</p>
          <p class="text-xs text-surface-500 truncate capitalize">{{ userProfile?.role || 'petugas' }}</p>
        </div>
      </div>
      <button
        id="logout-button"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-surface-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
        @click="handleSignOut"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Keluar
      </button>
    </div>
  </aside>

  <!-- Spacer for mobile top bar -->
  <div class="lg:hidden h-16" />
</template>

<script setup lang="ts">
import { h } from 'vue'

const route = useRoute()
const { userProfile, signOut } = useAuth()
const mobileOpen = ref(false)

const userInitials = computed(() => {
  const name = userProfile.value?.name || 'U'
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// SVG icon components
const DashboardIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    }),
  ])

const InputIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    }),
  ])

const HouseIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    }),
  ])

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/master-config', label: 'Master Iuran', icon: HouseIcon },
  { path: '/input-bulanan', label: 'Input Bulanan', icon: InputIcon },
  { path: '/houses', label: 'Data Rumah', icon: HouseIcon },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleSignOut() {
  mobileOpen.value = false
  await signOut()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
