<template>
  <div class="page-container">
    <div v-if="isSaving" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm">
      <div class="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-scale-in">
        <svg class="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-surface-800 font-semibold">Memperbarui Master Data...</p>
      </div>
    </div>

    <div class="mb-6">
      <h1 class="page-title">Master Tarif IPL</h1>
      <p class="page-subtitle">Kelola parameter iuran minimal air, tarif progresif, dan biaya sampah flat</p>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-sm text-surface-500">Memuat data konfigurasi...</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-card p-6">
        <h2 class="text-lg font-semibold text-surface-900 mb-4 border-b border-surface-100 pb-2">Atur Parameter Tarif</h2>
        
        <form @submit.prevent="saveConfig" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Biaya Iuran Sampah (Flat)</label>
            <div class="relative rounded-md shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span class="text-surface-500 text-sm">Rp</span>
              </div>
              <input
                v-model.number="configForm.dues_trash_flat"
                type="number"
                min="0"
                required
                class="input-field pl-10 w-full font-mono"
                placeholder="25000"
              />
            </div>
            <p class="mt-1 text-xs text-surface-500">Biaya tetap bulanan untuk pengelolaan sampah per rumah.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Iuran Minimal Air (&le; 10 m³)</label>
            <div class="relative rounded-md shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span class="text-surface-500 text-sm">Rp</span>
              </div>
              <input
                v-model.number="configForm.water_min_fee"
                type="number"
                min="0"
                required
                class="input-field pl-10 w-full font-mono"
                placeholder="25000"
              />
            </div>
            <p class="mt-1 text-xs text-surface-500">Tarif minimum wajib jika penggunaan air di bawah atau sama dengan 10 kubik.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Tarif Air Lebih Dari 10 m³ (Per m³)</label>
            <div class="relative rounded-md shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span class="text-surface-500 text-sm">Rp</span>
              </div>
              <input
                v-model.number="configForm.water_price_per_cubic"
                type="number"
                min="0"
                required
                class="input-field pl-10 w-full font-mono"
                placeholder="3500"
              />
            </div>
            <p class="mt-1 text-xs text-surface-500">Biaya tambahan per meter kubik untuk kelebihan pemakaian di atas kuota 10 m³.</p>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" class="btn-primary px-6 py-2.5 text-sm flex items-center gap-2" :disabled="isSaving">
              <svg v-if="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Simpan Perubahan Master
            </button>
          </div>
        </form>
      </div>

      <div class="glass-card p-6 bg-surface-50/50">
        <h2 class="text-lg font-semibold text-surface-900 mb-4 border-b border-surface-100 pb-2">Simulasi Skema Billing Baru</h2>
        <div class="space-y-4 text-sm">
          <div class="p-4 bg-white rounded-xl border border-surface-200 shadow-sm">
            <span class="block font-semibold text-surface-800 mb-2">Kasus 1: Pemakaian Normal (&le; 10 m³)</span>
            <p class="text-surface-600 text-xs leading-relaxed">
              Jika rumah memakai air sebesar <span class="font-mono bg-surface-100 px-1 rounded text-primary">7 m³</span> dengan tipe <span class="font-medium text-surface-800">Air & Sampah</span>:
            </p>
            <div class="mt-2 font-mono text-xs text-surface-700 space-y-1">
              <div>• Sampah: {{ formatCurrency(configForm.dues_trash_flat) }}</div>
              <div>• Air (Min. Kuota): {{ formatCurrency(configForm.water_min_fee) }}</div>
              <div class="font-bold text-primary text-sm pt-1 border-t border-dashed mt-1">Total: {{ formatCurrency(configForm.dues_trash_flat + configForm.water_min_fee) }}</div>
            </div>
          </div>

          <div class="p-4 bg-white rounded-xl border border-surface-200 shadow-sm">
            <span class="block font-semibold text-surface-800 mb-2">Kasus 2: Pemakaian Tinggi (&gt; 10 m³)</span>
            <p class="text-surface-600 text-xs leading-relaxed">
              Jika rumah memakai air sebesar <span class="font-mono bg-surface-100 px-1 rounded text-primary">15 m³</span> (Kelebihan 5 m³) dengan tipe <span class="font-medium text-surface-800">Air & Sampah</span>:
            </p>
            <div class="mt-2 font-mono text-xs text-surface-700 space-y-1">
              <div>• Sampah: {{ formatCurrency(configForm.dues_trash_flat) }}</div>
              <div>• Air (10 m³ Pertama): {{ formatCurrency(configForm.water_min_fee) }}</div>
              <div>• Ekstra Air (5 m³ &times; {{ configForm.water_price_per_cubic }}): {{ formatCurrency(5 * configForm.water_price_per_cubic) }}</div>
              <div class="font-bold text-primary text-sm pt-1 border-t border-dashed mt-1">
                Total: {{ formatCurrency(configForm.dues_trash_flat + configForm.water_min_fee + (5 * configForm.water_price_per_cubic)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SiteConfig } from "~/types";
import { DEFAULT_SITE_CONFIG } from "~/types";

useHead({ title: "Master Parameter Tarif - IPL Manager" });

const { getSiteConfig } = useDatabase();
const toast = useToast();

const isLoading = ref(false);
const isSaving = ref(false);

const configForm = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG });

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

async function loadCurrentConfig() {
  isLoading.value = true;
  try {
    const data = await getSiteConfig();
    if (data) {
      configForm.value = {
        dues_trash_flat: data.dues_trash_flat ?? DEFAULT_SITE_CONFIG.dues_trash_flat,
        water_min_fee: data.water_min_fee ?? DEFAULT_SITE_CONFIG.water_min_fee,
        water_price_per_cubic: data.water_price_per_cubic ?? DEFAULT_SITE_CONFIG.water_price_per_cubic,
      };
    }
  } catch (e) {
    console.error(e);
    toast.show("Gagal memuat konfigurasi dari cloud.", "error");
  } finally {
    isLoading.value = false;
  }
}

async function saveConfig() {
  isSaving.value = true;
  try {
    await $fetch("/api/config", {
      method: "POST",
      body: configForm.value,
    });
    toast.show("Master data tarif berhasil diperbarui!", "success");
  } catch (e) {
    console.error(e);
    toast.show("Gagal menyimpan perubahan konfigurasi.", "error");
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadCurrentConfig();
});
</script>