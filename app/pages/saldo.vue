<template>
  <div class="page-container pb-24 md:pb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Saldo Per Rumah</h1>
        <p class="page-subtitle">Riwayat saldo dan carry-over per kavling</p>
      </div>
    </div>

    <!-- House Selector -->
    <div class="glass-card mb-6 overflow-hidden">
      <div class="px-5 py-4 border-b border-surface-200">
        <h2 class="text-base font-semibold text-surface-900">Cari Rumah</h2>
        <p class="text-xs text-surface-500 mt-0.5">Pilih blok dan masukkan nomor rumah</p>
      </div>
      <div class="p-5">
        <form @submit.prevent="searchHouse" class="space-y-4">
          <div>
            <label class="label-field">Blok Rumah</label>
            <select v-model="selectedBlock" class="select-field text-sm" required>
              <option value="" disabled>Pilih Blok...</option>
              <option v-for="b in availableBlocks" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
          <div>
            <label class="label-field">Nomor Rumah</label>
            <input v-model="houseNumber" type="text" class="input-field text-sm" placeholder="Contoh: 12 atau 34" required />
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
            Cari Riwayat
          </button>
        </form>
      </div>

      <!-- Not Found -->
      <div v-if="notFound" class="px-5 py-4 border-t border-surface-200 bg-rose-50">
        <p class="text-sm text-rose-700 font-medium">Rumah tidak ditemukan</p>
        <p class="text-xs text-rose-500 mt-0.5">Blok {{ selectedBlock }} No. {{ houseNumber }} tidak ada di master data.</p>
      </div>
    </div>

    <!-- No House Selected -->
    <div v-if="!ledger && !isLoading && !notFound" class="flex flex-col items-center justify-center py-24">
      <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <p class="text-surface-400 text-sm">Pilih rumah untuk melihat riwayat saldo</p>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-sm text-surface-500">Memuat riwayat saldo...</p>
      </div>
    </div>

    <!-- Ledger Content -->
    <template v-else-if="ledger">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="glass-card p-4">
          <p class="text-[11px] text-surface-400 mb-1">Saldo Terkini</p>
          <p class="text-lg font-bold font-mono" :class="getSaldoClass(currentBalance)">
            {{ formatCurrency(currentBalance) }}
          </p>
        </div>
        <div class="glass-card p-4">
          <p class="text-[11px] text-surface-400 mb-1">Total Tagihan</p>
          <p class="text-lg font-bold font-mono text-surface-900">{{ formatCurrency(totalTagihan) }}</p>
        </div>
        <div class="glass-card p-4">
          <p class="text-[11px] text-surface-400 mb-1">Total Dibayar</p>
          <p class="text-lg font-bold font-mono text-emerald-600">{{ formatCurrency(totalPaid) }}</p>
        </div>
        <div class="glass-card p-4">
          <p class="text-[11px] text-surface-400 mb-1">Period Dicatat</p>
          <p class="text-lg font-bold text-surface-900">{{ ledger.entries.length }}</p>
        </div>
      </div>

      <!-- House Info -->
      <div v-if="ledger.house" class="glass-card p-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-surface-900">{{ ledger.house.block }} {{ ledger.house.house_number }}</p>
            <p class="text-xs text-surface-400">PIC: {{ ledger.house.pic || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Ledger Table - Desktop -->
      <div class="hidden md:block glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Tagihan</th>
                <th>Dibayar</th>
                <th>Saldo Awal</th>
                <th>Saldo Akhir</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, i) in ledger.entries" :key="i">
                <td class="font-medium text-surface-900">{{ formatPeriod(entry.period) }}</td>
                <td class="font-mono text-sm">{{ formatCurrency(entry.tagihan) }}</td>
                <td class="font-mono text-sm text-emerald-600">{{ formatCurrency(entry.amount_paid) }}</td>
                <td class="font-mono text-sm font-semibold" :class="getSaldoClass(entry.saldo_awal)">
                  {{ formatCurrency(entry.saldo_awal) }}
                </td>
                <td class="font-mono text-sm font-bold" :class="getSaldoClass(entry.saldo_akhir)">
                  {{ formatCurrency(entry.saldo_akhir) }}
                </td>
                <td>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium" :class="entry.status_iuran === 'Terbayarkan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                    {{ entry.status_iuran === 'Terbayarkan' ? 'Lunas' : 'Belum' }}
                  </span>
                </td>
              </tr>
              <tr v-if="ledger.entries.length === 0">
                <td colspan="6" class="text-center py-8 text-surface-500 text-sm">Belum ada data iuran.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ledger Cards - Mobile -->
      <div class="md:hidden space-y-2">
        <div v-for="(entry, i) in ledger.entries" :key="i" class="glass-card p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-surface-900 text-sm">{{ formatPeriod(entry.period) }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium" :class="entry.status_iuran === 'Terbayarkan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
              {{ entry.status_iuran === 'Terbayarkan' ? 'Lunas' : 'Belum' }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p class="text-surface-400">Tagihan</p>
              <p class="font-mono font-medium">{{ formatCurrency(entry.tagihan) }}</p>
            </div>
            <div>
              <p class="text-surface-400">Dibayar</p>
              <p class="font-mono font-medium text-emerald-600">{{ formatCurrency(entry.amount_paid) }}</p>
            </div>
            <div>
              <p class="text-surface-400">Saldo Awal</p>
              <p class="font-mono font-semibold" :class="getSaldoClass(entry.saldo_awal)">{{ formatCurrency(entry.saldo_awal) }}</p>
            </div>
            <div>
              <p class="text-surface-400">Saldo Akhir</p>
              <p class="font-mono font-bold" :class="getSaldoClass(entry.saldo_akhir)">{{ formatCurrency(entry.saldo_akhir) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HouseLedgerEntry, House } from "~/types";

useHead({ title: "Saldo Per Rumah - IPL Manager" });

const { formatCurrency, matchHouseNumber } = useBilling();
const { authFetch } = useAuthFetch();

const selectedBlock = ref("");
const houseNumber = ref("");
const notFound = ref(false);
const isLoading = ref(false);
const ledger = ref<{ entries: HouseLedgerEntry[]; house_id: string; house: { block: string; house_number: string; pic: string } | null } | null>(null);

const { data: houses } = useFetch<House[]>("/api/houses", { default: () => [] });

const availableBlocks = computed(() => {
  if (!houses.value || houses.value.length === 0) return [];
  const blocks = new Set<string>();
  houses.value.filter(h => h.is_active !== false).forEach((h) => blocks.add(h.block));
  return Array.from(blocks).sort();
});

async function searchHouse() {
  if (!selectedBlock.value || !houseNumber.value.trim()) return;

  notFound.value = false;
  ledger.value = null;

  const match = houses.value.find((h) => {
    if (h.is_active === false) return false;
    if (h.block !== selectedBlock.value) return false;
    return matchHouseNumber(h.house_number, houseNumber.value);
  });

  if (!match) {
    notFound.value = true;
    return;
  }

  await loadLedger(match.id!);
}

async function loadLedger(houseId: string) {
  isLoading.value = true;
  try {
    const data = await authFetch<{ entries: HouseLedgerEntry[]; house_id: string; house: { block: string; house_number: string; pic: string } | null }>(
      `/api/houses/ledger?house_id=${houseId}`
    );
    ledger.value = data;
  } catch (e) {
    console.error("Failed to load ledger:", e);
    ledger.value = null;
  } finally {
    isLoading.value = false;
  }
}

const currentBalance = computed(() => {
  if (!ledger.value || ledger.value.entries.length === 0) return 0;
  return ledger.value.entries[ledger.value.entries.length - 1]!.saldo_akhir;
});

const totalTagihan = computed(() => {
  if (!ledger.value) return 0;
  return ledger.value.entries.reduce((sum, e) => sum + e.tagihan, 0);
});

const totalPaid = computed(() => {
  if (!ledger.value) return 0;
  return ledger.value.entries.reduce((sum, e) => sum + e.amount_paid, 0);
});

function getSaldoClass(value: number): string {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-surface-400";
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${months[Number(month) - 1]} ${year}`;
}
</script>
