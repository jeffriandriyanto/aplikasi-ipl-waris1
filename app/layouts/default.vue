<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Navigation Sidebar / Top Bar -->
    <AppNavbar v-if="showNav" />

    <!-- Main Content -->
    <main :class="showNav ? 'lg:ml-64' : ''">
      <slot />
    </main>

    <!-- Notification Toast -->
    <Teleport to="body">
      <AppToast />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/login')
</script>
