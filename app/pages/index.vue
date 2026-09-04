<template>
  <div class="mobile-container">
    <!-- <div class="mb-6">
      <h1 class="text-xl font-bold text-surface-900">Ringkasan Keuangan</h1>
      <p class="text-sm text-surface-500 mt-1">Informasi kas warga Perumahan Waris</p>
    </div> -->

    <!-- <div v-if="globalLoading" class="flex items-center justify-center py-12">
      <svg class="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div> -->

    <!-- <template v-else-if="globalSummary"> -->
      <!-- <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          <p class="text-[10px] text-surface-400 mb-1">Saldo Kas Global</p>
          <p class="text-lg font-bold" :class="globalSummary.globalSaldo >= 0 ? 'text-primary' : 'text-rose-600'">
            {{ formatCurrency(globalSummary.globalSaldo) }}
          </p>
          <p class="text-[10px] text-surface-400 mt-0.5">Total seluruh periode</p>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="globalSummary.currentPeriodStats.totalUnpaid === 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'">
              <svg v-if="globalSummary.currentPeriodStats.totalUnpaid === 0" class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-[10px] text-surface-400 mb-1">Iuran Bulan Ini</p>
          <p class="text-lg font-bold" :class="globalSummary.currentPeriodStats.totalUnpaid === 0 ? 'text-emerald-600' : 'text-amber-600'">
            {{ globalSummary.currentPeriodStats.totalPaid }}/{{ globalSummary.currentPeriodStats.totalOccupied }}
          </p>
          <p class="text-[10px] text-surface-400 mt-0.5">
            {{ globalSummary.currentPeriodStats.totalUnpaid === 0 ? 'Semua lunas' : globalSummary.currentPeriodStats.totalUnpaid + ' belum bayar' }}
          </p>
        </div>
      </div>

      <div class="glass-card mb-4 overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-200">
          <h2 class="text-sm font-semibold text-surface-900">Tren Keuangan 6 Bulan</h2>
        </div>
        <div class="p-4">
          <div v-if="chartReady" class="h-52">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>
      </div>

      <div class="glass-card mb-4 overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-200">
          <h2 class="text-sm font-semibold text-surface-900">Alokasi Pengeluaran</h2>
          <p class="text-[10px] text-surface-500 mt-0.5">Periode berjalan</p>
        </div>
        <div class="p-4">
          <div v-if="hasDonutData && chartReady" class="flex items-center gap-4">
            <div class="w-36 h-36 flex-shrink-0">
              <Doughnut :data="donutChartData" :options="donutChartOptions" />
            </div>
            <div class="flex-1 space-y-1.5">
              <div v-for="(amount, cat) in globalSummary.pengeluaranByCategory" :key="cat" class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: donutColorFor(cat as string) }"></span>
                  <span class="text-surface-600 truncate">{{ cat }}</span>
                </div>
                <span class="font-mono font-medium text-surface-800 ml-2">{{ formatCurrency(amount) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6">
            <p class="text-xs text-surface-400">Belum ada pengeluaran periode ini.</p>
          </div>
        </div>
      </div> -->

      <!-- <div class="glass-card mb-4 overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-200">
          <h2 class="text-sm font-semibold text-surface-900">Transaksi Terbaru</h2>
          <p class="text-[10px] text-surface-500 mt-0.5">Maks. 5 transaksi terakhir</p>
        </div>
        <div v-if="globalSummary.latestTransactions.length === 0" class="text-center py-6">
          <p class="text-xs text-surface-400">Belum ada transaksi.</p>
        </div>
        <div v-else class="divide-y divide-surface-100">
          <div v-for="tx in globalSummary.latestTransactions" :key="tx.id" class="px-4 py-3 flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-800 truncate">{{ tx.description }}</p>
              <p class="text-[10px] text-surface-400">{{ tx.category }} &middot; {{ tx.date }}</p>
            </div>
            <span class="font-mono text-sm font-semibold ml-3 flex-shrink-0" :class="tx.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'">
              {{ tx.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
            </span>
          </div>
        </div>
      </div> -->

      <div class="glass-card mb-6 overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-200">
          <h2 class="text-base font-semibold text-surface-900">Cek Tagihan Anda</h2>
          <p class="text-xs text-surface-500 mt-0.5">Pilih blok dan masukkan nomor rumah</p>
        </div>
        <div class="p-5">
          <form @submit.prevent="searchBill" class="space-y-4">
            <div>
              <label class="label-field">Blok Rumah</label>
              <select v-model="selectedBlock" class="select-field text-sm" required>
                <option value="" disabled>Pilih Blok...</option>
                <option v-for="b in availableBlocks" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Nomor Rumah</label>
              <input v-model="searchHouseNumber" type="text" class="input-field text-sm" placeholder="Contoh: 12 atau 34" required />
              <p class="text-[11px] text-surface-400 mt-1">Untuk rumah dengan nomor ganda (misal "34 & 38"), cukup ketik salah satu.</p>
            </div>
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
          </form>
        </div>

        <div v-if="isLoading" class="flex items-center justify-center py-12 border-t border-surface-200">
          <div class="flex flex-col items-center gap-3">
            <svg class="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-xs text-surface-500">Mencari tagihan...</p>
          </div>
        </div>

        <div v-else-if="!hasLoaded" class="flex flex-col items-center justify-center py-12 px-4 border-t border-surface-200">
          <p class="text-surface-400 text-xs text-center">Hasil pencarian akan tampil di sini.</p>
        </div>

        <div v-else-if="filteredRecords.length === 0" class="flex flex-col items-center justify-center py-12 px-4 border-t border-surface-200">
          <p class="text-surface-600 font-medium text-sm mb-1">Tagihan tidak ditemukan</p>
          <p class="text-surface-400 text-xs text-center">Blok {{ lastSearchedBlock }} No. {{ lastSearchedHouseNumber }} tidak ditemukan.</p>
        </div>

        <div v-else class="p-4 space-y-3 border-t border-surface-200">
          <div v-for="(r, i) in filteredRecords" :key="r.id || i" class="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary/30 transition-colors">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-base font-semibold text-surface-900">{{ r.block }}</h3>
                <p class="text-surface-500 text-sm">No. {{ r.house_number }}</p>
              </div>
              <span :class="statusBadge(r.status_rumah)" class="text-[10px]">{{ r.status_rumah }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-surface-400 text-xs mb-0.5">Jenis Iuran</p>
                <p class="text-surface-800 font-medium">{{ r.jenis_iuran }}</p>
              </div>
              <div>
                <p class="text-surface-400 text-xs mb-0.5">Nominal</p>
                <p class="font-semibold text-primary">{{ formatCurrency(calculateTotal(r, siteConfig)) }}</p>
              </div>
              <div>
                <p class="text-surface-400 text-xs mb-0.5">Status Pembayaran</p>
                <span :class="r.status_iuran === 'Terbayarkan' ? 'badge-paid' : 'badge-unpaid'" class="text-[10px]">
                  {{ r.status_iuran === 'Terbayarkan' ? 'Lunas' : 'Belum Lunas' }}
                </span>
              </div>
              <div>
                <p class="text-surface-400 text-xs mb-0.5">Meter Air</p>
                <p class="font-mono text-surface-800 text-sm">{{ r.water_meter_past }} -> {{ r.water_meter_current }}</p>
              </div>
            </div>

            <!-- Saldo Section -->
            <div class="mt-3 pt-3 border-t border-surface-100">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-surface-400">Saldo Sebelumnya</span>
                <span class="font-mono font-medium" :class="getSaldoClass(r.saldo_awal ?? 0)">
                  {{ formatCurrency(r.saldo_awal ?? 0) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="text-surface-400">Saldo Saat Ini</span>
                <span class="font-mono font-bold" :class="getSaldoClass(r.saldo_akhir ?? 0)">
                  {{ formatCurrency(r.saldo_akhir ?? 0) }}
                </span>
              </div>

              <!-- Warning: Ada tunggakan -->
              <div v-if="(r.saldo_akhir ?? 0) < 0"
                   class="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Ada tunggakan sebesar <strong>{{ formatCurrency(Math.abs(r.saldo_akhir ?? 0)) }}</strong></span>
              </div>

              <!-- Info: Ada kelebihan bayar -->
              <div v-else-if="(r.saldo_akhir ?? 0) > 0"
                   class="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ada kelebihan bayar sebesar <strong>{{ formatCurrency(r.saldo_akhir ?? 0) }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Riwayat Pembayaran -->
      <div v-if="hasLoaded && filteredRecords.length > 0" class="glass-card mb-6 overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-200">
          <h2 class="text-base font-semibold text-surface-900">Riwayat Pembayaran</h2>
        </div>

        <div v-if="isLoadingHistory" class="flex items-center justify-center py-12">
          <svg class="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <div v-else-if="historyRecords.length === 0" class="text-center py-8">
          <p class="text-xs text-surface-400">Belum ada riwayat pembayaran.</p>
        </div>

        <div v-else class="divide-y divide-surface-100">
          <div v-for="(hr, i) in historyRecords" :key="i"
               class="px-4 py-3"
               :class="hr.saldo_akhir < 0 ? 'bg-rose-50/50' : ''">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-surface-900 text-sm">{{ formatPeriodLabel(hr.period) }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    :class="hr.status_iuran === 'Terbayarkan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                {{ hr.status_iuran === 'Terbayarkan' ? 'Lunas' : 'Belum' }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p class="text-surface-400">Tagihan</p>
                <p class="font-mono font-medium">{{ formatCurrency(hr.tagihan) }}</p>
              </div>
              <div>
                <p class="text-surface-400">Meter Air</p>
                <p class="font-mono">{{ hr.water_meter_past }} → {{ hr.water_meter_current }}</p>
              </div>
              <div>
                <p class="text-surface-400">Dibayar</p>
                <p class="font-mono font-medium text-emerald-600">{{ formatCurrency(hr.amount_paid) }}</p>
              </div>
              <div>
                <p class="text-surface-400">Saldo</p>
                <p class="font-mono font-bold" :class="getSaldoClass(hr.saldo_akhir)">{{ formatCurrency(hr.saldo_akhir) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    <!-- </template> -->
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig, House } from '~/types'
import { DEFAULT_SITE_CONFIG } from '~/types'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

interface MonthTrend {
  period: string
  pemasukan: number
  pengeluaran: number
}

interface LatestTransaction {
  id: string
  period: string
  type: string
  category: string
  description: string
  amount: number
  date: string
}

interface GlobalSummaryData {
  globalSaldo: number
  totalPemasukan: number
  totalPengeluaran: number
  currentPeriodStats: {
    totalPaid: number
    totalUnpaid: number
    totalOccupied: number
    iuranTerkumpul: number
  }
  trendMonthly: MonthTrend[]
  pengeluaranByCategory: Record<string, number>
  latestTransactions: LatestTransaction[]
}

definePageMeta({ layout: 'client' })
useHead({ title: 'Ringkasan Keuangan - IPL Perumahan Waris' })

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase()
const { calculateTotal, formatCurrency, statusBadge, matchHouseNumber } = useBilling()

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

const globalLoading = ref(true)
const globalSummary = ref<GlobalSummaryData | null>(null)
const chartReady = ref(false)

const records = ref<IplRecord[]>([])
const siteConfig = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG })
const isLoading = ref(false)
const hasLoaded = ref(false)

const selectedBlock = ref('')
const searchHouseNumber = ref('')
const lastSearchedBlock = ref('')
const lastSearchedHouseNumber = ref('')

interface HistoryRecord {
  period: string
  water_meter_past: number
  water_meter_current: number
  amount_paid: number
  saldo_awal: number
  saldo_akhir: number
  status_iuran: string
  tagihan: number
}

const historyRecords = ref<HistoryRecord[]>([])
const isLoadingHistory = ref(false)

const { data: houses } = useFetch<House[]>('/api/houses', { default: () => [] })

const availableBlocks = computed(() => {
  if (!houses.value || houses.value.length === 0) return []
  const blocks = new Set<string>()
  houses.value.filter(h => h.is_active !== false).forEach((h) => blocks.add(h.block))
  return Array.from(blocks).sort()
})

function getSaldoClass(value: number): string {
  if (value > 0) return "text-emerald-600"
  if (value < 0) return "text-rose-600"
  return "text-surface-400"
}

const filteredRecords = computed(() => {
  if (!hasLoaded.value) return []
  const b = lastSearchedBlock.value
  const hn = lastSearchedHouseNumber.value.trim()
  return records.value.filter((r) => {
    if (r.block !== b) return false
    if (r.status_rumah !== 'Ditinggali' && r.status_rumah !== 'Disewakan') return false
    return matchHouseNumber(r.house_number, hn)
  })
})

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const idx = parseInt(month || '1', 10) - 1
  return `${MONTHS_SHORT[idx] || month} ${year}`
}

const DONUT_COLORS = ['#356853', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function donutColorFor(cat: string): string {
  const cats = Object.keys(globalSummary.value?.pengeluaranByCategory || {})
  const idx = cats.indexOf(cat)
  return DONUT_COLORS[idx % DONUT_COLORS.length] || '#94a3b8'
}

const hasDonutData = computed(() => {
  if (!globalSummary.value) return false
  return Object.keys(globalSummary.value.pengeluaranByCategory).length > 0
})

const barChartData = computed(() => ({
  labels: globalSummary.value?.trendMonthly.map(t => formatPeriodLabel(t.period)) || [],
  datasets: [
    {
      label: 'Pemasukan',
      data: globalSummary.value?.trendMonthly.map(t => t.pemasukan) || [],
      backgroundColor: 'rgba(53, 104, 83, 0.85)',
      borderRadius: 6,
      borderSkipped: false,
    },
    {
      label: 'Pengeluaran',
      data: globalSummary.value?.trendMonthly.map(t => t.pengeluaran) || [],
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 10 },
        callback: (v: any) => {
          if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + 'jt'
          if (v >= 1_000) return (v / 1_000).toFixed(0) + 'rb'
          return v
        },
      },
    },
  },
}

const donutChartData = computed(() => ({
  labels: Object.keys(globalSummary.value?.pengeluaranByCategory || {}),
  datasets: [{
    data: Object.values(globalSummary.value?.pengeluaranByCategory || {}),
    backgroundColor: Object.keys(globalSummary.value?.pengeluaranByCategory || {}).map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]),
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const donutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
      },
    },
  },
}

async function loadGlobalSummary() {
  globalLoading.value = true
  try {
    globalSummary.value = await $fetch<GlobalSummaryData>('/api/summary/global')
    await nextTick()
    chartReady.value = true
  } catch (e) {
    console.error('Failed to load global summary', e)
    globalSummary.value = null
  } finally {
    globalLoading.value = false
  }
}

async function searchBill() {
  if (!selectedBlock.value || !searchHouseNumber.value.trim()) return
  lastSearchedBlock.value = selectedBlock.value
  lastSearchedHouseNumber.value = searchHouseNumber.value
  isLoading.value = true
  hasLoaded.value = false
  historyRecords.value = []
  try {
    const [config, res] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>('/api/ipl', {
        query: { period: getCurrentPeriod() },
      }),
    ])
    if (config) siteConfig.value = config
    records.value = res.records.filter((r) => r.updated_at !== null)
    hasLoaded.value = true

    isLoadingHistory.value = true
    try {
      const historyRes = await $fetch<{ records: HistoryRecord[] }>('/api/ipl/history', {
        query: { block: selectedBlock.value, house_number: searchHouseNumber.value.trim() },
      })
      historyRecords.value = historyRes.records
    } catch {
      historyRecords.value = []
    } finally {
      isLoadingHistory.value = false
    }
  } catch {
    records.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // loadGlobalSummary()
})
</script>
