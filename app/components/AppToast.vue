<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-elevated backdrop-blur-xl border max-w-sm animate-slide-up',
        typeClasses,
      ]"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        <svg v-if="type === 'success'" class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="type === 'error'" class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <!-- Message -->
      <p class="text-sm font-medium text-white flex-1">{{ message }}</p>

      <!-- Close -->
      <button class="flex-shrink-0 text-surface-400 hover:text-white transition-colors" @click="hide">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { visible, message, type, hide } = useToast()

const typeClasses = computed(() => {
  switch (type.value) {
    case 'success':
      return 'bg-surface-800/90 border-emerald-500/30'
    case 'error':
      return 'bg-surface-800/90 border-rose-500/30'
    default:
      return 'bg-surface-800/90 border-brand-500/30'
  }
})
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
