<template>
  <div class="mobile-container">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-surface-900">Ringkasan Keuangan</h1>
      <p class="text-sm text-surface-500 mt-1">Informasi iuran dan kas periode {{ selectedPeriod }}</p>
    </div>

    <div class="mb-4">
      <select v-model="selectedPeriod" class="select-field text-sm" @change="loadSummary">
        <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div v-if="summaryLoading" class="flex items-center justify-center py-12">
      <svg class="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <template v-else-if="summary">
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="stat-card">
          <p class="text-[10px] text-surface-400 mb-1">Iuran Terkumpul</p>
          <p class="text-lg font-bold text-primary">{{ formatCurrency(summary.totalIuranTerkumpul) }}</p>
          <p class="text-[10px] text-surface-400">{{ summary.totalRumahTerbayar }} rumah bayar</p>
        </div>
        <div class="stat-card">
          <p class="text-[10px] text-surface-400 mb-1">Kas Masuk Lainnya</p>
          <p class="text-lg font-bold text-emerald-600">{{ formatCurrency(summary.totalKasMasukLainnya) }}</p>
          <p class="text-[10px] text-surface-400">Donasi & sumbangan</p>
        </div>
      </div>

      <div class="glass-card mb-4 overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-200">
          <h2 class="text-sm font-semibold text-surface-900">Pengeluaran</h2>
        </div>
        <div class="p-4">
          <div v-if="Object.keys(summary.pengeluaranByCategory).length === 0" class="text-center py-4">
            <p class="text-xs text-surface-400">Belum ada pengeluaran periode ini.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="(amount, cat) in summary.pengeluaranByCategory" :key="cat" class="flex items-center justify-between text-sm">
              <span class="text-surface-600">{{ cat }}</span>
              <span class="font-mono font-medium text-rose-600">-{{ formatCurrency(amount) }}</span>
            </div>
            <div class="border-t border-surface-100 pt-2 flex items-center justify-between text-sm font-semibold">
              <span class="text-surface-700">Total Pengeluaran</span>
              <span class="font-mono text-rose-600">-{{ formatCurrency(summary.totalPengeluaran) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-surface-400 mb-1">Saldo Akhir</p>
            <p class="text-xl font-bold" :class="summary.saldoAkhir >= 0 ? 'text-primary' : 'text-rose-600'">
              {{ formatCurrency(summary.saldoAkhir) }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
        </div>
        <p class="text-[10px] text-surface-400 mt-1">
          {{ summary.totalRumahBelumBayar }} rumah belum bayar
        </p>
      </div>
    </template>

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
            <input
              v-model="searchHouseNumber"
              type="text"
              class="input-field text-sm"
              placeholder="Contoh: 12 atau 34"
              required
            />
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
    </div>

    <div class="glass-card overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-sm text-surface-500">Mencari tagihan...</p>
        </div>
      </div>

      <div v-else-if="!hasLoaded" class="flex flex-col items-center justify-center py-16 px-4">
        <div class="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
          <svg class="w-7 h-7 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-surface-600 font-medium text-sm mb-1">Silakan cari tagihan Anda</p>
        <p class="text-surface-400 text-xs text-center">Hasil pencarian akan tampil di sini.</p>
      </div>

      <div v-else-if="filteredRecords.length === 0" class="flex flex-col items-center justify-center py-16 px-4">
        <div class="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
          <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-surface-600 font-medium text-sm mb-1">Tagihan tidak ditemukan</p>
        <p class="text-surface-400 text-xs text-center">
          Blok {{ lastSearchedBlock }} No. {{ lastSearchedHouseNumber }} tidak ditemukan.
        </p>
      </div>

      <div v-else class="p-4 space-y-3">
        <div
          v-for="(r, i) in filteredRecords"
          :key="r.id || i"
          class="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary/30 transition-colors"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-base font-semibold text-surface-900">{{ r.block }}</h3>
              <p class="text-surface-500 text-sm">No. {{ r.house_number }}</p>
            </div>
            <span :class="statusBadge(r.status_rumah)" class="text-[10px]">
              {{ r.status_rumah }}
            </span>
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
              <p class="font-mono text-surface-800 text-sm">
                {{ r.water_meter_past }} → {{ r.water_meter_current }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig, House } from '~/types'
import { DEFAULT_SITE_CONFIG } from '~/types'

interface FinancialSummary {
  totalIuranTerkumpul: number
  totalRumahTerbayar: number
  totalRumahBelumBayar: number
  totalKasMasukLainnya: number
  pengeluaranByCategory: Record<string, number>
  totalPengeluaran: number
  saldoAkhir: number
}

definePageMeta({ layout: 'client' })
useHead({ title: 'Ringkasan Keuangan - IPL Perumahan Waris' })

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase()
const { calculateTotal, formatCurrency, statusBadge, matchHouseNumber } = useBilling()

const periodOptions = generatePeriodOptions()
const selectedPeriod = ref(getCurrentPeriod())
const records = ref<IplRecord[]>([])
const siteConfig = ref<SiteConfig>({ ...DEFAULT_SITE_CONFIG })
const isLoading = ref(false)
const hasLoaded = ref(false)
const summaryLoading = ref(false)
const summary = ref<FinancialSummary | null>(null)

const selectedBlock = ref('')
const searchHouseNumber = ref('')
const lastSearchedBlock = ref('')
const lastSearchedHouseNumber = ref('')

const { data: houses } = useFetch<House[]>('/api/houses', {
  default: () => [],
})

const availableBlocks = computed(() => {
  if (!houses.value || houses.value.length === 0) return []
  const blocks = new Set<string>()
  houses.value.forEach((h) => blocks.add(h.block))
  return Array.from(blocks).sort()
})

const filteredRecords = computed(() => {
  if (!hasLoaded.value) return []

  const b = lastSearchedBlock.value
  const hn = lastSearchedHouseNumber.value.trim()

  return records.value.filter((r) => {
    if (r.block !== b) return false
    return matchHouseNumber(r.house_number, hn)
  })
})

async function loadSummary() {
  summaryLoading.value = true
  try {
    summary.value = await $fetch<FinancialSummary>('/api/summary', {
      query: { period: selectedPeriod.value, _t: Date.now() },
    })
  } catch {
    summary.value = null
  } finally {
    summaryLoading.value = false
  }
}

async function searchBill() {
  if (!selectedBlock.value || !searchHouseNumber.value.trim()) return

  lastSearchedBlock.value = selectedBlock.value
  lastSearchedHouseNumber.value = searchHouseNumber.value

  isLoading.value = true
  hasLoaded.value = false
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

    records.value = res.records.filter((r) => r.updated_at !== null)
    hasLoaded.value = true
  } catch {
    records.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSummary()
})
</script>
