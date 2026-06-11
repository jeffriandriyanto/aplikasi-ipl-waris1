<template>
  <div class="page-container pb-24 md:pb-6">
    <div
      v-if="isSaving"
      class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm"
    >
      <div class="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-scale-in">
        <svg class="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-surface-800 font-semibold">Menyimpan data ke Cloud...</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Input Bulanan</h1>
        <p class="page-subtitle">Sprint bulanan — kelola data iuran per periode</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="selectedPeriod" class="select-field min-w-[200px] text-sm">
          <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button class="btn-secondary text-sm" @click="loadPeriod" :disabled="isLoading">
          <svg :class="['w-4 h-4', { 'animate-spin': isLoading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Muat Data
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-sm text-surface-500">Memuat data...</p>
      </div>
    </div>

    <div v-else-if="records.length === 0 && !hasLoaded" class="flex flex-col items-center justify-center py-32">
      <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-surface-400 text-sm mb-1">Pilih periode dan klik "Muat Data"</p>
      <p class="text-surface-600 text-xs">Data akan dibuat otomatis jika belum ada.</p>
    </div>

    <template v-else>
      <div v-if="isGenerated" class="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Data baru di-generate. Jangan lupa sync!
      </div>

      <div class="glass-card mb-4 sticky top-0 z-30 shadow-sm">
        <div class="p-3 space-y-3">
          <div class="flex gap-2">
            <select v-model="filterBlock" class="select-field py-2 text-sm flex-1">
              <option value="All">Semua Blok</option>
              <option v-for="b in uniqueBlocks" :key="b" :value="b">{{ b }}</option>
            </select>
            <select v-model="filterHouseStatus" class="select-field py-2 text-sm flex-1">
              <option value="All">Status Rumah</option>
              <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s || "(Belum)" }}</option>
            </select>
          </div>
          <div class="flex gap-2">
            <select v-model="filterPaymentStatus" class="select-field py-2 text-sm flex-1">
              <option value="All">Status Iuran</option>
              <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
            </select>
            <div class="relative flex-1">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="searchQuery" type="text" placeholder="Cari..." class="input-field pl-9 py-2 text-sm w-full" />
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <p class="text-xs text-surface-500">{{ filteredRecords.length }} rumah</p>
        <p class="text-xs font-medium text-primary">Tagihan belum lunas: {{ countUnpaid }}</p>
      </div>

      <!-- Mobile Card Layout -->
      <div class="md:hidden space-y-3 mb-4">
        <div
          v-for="(r, i) in filteredRecords"
          :key="i"
          class="rounded-xl border p-4 transition-colors"
          :class="isError(r) ? 'border-rose-300 bg-rose-50/50' : 'border-surface-200 bg-white'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-sm font-semibold text-surface-900">{{ r.block }} No. {{ r.house_number }}</p>
              <p class="text-[10px] text-surface-400">{{ usageValue(r) }} m³ pemakaian</p>
            </div>
            <span class="text-xs font-bold text-primary">{{ formatCurrency(calculateTotal(r, siteConfig)) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Status Rumah</label>
              <select v-model="r.status_rumah" class="select-field py-1.5 text-xs w-full" :class="{ 'ring-rose-400 border-rose-400': r.status_rumah === '' }">
                <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s === '' ? 'Pilih...' : s }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Jenis Iuran</label>
              <select v-model="r.jenis_iuran" class="select-field py-1.5 text-xs w-full">
                <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Status Iuran</label>
              <select v-model="r.status_iuran" class="select-field py-1.5 text-xs w-full">
                <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Meter Skrg</label>
              <input v-model.number="r.water_meter_current" type="number" min="0" class="input-field py-1.5 text-xs font-mono w-full" :class="{ 'border-rose-500 bg-rose-50': isError(r) }" />
              <p v-if="isError(r)" class="text-[10px] text-rose-600 mt-0.5">Tidak boleh kurang dari {{ r.water_meter_past }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-surface-100">
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Bayar (Rp)</label>
              <input v-model.number="r.amount_paid" type="number" min="0" class="input-field py-1.5 text-xs font-mono w-full" />
            </div>
            <div>
              <label class="text-[10px] text-surface-400 mb-0.5 block">Lebih/Kurang</label>
              <p class="font-mono text-xs font-semibold py-1.5" :class="getOverpaymentClass(r)">
                {{ formatCurrency(overpayment(r, siteConfig)) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table Layout -->
      <div class="hidden md:block glass-card overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-surface-200">
          <h2 class="text-lg font-semibold text-surface-900">Data Periode {{ selectedPeriod }}</h2>
          <p class="text-xs text-surface-500 mt-0.5">{{ filteredRecords.length }} rumah ditampilkan</p>
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
                <th class="min-w-[200px]">Status Iuran</th>
                <th>Meter Lalu</th>
                <th>Meter Skrg</th>
                <th>Penggunaan</th>
                <th>Tagihan (Rp)</th>
                <th>Bayar (Rp)</th>
                <th>Lebih/Kurang</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in filteredRecords" :key="i" :class="{ 'bg-rose-50/50': isError(r) }">
                <td class="text-surface-500 font-mono text-xs">{{ i + 1 }}</td>
                <td class="font-medium text-surface-900">{{ r.block }}</td>
                <td class="font-mono">{{ r.house_number }}</td>
                <td>
                  <select v-model="r.status_rumah" class="select-field py-1.5 text-xs" :class="{ 'ring-rose-400 border-rose-400': r.status_rumah === '' }">
                    <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s === '' ? 'Pilih...' : s }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="r.jenis_iuran" class="select-field py-1.5 text-xs">
                    <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">{{ d }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="r.status_iuran" class="select-field py-1.5 text-xs">
                    <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
                  </select>
                </td>
                <td class="font-mono text-surface-400 text-sm">{{ r.water_meter_past }}</td>
                <td class="relative group">
                  <input v-model.number="r.water_meter_current" type="number" min="0" class="input-field py-1.5 text-xs font-mono w-20" :class="{ 'border-rose-500 ring-rose-500 bg-rose-50 text-rose-900': isError(r) }" />
                  <div v-if="isError(r)" class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-rose-600 text-white text-[10px] rounded-lg shadow-lg z-50 text-center">
                    Meteran sekarang tidak boleh lebih kecil dari meteran lalu!
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"></div>
                  </div>
                </td>
                <td class="font-mono font-medium" :class="usageValue(r) > 0 ? 'text-brand-600' : 'text-surface-400'">{{ usageValue(r) }} m³</td>
                <td class="font-mono font-bold text-primary">{{ formatCurrency(calculateTotal(r, siteConfig)) }}</td>
                <td>
                  <input v-model.number="r.amount_paid" type="number" min="0" class="input-field py-1.5 text-xs font-mono w-28" :placeholder="String(calculateTotal(r, siteConfig))" />
                </td>
                <td>
                  <span class="font-mono text-xs font-semibold" :class="getOverpaymentClass(r)">{{ formatCurrency(overpayment(r, siteConfig)) }}</span>
                </td>
              </tr>
              <tr v-if="filteredRecords.length === 0">
                <td colspan="12" class="text-center py-8 text-surface-500 text-sm">Tidak ada data yang cocok.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto p-3 md:p-0 md:mt-6 md:pb-10 bg-white border-t md:border-0 border-surface-200 z-20">
        <button
          class="btn-primary w-full md:w-auto text-base px-8 py-3"
          @click="syncToCloud"
          :disabled="isSaving || hasErrors"
        >
          <svg v-if="!isSaving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="ml-2">{{ isSaving ? 'Menyimpan...' : hasErrors ? 'Ada Error!' : 'Sync to Cloud' }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig } from '~/types'
import {
  HOUSE_STATUS_OPTIONS,
  DUES_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  DEFAULT_SITE_CONFIG,
} from '~/types'

useHead({ title: 'Input Bulanan - IPL Manager' })

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase()
const { calculateTotal, usageValue, overpayment, formatCurrency, matchHouseNumber } = useBilling()
const { authFetch } = useAuthFetch()
const toast = useToast()

const periodOptions = generatePeriodOptions()
const selectedPeriod = ref(getCurrentPeriod())
const records = ref<IplRecord[]>([])
const siteConfig = ref<SiteConfig>(DEFAULT_SITE_CONFIG)
const isLoading = ref(false)
const isSaving = ref(false)
const hasLoaded = ref(false)
const isGenerated = ref(false)

const filterBlock = ref('All')
const filterHouseStatus = ref('All')
const filterPaymentStatus = ref('All')
const searchQuery = ref('')

const uniqueBlocks = computed(() => {
  const blocks = new Set<string>()
  records.value.forEach((r) => blocks.add(r.block))
  return Array.from(blocks).sort()
})

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    if (filterBlock.value !== 'All' && r.block !== filterBlock.value) return false
    if (filterHouseStatus.value !== 'All' && r.status_rumah !== filterHouseStatus.value) return false
    if (filterPaymentStatus.value !== 'All' && r.status_iuran !== filterPaymentStatus.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.trim()
      if (!matchHouseNumber(r.house_number, q) && !r.block.toLowerCase().includes(q.toLowerCase())) return false
    }
    return true
  })
})

const countUnpaid = computed(() => filteredRecords.value.filter(r => r.status_iuran !== 'Terbayarkan').length)

const hasErrors = computed(() => records.value.some((r) => isError(r) || r.status_rumah === ''))

function isError(r: IplRecord) {
  return r.water_meter_current < r.water_meter_past
}

function getOverpaymentClass(r: IplRecord): string {
  const diff = overpayment(r, siteConfig.value)
  if (diff > 0) return 'text-emerald-600'
  if (diff < 0) return 'text-rose-600'
  return 'text-surface-400'
}

async function loadPeriod() {
  isLoading.value = true
  hasLoaded.value = true
  try {
    const [config, res] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>('/api/ipl', {
        query: { period: selectedPeriod.value, _t: Date.now() },
      }),
    ])

    siteConfig.value = config

    records.value = res.records
      .filter((r) => r.status_rumah === 'Ditinggali' || r.status_rumah === 'Disewakan')
      .map((r) => ({
        ...r,
        amount_paid: r.amount_paid ?? calculateTotal(r, siteConfig.value),
      }))
    isGenerated.value = res.isGenerated

    if (res.isGenerated) {
      toast.show('Data baru di-generate. Cek status kosong!', 'info')
    }
  } catch (e) {
    console.error(e)
    toast.show('Gagal memuat data.', 'error')
    records.value = []
  } finally {
    isLoading.value = false
  }
}

async function syncToCloud() {
  if (records.value.length === 0 || hasErrors.value) return
  isSaving.value = true
  try {
    await authFetch('/api/ipl/sync', {
      method: 'POST',
      body: { records: records.value },
    })
    isGenerated.value = false
    toast.show('Data berhasil disimpan ke cloud!', 'success')
  } catch (e) {
    console.error(e)
    toast.show('Gagal menyimpan data.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>
