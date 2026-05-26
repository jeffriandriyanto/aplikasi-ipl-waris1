<template>
  <div class="page-container">
    <div
      v-if="isSaving"
      class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm"
    >
      <div
        class="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-scale-in"
      >
        <svg
          class="w-10 h-10 text-primary animate-spin"
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
        <p class="text-surface-800 font-semibold">Menyimpan data ke Cloud...</p>
      </div>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="page-title">Input Bulanan</h1>
        <p class="page-subtitle">
          Sprint bulanan — kelola data iuran per periode
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <select
          id="input-period-selector"
          v-model="selectedPeriod"
          class="select-field min-w-[200px] text-sm"
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
          id="load-period"
          class="btn-secondary text-sm"
          @click="loadPeriod"
          :disabled="isLoading"
        >
          <svg
            :class="['w-4 h-4', { 'animate-spin': isLoading }]"
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
          Muat Data
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3">
        <svg
          class="w-8 h-8 text-primary animate-spin"
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
        <p class="text-sm text-surface-500">Memuat data...</p>
      </div>
    </div>

    <div
      v-else-if="records.length === 0 && !hasLoaded"
      class="flex flex-col items-center justify-center py-32"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4"
      >
        <svg
          class="w-8 h-8 text-surface-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p class="text-surface-400 text-sm mb-1">
        Pilih periode dan klik "Muat Data"
      </p>
      <p class="text-surface-600 text-xs">
        Data akan dibuat otomatis jika belum ada.
      </p>
    </div>

    <template v-else>
      <div
        v-if="isGenerated"
        class="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm"
      >
        <svg
          class="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Data baru di-generate dari master rumah. Meter air bulan lalu dicopy
        otomatis. Jangan lupa klik "Sync to Cloud"!
      </div>

      <div
        class="glass-card mb-6 sticky top-0 z-30 shadow-sm border-b border-surface-200"
      >
        <div
          class="p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              v-model="filterBlock"
              class="select-field py-2 text-sm min-w-[120px] flex-1 md:flex-none"
            >
              <option value="All">Semua Blok</option>
              <option v-for="b in uniqueBlocks" :key="b" :value="b">
                {{ b }}
              </option>
            </select>
            <select
              v-model="filterHouseStatus"
              class="select-field py-2 text-sm min-w-[140px] flex-1 md:flex-none"
            >
              <option value="All">Semua Status Rumah</option>
              <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">
                {{ s || "(Belum diset)" }}
              </option>
            </select>
            <select
              v-model="filterPaymentStatus"
              class="select-field py-2 text-sm min-w-[150px] flex-1 md:flex-none"
            >
              <option value="All">Semua Status Iuran</option>
              <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">
                {{ p }}
              </option>
            </select>
          </div>
          <div class="relative w-full md:w-64">
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
              v-model="searchQuery"
              type="text"
              placeholder="Cari No Rumah / Blok..."
              class="input-field pl-9 py-2 text-sm w-full"
            />
          </div>
        </div>
      </div>

      <div class="glass-card overflow-hidden mb-6">
        <div
          class="px-6 py-4 border-b border-surface-200 flex items-center justify-between"
        >
          <div>
            <h2 class="text-lg font-semibold text-surface-900">
              Data Periode {{ selectedPeriod }}
            </h2>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ filteredRecords.length }} rumah ditampilkan
            </p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Blok</th>
                <th>No. Rumah</th>
                <th>Status Rumah</th>
                <th>Jenis Iuran</th>
                <th class="min-w-[150px]">Status Iuran</th>
                <th>Meter Lalu</th>
                <th>Meter Skrg</th>
                <th>Penggunaan</th>
                <th>Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in filteredRecords"
                :key="i"
                :class="{ 'bg-rose-50/50': isError(r) }"
              >
                <td class="text-surface-500 font-mono text-xs">{{ i + 1 }}</td>
                <td class="font-medium text-surface-900">{{ r.block }}</td>
                <td class="font-mono">{{ r.house_number }}</td>
                <td>
                  <select
                    v-model="r.status_rumah"
                    class="select-field py-1.5 text-xs"
                    :class="{
                      'ring-rose-400 border-rose-400': r.status_rumah === '',
                    }"
                  >
                    <option
                      v-for="s in HOUSE_STATUS_OPTIONS"
                      :key="s"
                      :value="s"
                    >
                      {{ s === "" ? "Pilih Status..." : s }}
                    </option>
                  </select>
                </td>
                <td>
                  <select
                    v-model="r.jenis_iuran"
                    class="select-field py-1.5 text-xs"
                  >
                    <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">
                      {{ d }}
                    </option>
                  </select>
                </td>
                <td>
                  <select
                    v-model="r.status_iuran"
                    class="select-field py-1.5 text-xs"
                  >
                    <option
                      v-for="p in PAYMENT_STATUS_OPTIONS"
                      :key="p"
                      :value="p"
                    >
                      {{ p }}
                    </option>
                  </select>
                </td>
                <td class="font-mono text-surface-400 text-sm">
                  {{ r.water_meter_past }}
                </td>
                <td class="relative group">
                  <input
                    v-model.number="r.water_meter_current"
                    type="number"
                    min="0"
                    class="input-field py-1.5 text-xs font-mono w-20"
                    :class="{
                      'border-rose-500 ring-rose-500 bg-rose-50 text-rose-900':
                        isError(r),
                    }"
                  />
                  <div
                    v-if="isError(r)"
                    class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-rose-600 text-white text-[10px] rounded-lg shadow-lg z-50 text-center"
                  >
                    Meteran sekarang tidak boleh lebih kecil dari meteran lalu!
                    <div
                      class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"
                    ></div>
                  </div>
                </td>
                <td
                  class="font-mono font-medium"
                  :class="
                    usageValue(r) > 0 ? 'text-brand-600' : 'text-surface-400'
                  "
                >
                  {{ usageValue(r) }} m³
                </td>
                <td class="font-mono font-bold text-primary">
                  {{ formatCurrency(calculateTotal(r)) }}
                </td>
              </tr>
              <tr v-if="filteredRecords.length === 0">
                <td
                  colspan="10"
                  class="text-center py-8 text-surface-500 text-sm"
                >
                  Tidak ada data yang cocok dengan filter pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end mt-6 pb-10">
        <button
          id="sync-to-cloud"
          class="btn-primary text-base px-8 py-3"
          @click="syncToCloud"
          :disabled="isSaving || hasErrors"
        >
          <svg
            v-if="!isSaving"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 animate-spin"
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
          <span class="ml-2">{{
            isSaving
              ? "Menyimpan..."
              : hasErrors
                ? "Ada Error di Form!"
                : "Sync to Cloud"
          }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig } from "~/types";
import {
  HOUSE_STATUS_OPTIONS,
  DUES_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  DEFAULT_SITE_CONFIG,
} from "~/types";

useHead({ title: "Input Bulanan - IPL Manager" });

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } =
  useDatabase();
const toast = useToast();

const periodOptions = generatePeriodOptions();
const selectedPeriod = ref(getCurrentPeriod());
const records = ref<IplRecord[]>([]);
const siteConfig = ref<SiteConfig>(DEFAULT_SITE_CONFIG);
const isLoading = ref(false);
const isSaving = ref(false);
const hasLoaded = ref(false);
const isGenerated = ref(false);

// Filters
const filterBlock = ref("All");
const filterHouseStatus = ref("All");
const filterPaymentStatus = ref("All");
const searchQuery = ref("");

const uniqueBlocks = computed(() => {
  const blocks = new Set<string>();
  records.value.forEach((r) => blocks.add(r.block));
  return Array.from(blocks).sort();
});

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    if (filterBlock.value !== "All" && r.block !== filterBlock.value)
      return false;
    if (
      filterHouseStatus.value !== "All" &&
      r.status_rumah !== filterHouseStatus.value
    )
      return false;
    if (
      filterPaymentStatus.value !== "All" &&
      r.status_iuran !== filterPaymentStatus.value
    )
      return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      if (
        !r.house_number.toLowerCase().includes(q) &&
        !r.block.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
});

const hasErrors = computed(() => {
  return records.value.some((r) => isError(r) || r.status_rumah === "");
});

function isError(r: IplRecord) {
  return r.water_meter_current < r.water_meter_past;
}

function usageValue(r: IplRecord): number {
  return Math.max(0, r.water_meter_current - r.water_meter_past);
}

function calculateTotal(r: IplRecord): number {
  const usage = usageValue(r);
  const cfg = siteConfig.value;

  let total = 0;

  // 1. Biaya Sampah Flat
  if (r.jenis_iuran.includes("Sampah")) {
    total += cfg.dues_trash_flat || 25000;
  }

  // 2. Biaya Air Progresif Berdasarkan Kuota Minimum 10m3
  if (r.jenis_iuran.includes("Air")) {
    const minFee = cfg.water_min_fee || 25000;
    const pricePerCubic = cfg.water_price_per_cubic || 3500;

    // Jika status rumah kosong dan pemakaian benar-benar nol (tidak ada kebocoran),
    // dibebaskan dari biaya minimal air bulanan.
    if (r.status_rumah === "Kosong" && usage === 0) {
      // Biaya air tetap 0
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

async function loadPeriod() {
  isLoading.value = true;
  hasLoaded.value = true;
  try {
    siteConfig.value = await getSiteConfig();

    const res = await $fetch<{ records: IplRecord[]; isGenerated: boolean }>(
      "/api/ipl",
      {
        query: { period: selectedPeriod.value },
      },
    );

    records.value = res.records;
    isGenerated.value = res.isGenerated;

    if (res.isGenerated) {
      toast.show("Data baru di-generate. Cek status kosong!", "info");
    }
  } catch (e) {
    console.error(e);
    toast.show("Gagal memuat data.", "error");
    records.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function syncToCloud() {
  if (records.value.length === 0 || hasErrors.value) return;
  isSaving.value = true;
  try {
    await $fetch("/api/ipl/sync", {
      method: "POST",
      body: { records: records.value },
    });
    isGenerated.value = false;
    toast.show("Data berhasil disimpan ke cloud!", "success");
  } catch (e) {
    console.error(e);
    toast.show("Gagal menyimpan data.", "error");
  } finally {
    isSaving.value = false;
  }
}
</script>
