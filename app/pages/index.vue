<template>
  <div class="page-container">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Monitor iuran bulanan dan statistik kas</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          id="period-selector"
          v-model="selectedPeriod"
          class="select-field min-w-[220px] text-sm"
        >
          <option
            v-for="opt in periodOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div class="stat-card group">
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          >
            <svg
              class="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="badge-paid text-[10px]">Kas Masuk</span>
        </div>
        <p id="stat-total-kas" class="text-2xl font-bold text-primary mb-1">
          {{ formatCurrency(stats.totalKasMasuk) }}
        </p>
        <p class="text-xs text-surface-400">Total kas bulan ini</p>
      </div>

      <div class="stat-card group">
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          >
            <svg
              class="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <span class="badge-occupied text-[10px]">Terisi</span>
        </div>
        <p id="stat-rumah-terisi" class="text-2xl font-bold text-primary mb-1">
          {{ stats.totalRumahTerisi }}
        </p>
        <p class="text-xs text-surface-400">Rumah ditinggali &amp; disewakan</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="glass-card mb-8 overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-700/50 bg-brand-500/5">
        <h2 class="text-lg font-semibold text-black">Cek Tagihan Anda</h2>
        <p class="text-sm text-surface-500">Pilih blok dan masukkan nomor rumah Anda</p>
      </div>
      <div class="p-6">
        <form @submit.prevent="searchBill" class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="w-full sm:w-1/3">
            <label class="block text-sm font-medium text-surface-700 mb-1">Blok Rumah</label>
            <select v-model="selectedBlock" class="select-field w-full text-sm" required>
              <option value="" disabled>Pilih Blok...</option>
              <option v-for="b in availableBlocks" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
          <div class="w-full sm:w-1/3">
            <label class="block text-sm font-medium text-surface-700 mb-1">Nomor Rumah</label>
            <input 
              v-model="searchHouseNumber" 
              type="text" 
              class="input-field w-full text-sm" 
              placeholder="Contoh: 12"
              required
            />
          </div>
          <div class="w-full sm:w-1/3">
            <button type="submit" class="btn-primary w-full py-2.5" :disabled="isLoading">
              <svg v-if="!isLoading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <svg v-else class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cari Tagihan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Search Results -->
    <div class="glass-card overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <svg
          class="w-8 h-8 text-brand-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <div
        v-else-if="!hasLoaded"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-surface-600 font-medium mb-1">Silakan cari tagihan Anda</p>
        <p class="text-surface-400 text-sm text-center">Hasil pencarian akan tampil di sini.</p>
      </div>

      <div
        v-else-if="filteredRecords.length === 0"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <p class="text-surface-400 text-sm mb-3">
          Tagihan tidak ditemukan untuk Blok {{ lastSearchedBlock }} No. {{ lastSearchedHouseNumber }}
        </p>
      </div>



      <div v-else class="p-6 grid gap-4">
        <div
          v-for="(r, i) in filteredRecords"
          :key="r.id || i"
          class="rounded-2xl border border-surface-700/50 bg-gray-800 p-5 hover:border-primary/40 transition"
        >
          <div class="flex items-start justify-between mb-5">
            <div>
              <h3 class="text-lg font-semibold text-white">
                {{ r.block }}
              </h3>

              <p class="text-surface-400 text-lg">{{ r.house_number }}</p>
            </div>

            <span :class="statusBadge(r.status_rumah)">
              {{ r.status_rumah }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-surface-400 mb-1">Jenis Iuran</p>

              <p class="text-white">
                {{ r.jenis_iuran }}
              </p>
            </div>

            <div>
              <p class="text-surface-400 mb-1">Nominal</p>

              <p class="font-semibold text-emerald-400">
                {{ formatCurrency(calculateTotal(r)) }}
              </p>
            </div>

            <div>
              <p class="text-surface-400 mb-1">Status Pembayaran</p>

              <span
                :class="
                  r.status_iuran === 'Terbayarkan'
                    ? 'badge-paid'
                    : 'badge-unpaid'
                "
              >
                {{
                  r.status_iuran === "Terbayarkan"
                    ? "Terbayarkan"
                    : "Belum Terbayarkan"
                }}
              </span>
            </div>

            <div>
              <p class="text-surface-400 mb-1">Meter Air</p>

              <p class="font-mono text-white">
                {{ r.water_meter_past }}
                →
                {{ r.water_meter_current }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, DashboardStats, SiteConfig, House } from "~/types";
import { DEFAULT_SITE_CONFIG } from "~/types";
definePageMeta({ layout: "client" });
useHead({ title: "Dashboard - IPL Manager" });

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } =
  useDatabase();
const periodOptions = generatePeriodOptions();
const selectedPeriod = ref(getCurrentPeriod());
const records = ref<IplRecord[]>([]);
const siteConfig = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG });
const isLoading = ref(false);
const hasLoaded = ref(false);

const selectedBlock = ref("");
const searchHouseNumber = ref("");
const lastSearchedBlock = ref("");
const lastSearchedHouseNumber = ref("");

// Fetch houses on mount for block dropdown
const { data: houses } = useFetch<House[]>("/api/houses", {
  default: () => [],
});

const availableBlocks = computed(() => {
  if (!houses.value || houses.value.length === 0) return [];
  const blocks = new Set<string>();
  houses.value.forEach((h) => blocks.add(h.block));
  return Array.from(blocks).sort();
});

function calculateTotal(r: IplRecord): number {
  const usage = Math.max(0, r.water_meter_current - r.water_meter_past);
  const cfg = siteConfig.value;
  let total = 0;

  if (r.jenis_iuran.includes("Sampah")) {
    total += cfg.dues_trash_flat || 25000;
  }

  if (r.jenis_iuran.includes("Air")) {
    const minFee = cfg.water_min_fee || 25000;
    const pricePerCubic = cfg.water_price_per_cubic || 3500;

    if (r.status_rumah === "Kosong" && usage === 0) {
      // Tidak ada biaya air
    } else {
      if (usage <= 10) {
        total += minFee;
      } else {
        total += minFee + (usage - 10) * pricePerCubic;
      }
    }
  }
  return total;
}

const stats = computed<DashboardStats>(() => {
  let totalKasMasuk = 0;
  let totalRumahTerisi = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;

  records.value.forEach((r) => {
    if (r.status_rumah === "Ditinggali" || r.status_rumah === "Disewakan") {
      totalRumahTerisi++;
    }
    if (r.status_iuran === "Terbayarkan") {
      totalPaid++;
      totalKasMasuk += calculateTotal(r);
    } else {
      totalUnpaid++;
    }
  });

  return { totalKasMasuk, totalRumahTerisi, totalPaid, totalUnpaid };
});

const filteredRecords = computed(() => {
  if (!hasLoaded.value) return [];
  
  const b = lastSearchedBlock.value;
  const hn = lastSearchedHouseNumber.value.trim().toLowerCase();

  return records.value.filter((r) => {
    return (
      r.block === b &&
      r.house_number.toLowerCase() === hn
    );
  });
});

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function statusBadge(s: string) {
  if (s === "Ditinggali") return "badge-vacant";
  if (s === "Disewakan") return "badge-rented";
  return "badge-occupied";
}

async function searchBill() {
  if (!selectedBlock.value || !searchHouseNumber.value.trim()) return;
  
  lastSearchedBlock.value = selectedBlock.value;
  lastSearchedHouseNumber.value = searchHouseNumber.value;
  
  isLoading.value = true;
  hasLoaded.value = false;
  try {
    const config = await getSiteConfig();
    if (config) {
      siteConfig.value = config;
    }

    const res = await $fetch<{ records: IplRecord[]; isGenerated: boolean }>(
      "/api/ipl",
      {
        query: { period: selectedPeriod.value },
      },
    );

    // Tampilkan HANYA data yang benar-benar sudah ada di database Firebase
    // Record mock/bayangan yang digenerate oleh server akan memiliki updated_at: null
    records.value = res.records.filter((r) => r.updated_at !== null);
    hasLoaded.value = true;
  } catch {
    records.value = [];
  } finally {
    isLoading.value = false;
  }
}
</script>
