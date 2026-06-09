<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Initialize Firebase Auth listener on app mount
const { initAuth, isLoading, isAuthenticated } = useAuth()
const route = useRoute()

onMounted(() => {
  initAuth()
})

const PROTECTED_PATHS = ['/houses', '/input-bulanan', '/kas', '/dashboard', '/master-config']

watch([isLoading, isAuthenticated], ([loading, auth]) => {
  if (!loading && !auth) {
    if (PROTECTED_PATHS.some(p => route.path.startsWith(p))) {
      navigateTo('/')
    }
  }
})
</script>
