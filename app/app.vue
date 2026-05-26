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

watch([isLoading, isAuthenticated], ([loading, auth]) => {
  if (!loading && !auth) {
    if (route.path.startsWith('/houses') || route.path.startsWith('/input-bulanan')) {
      navigateTo('/')
    }
  }
})
</script>
