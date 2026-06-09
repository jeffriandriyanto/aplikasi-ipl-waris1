<template>
  <div class="page-container">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Monitor iuran bulanan dan statistik kas</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
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
          class="btn-primary text-sm"
          @click="loadData"
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
          <span class="ml-2">Muat Data</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div class="stat-card group">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span class="badge-paid text-[10px]">Kas Masuk</span>
        </div>
        <p id="stat-total-kas" class="text-2xl font-bold text-primary mb-1">{{ formatCurrency(stats.totalKasMasuk) }}</p>
        <p class="text-xs text-surface-500">Total kas dari iuran terbayar</p>
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

    <div class="glass-card overflow-hidden" id="dashboard-export-target">
      <div class="px-6 py-4 border-b border-surface-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-semibold text-surface-900">Data Iuran</h2>
          <p class="text-xs text-surface-500 mt-0.5">
            {{ records.length }} record
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-ghost text-xs" @click="exportCSV" :disabled="!hasLoaded || records.length === 0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button class="btn-ghost text-xs" @click="exportPDF" :disabled="!hasLoaded || records.length === 0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
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
        v-else-if="!hasLoaded"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-surface-600 font-medium mb-1">Pilih periode dan klik "Muat Data"</p>
        <p class="text-surface-400 text-sm text-center">Data hanya dimuat saat diminta untuk menghemat kuota pembacaan database.</p>
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
              <td class="font-medium text-surface-900">{{ r.block }}</td>
              <td class="font-mono">{{ r.house_number }}</td>
              <td>
                <span :class="statusBadge(r.status_rumah)">{{
                  r.status_rumah
                }}</span>
              </td>
              <td class="text-surface-600">{{ r.jenis_iuran }}</td>
              <td class="font-mono text-primary font-semibold">
                {{ formatCurrency(calculateTotal(r, siteConfig)) }}
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
              <td class="font-mono text-surface-500">
                {{ r.water_meter_past }}
              </td>
              <td class="font-mono text-surface-900">{{ r.water_meter_current }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, DashboardStats, SiteConfig } from '~/types'
import { DEFAULT_SITE_CONFIG } from '~/types'

useHead({ title: 'Dashboard - IPL Manager' })

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase()
const { calculateTotal, formatCurrency, statusBadge, matchHouseNumber, sanitizeCsvField } = useBilling()
const toast = useToast()

const periodOptions = generatePeriodOptions()
const selectedPeriod = ref(getCurrentPeriod())
const records = ref<IplRecord[]>([])
const siteConfig = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG })
const isLoading = ref(false)
const hasLoaded = ref(false)
const searchQuery = ref('')

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
      totalKasMasuk += calculateTotal(r, siteConfig.value)
    } else {
      totalUnpaid++
    }
  })

  return { totalKasMasuk, totalRumahTerisi, totalPaid, totalUnpaid }
})

const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value
  const q = searchQuery.value.trim()
  return records.value.filter(
    (r) =>
      r.block.toLowerCase().includes(q.toLowerCase()) ||
      matchHouseNumber(r.house_number, q),
  )
})

async function loadData() {
  isLoading.value = true
  try {
    const [config, res] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>('/api/ipl', {
        query: { period: selectedPeriod.value, _t: Date.now() },
      }),
    ])

    if (config) {
      siteConfig.value = config
    }

    records.value = res.records.filter(r => r.updated_at !== null)
    hasLoaded.value = true
  } catch {
    records.value = []
  } finally {
    isLoading.value = false
  }
}

function exportCSV() {
  const headers = ['Blok', 'No Rumah', 'Status Rumah', 'Jenis Iuran', 'Status Iuran', 'Meter Lalu', 'Meter Skrg', 'Penggunaan (m3)', 'Nominal (Rp)']
  const rows = filteredRecords.value.map(r => [
    sanitizeCsvField(r.block),
    sanitizeCsvField(r.house_number),
    sanitizeCsvField(r.status_rumah),
    sanitizeCsvField(r.jenis_iuran),
    sanitizeCsvField(r.status_iuran),
    r.water_meter_past,
    r.water_meter_current,
    Math.max(0, r.water_meter_current - r.water_meter_past),
    calculateTotal(r, siteConfig.value),
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Dashboard_${selectedPeriod.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportPDF() {
  if (filteredRecords.value.length > 100) {
    toast.show('Data terlalu besar untuk PDF. Gunakan CSV untuk data >100 baris.', 'info')
    return
  }
  const html2pdf = (await import('html2pdf.js')).default
  const element = document.getElementById('dashboard-export-target')
  if (!element) return
  html2pdf()
    .set({
      margin: 10,
      filename: `Dashboard_${selectedPeriod.value}.pdf`,
      html2canvas: { scale: 1 },
      jsPDF: { orientation: 'landscape' },
    })
    .from(element)
    .save()
}
</script>
