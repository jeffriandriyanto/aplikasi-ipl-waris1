export default defineNuxtRouteMiddleware((to) => {
  // Allow public access to dashboard and admin-login
  if (to.path === '/' || to.path === '/admin-login') return

  if (import.meta.server) return

  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading.value && !isAuthenticated.value) {
    return navigateTo('/')
  }
})
