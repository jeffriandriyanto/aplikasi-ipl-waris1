<template>
  <div class="min-h-screen bg-surface-50 font-sans">
    <header class="bg-white border-b border-surface-200 shadow-sm sticky top-0 z-40">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span class="font-bold text-surface-900 text-sm tracking-tight">IPL Perumahan Waris</span>
        </div>
        <div class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
          v1.4.1
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <Teleport to="body">
      <AppToast />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
</script>
