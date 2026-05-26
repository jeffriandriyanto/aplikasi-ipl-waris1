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
        <button
          id="refresh-data"
          class="btn-ghost p-2.5"
          @click="loadData"
          :disabled="isLoading"
        >
          <svg
            :class="['w-5 h-5', { 'animate-spin': isLoading }]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div class="stat-card group">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span class="badge-paid text-[10px]">Kas Masuk</span>
        </div>
        <p id="stat-total-kas" class="text-2xl font-bold text-primary mb-1">{{ formatCurrency(stats.totalKasMasuk) }}</p>
        <p class="text-xs text-surface-500">Total kas bulan ini</p>
      </div>

      <div class="stat-card group">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          <span class="badge-occupied text-[10px]">Terisi</span>
        </div>
        <p id="stat-rumah-terisi" class="text-2xl font-bold text-primary mb-1">{{ stats.totalRumahTerisi }}</p>
        <p class="text-xs text-surface-500">Rumah ditinggali &amp; disewakan</p>
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden">
      <div
        class="px-6 py-4 border-b border-surface-700/50 flex items-center justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-white">Data Iuran</h2>
          <p class="text-xs text-surface-500 mt-0.5">
            {{ records.length }} record
          </p>
        </div>
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="search-records"
            v-model="searchQuery"
            type="text"
            placeholder="Cari blok / rumah..."
            class="input-field pl-10 py-2 text-sm w-56"
          />
        </div>
      </div>

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
        v-else-if="filteredRecords.length === 0"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <p class="text-surface-400 text-sm mb-3">
          Belum ada data untuk periode ini.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Blok</th>
              <th>No. Rumah</th>
              <th>Status Rumah</th>
              <th>Jenis Iuran</th>
              <th>Nominal</th>
              <th>Status Iuran</th>
              <th>Meter Lalu</th>
              <th>Meter Skrg</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filteredRecords" :key="r.id || i">
              <td class="text-surface-500 font-mono text-xs">{{ i + 1 }}</td>
              <td class="font-medium text-white">{{ r.block }}</td>
              <td class="font-mono">{{ r.house_number }}</td>
              <td>
                <span :class="statusBadge(r.status_rumah)">{{
                  r.status_rumah
                }}</span>
              </td>
              <td class="text-surface-300">{{ r.jenis_iuran }}</td>
              <td class="font-mono text-emerald-400">
                {{ formatCurrency(calculateTotal(r)) }}
              </td>
              <td>
                <span
                  :class="
                    r.status_iuran === 'Terbayarkan'
                      ? 'badge-paid'
                      : 'badge-unpaid'
                  "
                >
                  {{ r.status_iuran === "Terbayarkan" ? "Terbayarkan" : "Belum Terbayarkan" }}
                </span>
              </td>
              <td class="font-mono text-surface-400">
                {{ r.water_meter_past }}
              </td>
              <td class="font-mono text-white">{{ r.water_meter_current }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, DashboardStats, SiteConfig } from "~/types";
import { DEFAULT_SITE_CONFIG } from "~/types";
definePageMeta({ layout: 'client' })
useHead({ title: 'Dashboard - IPL Manager' })

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase()
const periodOptions = generatePeriodOptions()
const selectedPeriod = ref(getCurrentPeriod())
const records = ref<IplRecord[]>([])
const siteConfig = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG })
const isLoading = ref(true)
const searchQuery = ref("")

function calculateTotal(r: IplRecord): number {
  const usage = Math.max(0, r.water_meter_current - r.water_meter_past)
  const cfg = siteConfig.value
  let total = 0
  
  if (r.jenis_iuran.includes('Sampah')) {
    total += cfg.dues_trash_flat || 25000
  }
  
  if (r.jenis_iuran.includes('Air')) {
    const minFee = cfg.water_min_fee || 25000
    const pricePerCubic = cfg.water_price_per_cubic || 3500

    if (r.status_rumah === 'Kosong' && usage === 0) {
      // Tidak ada biaya air
    } else {
      if (usage <= 10) {
        total += minFee
      } else {
        total += minFee + ((usage - 10) * pricePerCubic)
      }
    }
  }
  return total
}

const stats = computed<DashboardStats>(() => {
  let totalKasMasuk = 0
  let totalRumahTerisi = 0
  let totalPaid = 0
  let totalUnpaid = 0

  records.value.forEach(r => {
    if (r.status_rumah === 'Ditinggali' || r.status_rumah === 'Disewakan') {
      totalRumahTerisi++
    }
    if (r.status_iuran === 'Terbayarkan') {
      totalPaid++
      totalKasMasuk += calculateTotal(r)
    } else {
      totalUnpaid++
    }
  })

  return { totalKasMasuk, totalRumahTerisi, totalPaid, totalUnpaid }
})

const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value;
  const q = searchQuery.value.toLowerCase();
  return records.value.filter(
    (r) =>
      r.block.toLowerCase().includes(q) ||
      r.house_number.toLowerCase().includes(q),
  );
});

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function statusBadge(s: string) {
  if (s === "Ditinggali") return "badge-occupied";
  if (s === "Disewakan") return "badge-rented";
  return "badge-vacant";
}

async function loadData() {
  isLoading.value = true;
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
    records.value = res.records.filter(r => r.updated_at !== null);
  } catch {
    records.value = [];
  } finally {
    isLoading.value = false;
  }
}

watch(selectedPeriod, () => loadData());
onMounted(() => loadData());
</script>
