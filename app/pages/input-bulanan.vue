<template>
  <div class="page-container pb-24 md:pb-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="page-title">Input Bulanan</h1>
          <p class="page-subtitle">Kelola data iuran per periode</p>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="selectedPeriod" class="select-field text-sm">
            <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <!-- Mode Toggle -->
          <div class="flex rounded-lg border border-surface-200 overflow-hidden">
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors"
              :class="inputMode === 'single' ? 'bg-primary text-white' : 'bg-white text-surface-600 hover:bg-surface-50'"
              @click="inputMode = 'single'"
            >
              Single
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors border-l border-surface-200"
              :class="inputMode === 'bulk' ? 'bg-primary text-white' : 'bg-white text-surface-600 hover:bg-surface-50'"
              @click="inputMode = 'bulk'"
            >
              Bulk
            </button>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn-secondary text-xs px-3 py-1.5" @click="inputMode === 'bulk' ? loadPeriod() : (singleRecord ? loadSingleRecord(singleRecord.house_id) : null)" :disabled="isLoading" title="Muat ulang">
          <svg :class="['w-3.5 h-3.5 mr-1', { 'animate-spin': isLoading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Muat Ulang
        </button>
        <button class="btn-secondary text-xs px-3 py-1.5" @click="recalculateAll" :disabled="isRecalculating" title="Hitung ulang semua saldo">
          <svg :class="['w-3.5 h-3.5 mr-1', { 'animate-spin': isRecalculating }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Recalculate
        </button>
        <div class="relative" data-excel-menu>
          <button class="btn-secondary text-xs px-3 py-1.5" @click="showExcelMenu = !showExcelMenu">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
            <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="showExcelMenu" class="absolute left-0 mt-1 w-44 bg-white border border-surface-200 rounded-xl shadow-lg z-40 py-1">
            <button class="w-full text-left px-4 py-2 text-sm hover:bg-surface-50 flex items-center gap-2" @click="handleExport(); showExcelMenu = false">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button class="w-full text-left px-4 py-2 text-sm hover:bg-surface-50 flex items-center gap-2" @click="triggerImport(); showExcelMenu = false">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
          </div>
        </div>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-sm text-surface-500">Memuat data...</p>
      </div>
    </div>

    <!-- ==================== SINGLE INPUT MODE ==================== -->
    <div v-else-if="inputMode === 'single'">
      <div class="glass-card mb-6 overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-200">
          <h2 class="text-base font-semibold text-surface-900">Input Per Rumah</h2>
          <p class="text-xs text-surface-500 mt-0.5">Pilih blok dan masukkan nomor rumah</p>
        </div>
        <div class="p-5">
          <form @submit.prevent="searchSingleBill" class="space-y-4">
            <div>
              <label class="label-field">Blok Rumah</label>
              <select v-model="singleBlock" class="select-field text-sm" required>
                <option value="" disabled>Pilih Blok...</option>
                <option v-for="b in availableBlocks" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Nomor Rumah</label>
              <input v-model="singleHouseNumber" type="text" class="input-field text-sm" placeholder="Contoh: 12 atau 34" required />
              <p class="text-[11px] text-surface-400 mt-1">Untuk rumah dengan nomor ganda (misal "34 & 38"), cukup ketik salah satu.</p>
            </div>
            <button type="submit" class="btn-primary w-full py-2.5" :disabled="isSearchingSingle">
              <svg v-if="!isSearchingSingle" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <svg v-else class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cari & Input
            </button>
          </form>
        </div>

        <!-- Not Found -->
        <div v-if="singleNotFound" class="px-5 py-4 border-t border-surface-200 bg-rose-50">
          <p class="text-sm text-rose-700 font-medium">Rumah tidak ditemukan</p>
          <p class="text-xs text-rose-500 mt-0.5">Blok {{ singleBlock }} No. {{ singleHouseNumber }} tidak ada di master data.</p>
        </div>

        <!-- Single Record Form -->
        <div v-if="singleRecord" class="border-t border-surface-200 p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-semibold text-surface-900">{{ singleRecord.block }} {{ singleRecord.house_number }}</h3>
              <p class="text-xs text-surface-400">{{ formatPeriod(selectedPeriod) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="singleDirty" class="text-xs text-amber-600 font-medium">Belum disimpan</span>
              <span v-else-if="singleSaved" class="text-xs text-emerald-600 font-medium">Tersimpan</span>
              <button
                class="btn-primary text-sm px-4 py-2"
                :disabled="!singleDirty || isSavingSingle"
                @click="saveSingleRecord"
              >
                <svg v-if="isSavingSingle" class="w-4 h-4 animate-spin mr-1 inline" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simpan
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label class="label-field">Status Rumah</label>
              <select v-model="singleRecord.status_rumah" class="select-field text-sm w-full">
                <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s === '' ? 'Pilih...' : s }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Jenis Iuran</label>
              <select v-model="singleRecord.jenis_iuran" class="select-field text-sm w-full">
                <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Status Iuran</label>
              <select v-model="singleRecord.status_iuran" class="select-field text-sm w-full">
                <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Meter Lalu</label>
              <input :value="singleRecord.water_meter_past" type="number" class="input-field text-sm w-full bg-surface-50" disabled />
            </div>
            <div>
              <label class="label-field">Meter Sekarang</label>
              <input v-model.number="singleRecord.water_meter_current" type="number" min="0" class="input-field text-sm w-full" :class="{ 'border-rose-500': singleRecord.water_meter_current < singleRecord.water_meter_past }" />
              <p v-if="singleRecord.water_meter_current < singleRecord.water_meter_past" class="text-[10px] text-rose-600 mt-0.5">Min: {{ singleRecord.water_meter_past }}</p>
            </div>
            <div>
              <label class="label-field">Bayar (Rp)</label>
              <input v-model.number="singleRecord.amount_paid" type="number" min="0" class="input-field text-sm w-full" />
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="text-center p-3 rounded-xl bg-primary/5">
              <p class="text-[10px] text-surface-400 mb-1">Tagihan</p>
              <p class="text-sm font-bold text-primary">{{ formatCurrency(calculateTotal(singleRecord, siteConfig)) }}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-surface-50">
              <p class="text-[10px] text-surface-400 mb-1">Saldo Awal</p>
              <p class="text-sm font-bold" :class="getSaldoClass(singleRecord.saldo_awal ?? 0)">{{ formatCurrency(singleRecord.saldo_awal ?? 0) }}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-surface-50">
              <p class="text-[10px] text-surface-400 mb-1">Pemakaian</p>
              <p class="text-sm font-bold text-surface-900">{{ usageValue(singleRecord) }} m³</p>
            </div>
            <div class="text-center p-3 rounded-xl" :class="(closingBalance(singleRecord, siteConfig) >= 0) ? 'bg-emerald-50' : 'bg-rose-50'">
              <p class="text-[10px] text-surface-400 mb-1">Saldo Akhir</p>
              <p class="text-sm font-bold" :class="getSaldoClass(closingBalance(singleRecord, siteConfig))">{{ formatCurrency(closingBalance(singleRecord, siteConfig)) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== BULK INPUT MODE ==================== -->
    <template v-else>
      <!-- Empty State -->
      <div v-if="records.length === 0 && !hasLoaded" class="flex flex-col items-center justify-center py-32">
        <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-surface-400 text-sm">Klik "Muat Ulang" untuk memuat data periode ini</p>
      </div>

      <template v-else-if="records.length > 0">
        <!-- Generated Banner -->
        <div v-if="isGenerated" class="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Data baru di-generate. Jangan lupa sync!
        </div>

        <!-- Filter Bar -->
        <div class="glass-card mb-4 sticky top-0 z-30 shadow-sm">
          <div class="p-3">
            <div class="flex flex-wrap gap-2">
              <select v-model="filterBlock" class="select-field py-1.5 text-xs flex-1 min-w-[100px]">
                <option value="All">Semua Blok</option>
                <option v-for="b in uniqueBlocks" :key="b" :value="b">{{ b }}</option>
              </select>
              <select v-model="filterHouseStatus" class="select-field py-1.5 text-xs flex-1 min-w-[100px]">
                <option value="All">Status Rumah</option>
                <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s || "(Belum)" }}</option>
              </select>
              <select v-model="filterPaymentStatus" class="select-field py-1.5 text-xs flex-1 min-w-[100px]">
                <option value="All">Status Iuran</option>
                <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
              </select>
              <div class="relative flex-1 min-w-[120px]">
                <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input v-model="searchQuery" type="text" placeholder="Cari..." class="input-field pl-8 py-1.5 text-xs w-full" />
              </div>
            </div>
            <div class="flex items-center gap-3 mt-2 text-[11px] text-surface-500">
              <span>{{ filteredRecords.length }} rumah</span>
              <span v-if="dirtyCount > 0" class="text-amber-600 font-medium">{{ dirtyCount }} perubahan</span>
              <span class="text-rose-600">{{ countUnpaid }} belum lunas</span>
            </div>
          </div>
        </div>

        <!-- Bulk Action Bar -->
        <div v-if="selectedIds.size > 0" class="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <span class="font-medium text-primary">{{ selectedIds.size }} dipilih</span>
          <button class="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700" @click="bulkSetStatus('Terbayarkan')">Terbayar</button>
          <button class="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700" @click="bulkSetStatus('Belum Terbayarkan')">Belum Bayar</button>
          <button class="ml-auto text-surface-500 hover:text-surface-700" @click="selectedIds.clear()">Batal</button>
        </div>

        <!-- Mobile Card Layout -->
        <div class="md:hidden space-y-2 mb-4">
          <div v-for="(r, i) in filteredRecords" :key="i" class="rounded-xl border transition-colors" :class="isError(r) ? 'border-rose-300 bg-rose-50/50' : 'border-surface-200 bg-white'">
            <div class="flex items-center gap-3 px-3 py-2.5 cursor-pointer" @click="toggleCard(r.house_id)">
              <input type="checkbox" :checked="selectedIds.has(r.house_id)" @click.stop="toggleSelect(r.house_id)" class="rounded border-surface-300 w-4 h-4" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-surface-900">{{ r.block }} {{ r.house_number }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium" :class="r.status_iuran === 'Terbayarkan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                    {{ r.status_iuran === 'Terbayarkan' ? 'Lunas' : 'Belum' }}
                  </span>
                </div>
                <p class="text-[10px] text-surface-400">{{ r.status_rumah || '—' }} · {{ r.jenis_iuran }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-primary">{{ formatCurrency(calculateTotal(r, siteConfig)) }}</p>
                <p class="text-[10px] text-surface-400">{{ usageValue(r) }} m³</p>
              </div>
              <svg :class="['w-4 h-4 text-surface-400 transition-transform', { 'rotate-180': expandedCards.has(r.house_id) }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div v-if="expandedCards.has(r.house_id)" class="px-3 pb-3 pt-1 border-t border-surface-100 space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Status Rumah</label>
                  <select v-model="r.status_rumah" class="select-field py-1 text-xs w-full" :class="{ 'ring-rose-400 border-rose-400': r.status_rumah === '' }">
                    <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s === '' ? 'Pilih...' : s }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Jenis Iuran</label>
                  <select v-model="r.jenis_iuran" class="select-field py-1 text-xs w-full">
                    <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Status Iuran</label>
                  <select v-model="r.status_iuran" class="select-field py-1 text-xs w-full">
                    <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Meter Skrg</label>
                  <input v-model.number="r.water_meter_current" type="number" min="0" class="input-field py-1 text-xs font-mono w-full" :class="{ 'border-rose-500 bg-rose-50': isError(r) }" />
                  <p v-if="isError(r)" class="text-[10px] text-rose-600 mt-0.5">Min: {{ r.water_meter_past }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1 border-t border-surface-100">
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Saldo Awal</label>
                  <p class="font-mono text-xs font-semibold py-1" :class="getSaldoClass(r.saldo_awal ?? 0)">{{ formatCurrency(r.saldo_awal ?? 0) }}</p>
                </div>
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Bayar (Rp)</label>
                  <input v-model.number="r.amount_paid" type="number" min="0" class="input-field py-1 text-xs font-mono w-full" />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-2 pt-1 border-t border-surface-100">
                <div>
                  <label class="text-[10px] text-surface-400 mb-0.5 block">Saldo Akhir</label>
                  <p class="font-mono text-sm font-bold py-1" :class="getSaldoClass(closingBalance(r, siteConfig))">{{ formatCurrency(closingBalance(r, siteConfig)) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block glass-card overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="w-10"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="rounded border-surface-300" /></th>
                  <th>Blok</th>
                  <th>No</th>
                  <th>Status & Iuran</th>
                  <th>Meter</th>
                  <th>Tagihan</th>
                  <th>Saldo Awal</th>
                  <th>Bayar</th>
                  <th>Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in filteredRecords" :key="i" :class="{ 'bg-rose-50/50': isError(r) }">
                  <td><input type="checkbox" :checked="selectedIds.has(r.house_id)" @change="toggleSelect(r.house_id)" class="rounded border-surface-300" /></td>
                  <td class="font-medium text-surface-900">{{ r.block }}</td>
                  <td class="font-mono">{{ r.house_number }}</td>
                  <td>
                    <div class="flex flex-col gap-1">
                      <select v-model="r.status_rumah" class="select-field py-1 text-[11px]" :class="{ 'ring-rose-400 border-rose-400': r.status_rumah === '' }">
                        <option v-for="s in HOUSE_STATUS_OPTIONS" :key="s" :value="s">{{ s === '' ? 'Pilih...' : s }}</option>
                      </select>
                      <div class="flex gap-1">
                        <select v-model="r.jenis_iuran" class="select-field py-1 text-[11px] flex-1">
                          <option v-for="d in DUES_TYPE_OPTIONS" :key="d" :value="d">{{ d }}</option>
                        </select>
                        <select v-model="r.status_iuran" class="select-field py-1 text-[11px] flex-1">
                          <option v-for="p in PAYMENT_STATUS_OPTIONS" :key="p" :value="p">{{ p }}</option>
                        </select>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-1">
                      <span class="text-[11px] text-surface-400 font-mono">{{ r.water_meter_past }}→</span>
                      <input v-model.number="r.water_meter_current" type="number" min="0" class="input-field py-1 text-[11px] font-mono w-24" :class="{ 'border-rose-500 bg-rose-50': isError(r) }" />
                      <span class="text-[11px] text-surface-400 font-mono">· {{ usageValue(r) }}m³</span>
                    </div>
                    <p v-if="isError(r)" class="text-[10px] text-rose-600 mt-0.5">Min: {{ r.water_meter_past }}</p>
                  </td>
                  <td class="font-mono font-bold text-primary text-sm">{{ formatCurrency(calculateTotal(r, siteConfig)) }}</td>
                  <td>
                    <span class="font-mono text-[11px] font-semibold" :class="getSaldoClass(r.saldo_awal ?? 0)">{{ formatCurrency(r.saldo_awal ?? 0) }}</span>
                  </td>
                  <td>
                    <input v-model.number="r.amount_paid" type="number" min="0" class="input-field py-1 text-[11px] font-mono w-24" :placeholder="String(calculateTotal(r, siteConfig))" />
                  </td>
                  <td>
                    <span class="font-mono text-[11px] font-bold" :class="getSaldoClass(closingBalance(r, siteConfig))">{{ formatCurrency(closingBalance(r, siteConfig)) }}</span>
                  </td>
                </tr>
                <tr v-if="filteredRecords.length === 0">
                  <td colspan="9" class="text-center py-8 text-surface-500 text-sm">Tidak ada data yang cocok.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white border-t md:border-0 border-surface-200 z-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0 md:mt-4 md:pb-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex flex-wrap items-center gap-3 text-xs text-surface-500">
                <span>{{ filledCount }}/{{ records.length }} diisi</span>
                <span class="font-medium text-primary">Total: {{ formatCurrency(totalBill) }}</span>
              </div>
              <button class="btn-primary text-sm px-6 py-2.5 w-full sm:w-auto" @click="syncToCloud" :disabled="isSaving || hasErrors || !hasUnsavedChanges">
                <svg v-if="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{{ isSaving ? 'Menyimpan...' : hasErrors ? 'Ada Error!' : !hasUnsavedChanges ? 'Tidak Ada Perubahan' : `Sync ${dirtyCount} Data` }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Import Preview Modal -->
    <div v-if="showImportPreview" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        <div class="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-surface-900">Preview Import</h3>
            <p class="text-xs text-surface-500 mt-0.5">Periksa data sebelum di-import</p>
          </div>
          <button class="p-2 rounded-lg hover:bg-surface-100 text-surface-400" @click="cancelImport">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-3 border-b border-surface-100 flex flex-wrap gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ importPreview.validCount }} valid
          </div>
          <div v-if="importPreview.errorCount > 0" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ importPreview.errorCount }} error
          </div>
          <div v-if="importPreview.warnings.length > 0" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {{ importPreview.warnings.length }} warning
          </div>
        </div>

        <div v-if="importPreview.errors.length > 0" class="px-6 py-3 border-b border-surface-100 max-h-32 overflow-y-auto">
          <p class="text-xs font-medium text-rose-600 mb-1">Error:</p>
          <ul class="space-y-0.5">
            <li v-for="(err, idx) in importPreview.errors.slice(0, 20)" :key="idx" class="text-xs text-rose-600">
              Baris {{ err.row }}: {{ err.field }} — {{ err.message }}
            </li>
            <li v-if="importPreview.errors.length > 20" class="text-xs text-rose-400">
              ... dan {{ importPreview.errors.length - 20 }} error lainnya
            </li>
          </ul>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-3">
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-surface-200">
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">No</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Blok</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">No. Rumah</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Status</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Iuran</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Bayar</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Meter Lalu</th>
                  <th class="text-left py-2 pr-3 font-medium text-surface-500">Meter Skrg</th>
                  <th class="text-left py-2 font-medium text-surface-500">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in importPreview.records.slice(0, 100)" :key="idx" class="border-b border-surface-50" :class="{ 'bg-rose-50': isImportRowError(idx + 2) }">
                  <td class="py-1.5 pr-3 text-surface-400">{{ idx + 1 }}</td>
                  <td class="py-1.5 pr-3 font-medium">{{ r.block }}</td>
                  <td class="py-1.5 pr-3 font-mono">{{ r.house_number }}</td>
                  <td class="py-1.5 pr-3">{{ r.status_rumah }}</td>
                  <td class="py-1.5 pr-3">{{ r.jenis_iuran }}</td>
                  <td class="py-1.5 pr-3 font-mono">{{ r.amount_paid }}</td>
                  <td class="py-1.5 pr-3 font-mono">{{ r.water_meter_past }}</td>
                  <td class="py-1.5 pr-3 font-mono">{{ r.water_meter_current }}</td>
                  <td class="py-1.5">
                    <span v-if="isImportRowError(idx + 2)" class="text-rose-600 font-medium">Error</span>
                    <span v-else-if="isImportRowWarning(idx + 2)" class="text-amber-600 font-medium">Warning</span>
                    <span v-else class="text-emerald-600 font-medium">OK</span>
                  </td>
                </tr>
                <tr v-if="importPreview.records.length > 100">
                  <td colspan="9" class="py-2 text-center text-surface-400">
                    ... dan {{ importPreview.records.length - 100 }} baris lainnya
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex items-center justify-end gap-3">
          <button class="btn-secondary text-sm" @click="cancelImport">Batal</button>
          <button class="btn-primary text-sm px-6" :disabled="importPreview.validCount === 0" @click="applyImport">
            Import {{ importPreview.validCount }} Data
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig, House } from "~/types";
import {
  HOUSE_STATUS_OPTIONS,
  DUES_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  DEFAULT_SITE_CONFIG,
} from "~/types";
import type { ImportPreview } from "~/composables/useExcel";

useHead({ title: "Input Bulanan - IPL Manager" });

const { generatePeriodOptions, getCurrentPeriod, getSiteConfig } = useDatabase();
const { calculateTotal, usageValue, overpayment, effectivePaid, closingBalance, formatCurrency, matchHouseNumber } = useBilling();
const { authFetch } = useAuthFetch();
const toast = useToast();
const { exportToExcel, parseImportFile } = useExcel();

if (import.meta.client) {
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault();
    }
  });
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (showExcelMenu.value && !target.closest("[data-excel-menu]")) {
      showExcelMenu.value = false;
    }
  });
}

const periodOptions = generatePeriodOptions();
const selectedPeriod = ref(getCurrentPeriod());
const inputMode = ref<'single' | 'bulk'>('single');
const records = ref<IplRecord[]>([]);
const originalRecords = ref<IplRecord[]>([]);
const siteConfig = ref<SiteConfig>(DEFAULT_SITE_CONFIG);
const isLoading = ref(false);
const isSaving = ref(false);
const isRecalculating = ref(false);
const hasLoaded = ref(false);
const isGenerated = ref(false);
const showExcelMenu = ref(false);
const expandedCards = ref(new Set<string>());

// Houses data (useFetch - Nuxt handles caching/deduplication)
const { data: houses } = useFetch<House[]>('/api/houses', { default: () => [] });

const availableBlocks = computed(() => {
  if (!houses.value || houses.value.length === 0) return [];
  const blocks = new Set<string>();
  houses.value.filter(h => h.is_active !== false).forEach((h) => blocks.add(h.block));
  return Array.from(blocks).sort();
});

// Single input mode
const singleBlock = ref('');
const singleHouseNumber = ref('');
const singleRecord = ref<IplRecord | null>(null);
const singleOriginal = ref<IplRecord | null>(null);
const isSavingSingle = ref(false);
const isSearchingSingle = ref(false);
const singleNotFound = ref(false);
const singleSaved = ref(false);

const singleDirty = computed(() => {
  if (!singleRecord.value || !singleOriginal.value) return false;
  const r = singleRecord.value;
  const o = singleOriginal.value;
  return r.status_rumah !== o.status_rumah ||
    r.jenis_iuran !== o.jenis_iuran ||
    r.status_iuran !== o.status_iuran ||
    r.water_meter_current !== o.water_meter_current ||
    r.amount_paid !== o.amount_paid;
});

async function searchSingleBill() {
  if (!singleBlock.value || !singleHouseNumber.value) return;

  singleNotFound.value = false;
  singleSaved.value = false;
  singleRecord.value = null;
  singleOriginal.value = null;

  const match = houses.value.find((h) => {
    if (h.is_active === false) return false;
    if (h.block !== singleBlock.value) return false;
    return matchHouseNumber(h.house_number, singleHouseNumber.value);
  });

  if (!match || !match.id) {
    singleNotFound.value = true;
    return;
  }

  await loadSingleRecord(match.id);
}

async function loadSingleRecord(houseId: string) {
  isSearchingSingle.value = true;
  singleNotFound.value = false;
  singleSaved.value = false;
  try {
    const res = await $fetch<{ record: IplRecord; config: SiteConfig }>('/api/ipl/single', {
      query: { period: selectedPeriod.value, house_id: houseId },
    });
    siteConfig.value = res.config;
    singleRecord.value = { ...res.record, amount_paid: res.record.amount_paid ?? 0 };
    singleOriginal.value = { ...singleRecord.value };
  } catch (e) {
    console.error(e);
    toast.show('Gagal memuat data rumah.', 'error');
    singleRecord.value = null;
    singleOriginal.value = null;
  } finally {
    isSearchingSingle.value = false;
  }
}

async function saveSingleRecord() {
  if (!singleRecord.value || !singleDirty.value) return;
  isSavingSingle.value = true;
  try {
    await authFetch('/api/ipl/sync', {
      method: 'POST',
      body: { records: [singleRecord.value] },
    });
    singleOriginal.value = { ...singleRecord.value };
    singleSaved.value = true;
    toast.show('Data berhasil disimpan!', 'success');
  } catch (e) {
    console.error(e);
    toast.show('Gagal menyimpan data.', 'error');
  } finally {
    isSavingSingle.value = false;
  }
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${months[Number(month) - 1]} ${year}`;
}

let loadDebounce: ReturnType<typeof setTimeout> | null = null;
watch(selectedPeriod, () => {
  if (loadDebounce) clearTimeout(loadDebounce);
  loadDebounce = setTimeout(() => {
    if (inputMode.value === 'bulk' && hasLoaded.value) {
      loadPeriod();
    } else if (inputMode.value === 'single' && singleRecord.value) {
      searchSingleBill();
    }
  }, 300);
});

const filterBlock = ref("All");
const filterHouseStatus = ref("All");
const filterPaymentStatus = ref("All");
const searchQuery = ref("");

const fileInputRef = ref<HTMLInputElement | null>(null);
const showImportPreview = ref(false);
const importPreview = ref<ImportPreview>({
  records: [],
  errors: [],
  warnings: [],
  validCount: 0,
  errorCount: 0,
});
const importErrorRows = ref(new Set<number>());
const importWarningRows = ref(new Set<number>());

const selectedIds = ref(new Set<string>());
const isAllSelected = computed(
  () =>
    filteredRecords.value.length > 0 &&
    filteredRecords.value.every((r) => selectedIds.value.has(r.house_id)),
);

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value.clear();
  } else {
    filteredRecords.value.forEach((r) => selectedIds.value.add(r.house_id));
  }
}

function toggleSelect(houseId: string) {
  if (selectedIds.value.has(houseId)) {
    selectedIds.value.delete(houseId);
  } else {
    selectedIds.value.add(houseId);
  }
}

function toggleCard(houseId: string) {
  if (expandedCards.value.has(houseId)) {
    expandedCards.value.delete(houseId);
  } else {
    expandedCards.value.add(houseId);
  }
}

function bulkSetStatus(status: string) {
  records.value.forEach((r) => {
    if (selectedIds.value.has(r.house_id)) {
      r.status_iuran = status as any;
    }
  });
  selectedIds.value.clear();
  toast.show(`Status iuran berhasil diubah.`, "success");
}

const uniqueBlocks = computed(() => {
  const blocks = new Set<string>();
  records.value.forEach((r) => blocks.add(r.block));
  return Array.from(blocks).sort();
});

const filteredRecords = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return records.value.filter((r) => {
    if (filterBlock.value !== "All" && r.block !== filterBlock.value) return false;
    if (filterHouseStatus.value !== "All" && r.status_rumah !== filterHouseStatus.value) return false;
    if (filterPaymentStatus.value !== "All" && r.status_iuran !== filterPaymentStatus.value) return false;
    if (query) {
      if (!matchHouseNumber(r.house_number, query) && !r.block.toLowerCase().includes(query)) return false;
    }
    return true;
  });
});

const countUnpaid = computed(
  () =>
    filteredRecords.value
      .filter((r) => r.status_rumah === "Ditinggali" || r.status_rumah === "Disewakan")
      .filter((r) => r.status_iuran !== "Terbayarkan").length,
);

const dirtyRecords = computed(() => {
  if (originalRecords.value.length === 0) return [];
  const origMap = new Map<string, IplRecord>();
  originalRecords.value.forEach((r) => origMap.set(r.house_id, r));

  return records.value.filter((r) => {
    const orig = origMap.get(r.house_id);
    if (!orig) return true;
    return (
      r.status_rumah !== orig.status_rumah ||
      r.jenis_iuran !== orig.jenis_iuran ||
      r.status_iuran !== orig.status_iuran ||
      r.water_meter_current !== orig.water_meter_current ||
      r.amount_paid !== orig.amount_paid
    );
  });
});

const dirtyCount = computed(() => dirtyRecords.value.length);
const hasUnsavedChanges = computed(() => dirtyCount.value > 0);

const filledCount = computed(
  () =>
    records.value.filter(
      (r) => r.status_rumah !== "" && r.water_meter_current > 0,
    ).length,
);

const totalBill = computed(() =>
  records.value.reduce(
    (sum, r) => sum + calculateTotal(r, siteConfig.value),
    0,
  ),
);

const hasErrors = computed(() => {
  if (records.value.length === 0) return true;
  return records.value.some((r) => isError(r) || r.status_rumah === "");
});

function isError(r: IplRecord) {
  return Number(r.water_meter_current) < Number(r.water_meter_past);
}

function getOverpaymentClass(r: IplRecord): string {
  const diff = overpayment(r, siteConfig.value);
  if (diff > 0) return "text-emerald-600";
  if (diff < 0) return "text-rose-600";
  return "text-surface-400";
}

function getSaldoClass(value: number): string {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-surface-400";
}

async function loadPeriod() {
  isLoading.value = true;
  hasLoaded.value = true;
  try {
    const [config, res] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>("/api/ipl", {
        query: { period: selectedPeriod.value },
      }),
    ]);

    siteConfig.value = config;

    records.value = res.records.map((r) => ({
      ...r,
      amount_paid: r.amount_paid ?? 0,
    }));
    originalRecords.value = records.value.map((r) => ({ ...r }));

    isGenerated.value = res.isGenerated;

    if (res.isGenerated) {
      toast.show("Data baru di-generate. Cek status kosong!", "info");
    }
  } catch (e) {
    console.error(e);
    toast.show("Gagal memuat data.", "error");
    records.value = [];
    originalRecords.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function recalculateAll() {
  if (!confirm("Hitung ulang saldo semua period? Ini akan memperbarui saldo_awal dan saldo_akhir dari data historis.")) return;
  isRecalculating.value = true;
  try {
    const res = await authFetch<{ updated: number; periods: number; periodRange: string | null }>("/api/ipl/recalculate", {
      method: "POST",
    });
    toast.show(`Berhasil hitung ulang ${res.updated} data dari ${res.periods} period (${res.periodRange})`, "success");
    if (inputMode.value === 'bulk' && hasLoaded.value) {
      await loadPeriod();
    }
  } catch (e) {
    console.error(e);
    toast.show("Gagal hitung ulang saldo.", "error");
  } finally {
    isRecalculating.value = false;
  }
}

async function syncToCloud() {
  if (records.value.length === 0 || hasErrors.value) return;
  const toSync = dirtyRecords.value;
  if (toSync.length === 0) {
    toast.show("Tidak ada perubahan untuk disimpan.", "info");
    return;
  }
  isSaving.value = true;
  try {
    await authFetch("/api/ipl/sync", {
      method: "POST",
      body: { records: toSync },
    });
    originalRecords.value = records.value.map((r) => ({ ...r }));
    isGenerated.value = false;
    toast.show(`${toSync.length} data berhasil disimpan ke cloud!`, "success");
  } catch (e) {
    console.error(e);
    toast.show("Gagal menyimpan data.", "error");
  } finally {
    isSaving.value = false;
  }
}

async function handleExport() {
  if (records.value.length === 0) {
    await loadPeriod();
  }
  if (records.value.length === 0) {
    toast.show("Tidak ada data untuk di-export.", "error");
    return;
  }
  exportToExcel(records.value, selectedPeriod.value, siteConfig.value);
  toast.show("File Excel berhasil di-export.", "success");
}

function triggerImport() {
  fileInputRef.value?.click();
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = "";

  try {
    const preview = await parseImportFile(file, selectedPeriod.value);
    importPreview.value = preview;
    importErrorRows.value = new Set(preview.errors.filter((e) => e.row > 0).map((e) => e.row));
    importWarningRows.value = new Set(preview.warnings.map((w) => w.row));
    showImportPreview.value = true;
  } catch {
    toast.show("Gagal membaca file Excel.", "error");
  }
}

function isImportRowError(row: number): boolean {
  return importErrorRows.value.has(row);
}

function isImportRowWarning(row: number): boolean {
  return importWarningRows.value.has(row) && !importErrorRows.value.has(row);
}

async function applyImport() {
  const records = importPreview.value.records;
  if (records.length === 0) return;

  isSaving.value = true;
  try {
    const res = await authFetch<{ success: boolean; count: number }>("/api/ipl/import", {
      method: "POST",
      body: { records },
    });
    showImportPreview.value = false;
    toast.show(`${res.count} data berhasil di-import!`, "success");
    // Reload if in bulk mode and data was loaded
    if (inputMode.value === 'bulk' && hasLoaded.value) {
      await loadPeriod();
    }
  } catch (e) {
    console.error(e);
    toast.show("Gagal import data.", "error");
  } finally {
    isSaving.value = false;
  }
}

function cancelImport() {
  showImportPreview.value = false;
  importPreview.value = {
    records: [],
    errors: [],
    warnings: [],
    validCount: 0,
    errorCount: 0,
  };
}
</script>
