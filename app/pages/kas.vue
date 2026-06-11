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
        <p class="text-surface-800 font-semibold">Menyimpan transaksi...</p>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content max-w-md">
        <h3 class="text-lg font-semibold text-surface-900 mb-4">
          Tambah Transaksi
        </h3>
        <form @submit.prevent="saveEntry" class="space-y-4">
          <div>
            <label class="label-field">Tipe</label>
            <select
              v-model="entryForm.type"
              class="select-field text-sm"
              required
            >
              <option value="masuk">Kas Masuk</option>
              <option value="keluar">Kas Keluar</option>
            </select>
          </div>
          <div>
            <label class="label-field">Kategori</label>
            <select
              v-model="entryForm.category"
              class="select-field text-sm"
              required
            >
              <option value="" disabled>Pilih kategori...</option>
              <option
                v-for="cat in availableCategories"
                :key="cat"
                :value="cat"
              >
                {{ cat }}
              </option>
            </select>
          </div>
          <div>
            <label class="label-field">Deskripsi</label>
            <input
              v-model="entryForm.description"
              type="text"
              class="input-field text-sm"
              placeholder="Contoh: Sumbangan RT 01"
              required
            />
          </div>
          <div>
            <label class="label-field">Jumlah (Rp)</label>
            <input
              v-model.number="entryForm.amount"
              type="number"
              min="1"
              class="input-field text-sm"
              placeholder="50000"
              required
            />
          </div>
          <div>
            <label class="label-field">Tanggal Transaksi</label>
            <input
              v-model="entryForm.transaction_date"
              type="date"
              class="input-field text-sm"
            />
            <p class="text-[10px] text-surface-400 mt-1">
              Kosongkan untuk menggunakan tanggal hari ini.
            </p>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="btn-secondary flex-1"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isSaving"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal-content max-w-sm">
        <h3 class="text-lg font-semibold text-surface-900 mb-2">
          Hapus Transaksi?
        </h3>
        <p class="text-sm text-surface-500 mb-6">
          Transaksi ini akan dihapus secara permanen.
        </p>
        <div class="flex gap-3">
          <button
            class="btn-secondary flex-1"
            @click="showDeleteConfirm = false"
          >
            Batal
          </button>
          <button
            class="btn-danger flex-1"
            @click="deleteEntry"
            :disabled="isDeleting"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="page-title">Kas & Keuangan</h1>
        <p class="page-subtitle">
          Kelola kas masuk, kas keluar, dan laporan keuangan
        </p>
      </div>
    </div>

    <div class="glass-card overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-surface-200">
        <h2 class="text-lg font-semibold text-surface-900">
          Unduh Laporan Kas Bulanan
        </h2>
        <p class="text-xs text-surface-500 mt-0.5">
          Arsip PDF rekapitulasi kas warga
        </p>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-3 items-end gap-3">
          <div>
            <label class="label-field">Bulan</label>
            <select v-model="pdfMonth" class="select-field text-sm">
              <option
                v-for="m in pdfMonthOptions"
                :key="m.value"
                :value="m.value"
              >
                {{ m.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="label-field">Tahun</label>
            <select v-model="pdfYear" class="select-field text-sm">
              <option v-for="y in pdfYearOptions" :key="y" :value="y">
                {{ y }}
              </option>
            </select>
          </div>

          <button
            class="btn-primary py-2.5 h-[40px]"
            @click="downloadLaporanPDF"
            :disabled="pdfGenerating"
          >
            <svg
              v-if="!pdfGenerating"
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4 mr-2 animate-spin"
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
            {{ pdfGenerating ? "Membuat PDF..." : "Unduh Laporan PDF" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cumulative Summary (All Months) -->
    <div
      v-if="cumulativeLoading"
      class="flex items-center justify-center py-8 mb-6"
    >
      <svg
        class="w-5 h-5 text-primary animate-spin mr-2"
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
      <span class="text-sm text-surface-500">Memuat rekap total...</span>
    </div>

    <template v-else-if="cumulative">
      <div class="glass-card mb-6 overflow-hidden">
        <div class="px-5 py-3 border-b border-surface-200 bg-primary/5">
          <h2 class="text-sm font-semibold text-surface-900">
            Rekap Total Semua Bulan
          </h2>
          <p class="text-[10px] text-surface-500 mt-0.5">
            Akumulasi dari {{ cumulative.breakdown.length }} periode
          </p>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div class="text-center p-3 rounded-xl bg-primary/5">
              <p class="text-[10px] text-surface-400 mb-1">Total Iuran</p>
              <p class="text-base font-bold text-primary">
                {{ formatCurrency(cumulative.grandTotal.iuranTerkumpul) }}
              </p>
            </div>
            <div class="text-center p-3 rounded-xl bg-emerald-50">
              <p class="text-[10px] text-surface-400 mb-1">Kas Masuk Lain</p>
              <p class="text-base font-bold text-emerald-600">
                {{ formatCurrency(cumulative.grandTotal.kasMasukLainnya) }}
              </p>
            </div>
            <div class="text-center p-3 rounded-xl bg-rose-50">
              <p class="text-[10px] text-surface-400 mb-1">Total Keluar</p>
              <p class="text-base font-bold text-rose-600">
                {{ formatCurrency(cumulative.grandTotal.totalPengeluaran) }}
              </p>
            </div>
            <div class="text-center p-3 rounded-xl bg-amber-50">
              <p class="text-[10px] text-surface-400 mb-1">Saldo Akhir</p>
              <p
                class="text-base font-bold"
                :class="
                  cumulative.grandTotal.saldoAkhir >= 0
                    ? 'text-amber-700'
                    : 'text-rose-700'
                "
              >
                {{ formatCurrency(cumulative.grandTotal.saldoAkhir) }}
              </p>
            </div>
          </div>

          <details class="group">
            <summary
              class="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1"
            >
              <svg
                class="w-3 h-3 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Detail per Bulan
            </summary>
            <div class="mt-3 space-y-2">
              <div
                v-for="item in cumulative.breakdown"
                :key="item.period"
                class="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-surface-50"
              >
                <div class="flex-1">
                  <p class="font-medium text-surface-800">
                    {{ formatPeriodLabel(item.period) }}
                  </p>
                  <p class="text-surface-400">
                    {{ item.rumahTerbayar }} bayar ·
                    {{ item.rumahBelumBayar }} belum
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="font-mono font-semibold"
                    :class="
                      item.saldoPeriod >= 0 ? 'text-primary' : 'text-rose-600'
                    "
                  >
                    {{ formatCurrency(item.saldoPeriod) }}
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </template>

    <div class="flex items-center gap-3">
      <select
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
        class="btn-secondary text-sm"
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
        Muat Data
      </button>
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
        <p class="text-sm text-surface-500">Memuat data keuangan...</p>
      </div>
    </div>

    <div
      v-else-if="!hasLoaded"
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p class="text-surface-400 text-sm mb-1">
        Pilih periode dan klik "Muat Data"
      </p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card group">
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
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
            <span class="badge-paid text-[10px]">Iuran</span>
          </div>
          <p class="text-xl font-bold text-primary mb-1">
            {{ formatCurrency(summary.totalIuran) }}
          </p>
          <p class="text-xs text-surface-400">Kas masuk dari iuran</p>
        </div>

        <div class="stat-card group">
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            >
              <svg
                class="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span class="badge bg-emerald-50 text-emerald-600 text-[10px]"
              >Masuk</span
            >
          </div>
          <p class="text-xl font-bold text-emerald-600 mb-1">
            {{ formatCurrency(summary.kasMasukManual) }}
          </p>
          <p class="text-xs text-surface-400">Kas masuk manual</p>
        </div>

        <div class="stat-card group">
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            >
              <svg
                class="w-5 h-5 text-rose-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 12H4"
                />
              </svg>
            </div>
            <span class="badge bg-rose-50 text-rose-600 text-[10px]"
              >Keluar</span
            >
          </div>
          <p class="text-xl font-bold text-rose-600 mb-1">
            {{ formatCurrency(summary.kasKeluar) }}
          </p>
          <p class="text-xs text-surface-400">Total kas keluar</p>
        </div>

        <div class="stat-card group">
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            >
              <svg
                class="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <span class="badge bg-amber-50 text-amber-600 text-[10px]"
              >Saldo</span
            >
          </div>
          <p
            class="text-xl font-bold mb-1"
            :class="summary.netSaldo >= 0 ? 'text-primary' : 'text-rose-600'"
          >
            {{ formatCurrency(summary.netSaldo) }}
          </p>
          <p class="text-xs text-surface-400">Saldo bersih</p>
        </div>
      </div>

      <div class="glass-card overflow-hidden mb-6" id="export-target">
        <div
          class="px-6 py-4 border-b border-surface-200 flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h2 class="text-lg font-semibold text-surface-900">
              Riwayat Transaksi
            </h2>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ kasEntries.length }} transaksi
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-ghost text-xs" @click="exportCSV">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              CSV
            </button>
            <button class="btn-primary text-sm" @click="openModal">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Tambah
            </button>
          </div>
        </div>

        <div
          v-if="kasEntries.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-3"
          >
            <svg
              class="w-7 h-7 text-surface-400"
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
          <p class="text-surface-500 text-sm">Belum ada transaksi manual.</p>
          <p class="text-surface-400 text-xs mt-1">
            Klik "Tambah" untuk menambah transaksi.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, i) in kasEntries" :key="entry.id">
                <td class="text-surface-500 font-mono text-xs">{{ i + 1 }}</td>
                <td class="text-surface-600 text-xs">
                  {{
                    entry.transaction_date
                      ? formatTxDate(entry.transaction_date)
                      : entry.created_at
                        ? formatTxDate(entry.created_at)
                        : "-"
                  }}
                </td>
                <td>
                  <span
                    :class="
                      entry.type === 'masuk' ? 'badge-paid' : 'badge-unpaid'
                    "
                    class="text-[10px]"
                  >
                    {{ entry.type === "masuk" ? "Masuk" : "Keluar" }}
                  </span>
                </td>
                <td class="text-surface-700">{{ entry.category }}</td>
                <td class="text-surface-700">{{ entry.description }}</td>
                <td
                  class="font-mono font-semibold"
                  :class="
                    entry.type === 'masuk'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  "
                >
                  {{ entry.type === "masuk" ? "+" : "-"
                  }}{{ formatCurrency(entry.amount) }}
                </td>
                <td>
                  <button
                    class="btn-ghost text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    @click="confirmDelete(entry)"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, KasLogEntry, KasType, SiteConfig } from "~/types";
import { KAS_CATEGORIES, DEFAULT_SITE_CONFIG } from "~/types";

useHead({ title: "Kas & Keuangan - IPL Manager" });

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } =
  useDatabase();
const { calculateTotal, formatCurrency, sanitizeCsvField } = useBilling();
const { authFetch } = useAuthFetch();
const toast = useToast();

const periodOptions = generatePeriodOptions();
const selectedPeriod = ref(getCurrentPeriod());
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const hasLoaded = ref(false);
const siteConfig = ref<SiteConfig>(DEFAULT_SITE_CONFIG);

const iplRecords = ref<IplRecord[]>([]);
const kasEntries = ref<KasLogEntry[]>([]);

interface CumulativeData {
  grandTotal: {
    iuranTerkumpul: number;
    kasMasukLainnya: number;
    totalPengeluaran: number;
    saldoAkhir: number;
  };
  breakdown: Array<{
    period: string;
    iuranTerkumpul: number;
    rumahTerbayar: number;
    rumahBelumBayar: number;
    kasMasukLainnya: number;
    totalPengeluaran: number;
    saldoPeriod: number;
  }>;
}

const cumulativeLoading = ref(false);
const cumulative = ref<CumulativeData | null>(null);

const showModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<KasLogEntry | null>(null);

const entryForm = reactive({
  type: "masuk" as KasType,
  category: "",
  description: "",
  amount: 0,
  transaction_date: "",
});

const availableCategories = computed(() => {
  return KAS_CATEGORIES[entryForm.type] || [];
});

watch(
  () => entryForm.type,
  () => {
    entryForm.category = "";
  },
);

const summary = computed(() => {
  const paidRecords = iplRecords.value.filter(
    (r) => r.status_iuran === "Terbayarkan",
  );
  const totalIuran = paidRecords.reduce(
    (sum, r) => sum + calculateTotal(r, siteConfig.value),
    0,
  );

  const kasMasukManual = kasEntries.value
    .filter((e) => e.type === "masuk")
    .reduce((sum, e) => sum + e.amount, 0);
  const kasKeluar = kasEntries.value
    .filter((e) => e.type === "keluar")
    .reduce((sum, e) => sum + e.amount, 0);

  const netSaldo = totalIuran + kasMasukManual - kasKeluar;

  return { totalIuran, kasMasukManual, kasKeluar, netSaldo };
});

function openModal() {
  entryForm.type = "masuk";
  entryForm.category = "";
  entryForm.description = "";
  entryForm.amount = 0;
  entryForm.transaction_date = "";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function confirmDelete(entry: KasLogEntry) {
  deleteTarget.value = entry;
  showDeleteConfirm.value = true;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const idx = parseInt(month || "1", 10) - 1;
  return `${MONTHS[idx] || month} ${year}`;
}

function formatTxDate(d: Date): string {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

async function loadData() {
  isLoading.value = true;
  hasLoaded.value = true;
  try {
    const [config, iplRes, kasRes] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>("/api/ipl", {
        query: { period: selectedPeriod.value, _t: Date.now() },
      }),
      authFetch<KasLogEntry[]>("/api/kas", {
        query: { period: selectedPeriod.value },
      }),
    ]);

    siteConfig.value = config;
    iplRecords.value = iplRes.records.filter((r) => r.updated_at !== null);
    kasEntries.value = kasRes;
  } catch (e) {
    console.error(e);
    toast.show("Gagal memuat data keuangan.", "error");
    iplRecords.value = [];
    kasEntries.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function loadCumulative() {
  cumulativeLoading.value = true;
  try {
    cumulative.value = await $fetch<CumulativeData>("/api/summary/all", {
      query: { _t: Date.now() },
    });
  } catch {
    cumulative.value = null;
  } finally {
    cumulativeLoading.value = false;
  }
}

onMounted(() => {
  loadCumulative();
});

async function saveEntry() {
  if (!entryForm.category || !entryForm.description || entryForm.amount <= 0)
    return;
  isSaving.value = true;
  try {
    const newEntry = await authFetch<KasLogEntry>("/api/kas/create", {
      method: "POST",
      body: {
        period: selectedPeriod.value,
        type: entryForm.type,
        category: entryForm.category,
        description: entryForm.description,
        amount: entryForm.amount,
        transaction_date: entryForm.transaction_date || undefined,
      },
    });
    kasEntries.value.unshift(newEntry);
    closeModal();
    toast.show("Transaksi berhasil ditambahkan!", "success");
  } catch (e) {
    console.error(e);
    toast.show("Gagal menyimpan transaksi.", "error");
  } finally {
    isSaving.value = false;
  }
}

async function deleteEntry() {
  if (!deleteTarget.value?.id) return;
  isDeleting.value = true;
  try {
    await authFetch(`/api/kas/${deleteTarget.value.id}`, { method: "DELETE" });
    kasEntries.value = kasEntries.value.filter(
      (e) => e.id !== deleteTarget.value!.id,
    );
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
    toast.show("Transaksi berhasil dihapus.", "success");
  } catch (e) {
    console.error(e);
    toast.show("Gagal menghapus transaksi.", "error");
  } finally {
    isDeleting.value = false;
  }
}

function exportCSV() {
  const headers = ["Tanggal", "Tipe", "Kategori", "Deskripsi", "Jumlah (Rp)"];
  const rows = kasEntries.value.map((e) => [
    sanitizeCsvField(
      e.transaction_date
        ? formatTxDate(e.transaction_date)
        : e.created_at
          ? formatTxDate(e.created_at)
          : "-",
    ),
    sanitizeCsvField(e.type === "masuk" ? "Masuk" : "Keluar"),
    sanitizeCsvField(e.category),
    sanitizeCsvField(e.description),
    e.amount,
  ]);

  const summaryRow = ["", "", "Total Iuran Terbayar", summary.value.totalIuran];
  const summaryRow2 = [
    "",
    "",
    "Total Kas Masuk Manual",
    summary.value.kasMasukManual,
  ];
  const summaryRow3 = ["", "", "Total Kas Keluar", summary.value.kasKeluar];
  const summaryRow4 = ["", "", "Saldo Bersih", summary.value.netSaldo];

  const csv = [
    headers,
    ...rows,
    [],
    summaryRow,
    summaryRow2,
    summaryRow3,
    summaryRow4,
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kas_${selectedPeriod.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const pdfMonth = ref(new Date().getMonth() + 1);
const pdfYear = ref(new Date().getFullYear());
const pdfGenerating = ref(false);

const pdfMonthOptions = computed(() =>
  MONTHS_ID.map((name, i) => ({ label: name, value: i + 1 })),
);
const pdfYearOptions = computed(() => {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) years.push(y);
  return years;
});

async function downloadLaporanPDF() {
  pdfGenerating.value = true;
  try {
    const period = `${pdfYear.value}-${String(pdfMonth.value).padStart(2, "0")}`;

    const [config, iplRes, kasRes] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>("/api/ipl", {
        query: { period, _t: Date.now() },
      }),
      authFetch<any[]>("/api/kas", {
        query: { period },
      }),
    ]);

    const paidRecords = iplRes.records.filter(
      (r) => r.status_iuran === "Terbayarkan",
    );
    let totalIuran = 0;
    paidRecords.forEach((r) => {
      totalIuran += calculateTotal(r, config);
    });

    let kasMasuk = 0;
    let kasKeluar = 0;
    const kasRows: Array<[string, string, string, string]> = [];

    iplRes.records.forEach((r) => {
      if (r.status_iuran === "Terbayarkan") {
        const nominal = calculateTotal(r, config);
        kasRows.push([
          `${r.block} No. ${r.house_number}`,
          "Iuran",
          r.jenis_iuran,
          formatCurrency(nominal),
        ]);
      }
    });

    kasRes.forEach((entry: any) => {
      const dateStr = entry.transaction_date
        ? new Date(entry.transaction_date).toLocaleDateString("id-ID")
        : entry.created_at
          ? new Date(entry.created_at).toLocaleDateString("id-ID")
          : "-";

      if (entry.type === "masuk") {
        kasMasuk += entry.amount || 0;
        kasRows.push([
          dateStr,
          "Masuk",
          entry.category,
          formatCurrency(entry.amount),
        ]);
      } else {
        kasKeluar += entry.amount || 0;
        kasRows.push([
          dateStr,
          "Keluar",
          entry.category,
          formatCurrency(entry.amount),
        ]);
      }
    });

    const totalPemasukan = totalIuran + kasMasuk;
    const saldoAkhir = totalPemasukan - kasKeluar;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KAS BULANAN WARGA", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      "REKAPITULASI " +
        MONTHS_ID[pdfMonth.value - 1].toUpperCase() +
        " " +
        pdfYear.value,
      pageWidth / 2,
      27,
      { align: "center" },
    );

    doc.setFontSize(9);
    doc.text(
      "Perumahan Waris - Sistem Pengelolaan Iuran Warga",
      pageWidth / 2,
      33,
      { align: "center" },
    );

    doc.setDrawColor(53, 104, 83);
    doc.setLineWidth(0.5);
    doc.line(14, 36, pageWidth - 14, 36);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KEUANGAN", 14, 44);

    const summaryData = [
      ["Total Iuran Terkumpul", formatCurrency(totalIuran)],
      ["Total Kas Masuk Lainnya", formatCurrency(kasMasuk)],
      ["Total Pengeluaran", formatCurrency(kasKeluar)],
      ["Saldo Akhir Bulan", formatCurrency(saldoAkhir)],
    ];

    autoTable(doc, {
      startY: 47,
      head: [],
      body: summaryData,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 47;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RINCIAN TRANSAKSI", 14, finalY + 8);

    autoTable(doc, {
      startY: finalY + 11,
      head: [["Tanggal/Unit", "Tipe", "Kategori", "Jumlah (Rp)"]],
      body: kasRows,
      theme: "striped",
      headStyles: {
        fillColor: [53, 104, 83],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 40, halign: "right" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Dokumen ini digenerate otomatis oleh sistem IPLKu pada " +
        new Date().toLocaleDateString("id-ID"),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );

    doc.save(
      `Laporan_Kas_${MONTHS_ID[pdfMonth.value - 1]}_${pdfYear.value}.pdf`,
    );
    toast.show("Laporan PDF berhasil diunduh!", "success");
  } catch (e) {
    console.error("PDF generation failed", e);
    toast.show("Gagal membuat laporan PDF.", "error");
  } finally {
    pdfGenerating.value = false;
  }
}
</script>
