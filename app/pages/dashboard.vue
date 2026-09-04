<template>
  <div class="page-container">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Download laporan dan rekap keuangan</p>
      </div>
    </div>

    <!-- Rekap Total Semua Bulan -->
    <div v-if="!cumulative && !cumulativeLoading" class="glass-card mb-6 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-surface-900">Rekap Total Semua Bulan</h2>
          <p class="text-[10px] text-surface-500 mt-0.5">Akumulasi dari semua periode</p>
        </div>
        <button class="btn-secondary text-xs px-3 py-1.5" @click="loadCumulative">
          <svg class="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Muat Rekap
        </button>
      </div>
    </div>

    <div v-if="cumulativeLoading" class="flex items-center justify-center py-8 mb-6">
      <svg class="w-5 h-5 text-primary animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-sm text-surface-500">Memuat rekap total...</span>
    </div>

    <template v-else-if="cumulative">
      <div class="glass-card mb-6 overflow-hidden">
        <div class="px-5 py-3 border-b border-surface-200 bg-primary/5">
          <h2 class="text-sm font-semibold text-surface-900">Rekap Total Semua Bulan</h2>
          <p class="text-[10px] text-surface-500 mt-0.5">Akumulasi dari {{ cumulative.breakdown.length }} periode</p>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div class="text-center p-3 rounded-xl bg-primary/5">
              <p class="text-[10px] text-surface-400 mb-1">Total Iuran</p>
              <p class="text-base font-bold text-primary">{{ formatCurrency(cumulative.grandTotal.iuranTerkumpul) }}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-emerald-50">
              <p class="text-[10px] text-surface-400 mb-1">Kas Masuk Lain</p>
              <p class="text-base font-bold text-emerald-600">{{ formatCurrency(cumulative.grandTotal.kasMasukLainnya) }}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-rose-50">
              <p class="text-[10px] text-surface-400 mb-1">Total Keluar</p>
              <p class="text-base font-bold text-rose-600">{{ formatCurrency(cumulative.grandTotal.totalPengeluaran) }}</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-amber-50">
              <p class="text-[10px] text-surface-400 mb-1">Saldo Akhir</p>
              <p class="text-base font-bold" :class="cumulative.grandTotal.saldoAkhir >= 0 ? 'text-amber-700' : 'text-rose-700'">
                {{ formatCurrency(cumulative.grandTotal.saldoAkhir) }}
              </p>
            </div>
          </div>

          <details class="group">
            <summary class="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1">
              <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Detail per Bulan
            </summary>
            <div class="mt-3 space-y-2">
              <div v-for="item in cumulative.breakdown" :key="item.period" class="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-surface-50">
                <div class="flex-1">
                  <p class="font-medium text-surface-800">{{ formatPeriodLabel(item.period) }}</p>
                  <p class="text-surface-400">{{ item.rumahTerbayar }} bayar · {{ item.rumahBelumBayar }} belum</p>
                </div>
                <div class="text-right">
                  <p class="font-mono font-semibold" :class="item.saldoPeriod >= 0 ? 'text-primary' : 'text-rose-600'">
                    {{ formatCurrency(item.saldoPeriod) }}
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </template>

    <!-- Download Laporan PDF -->
    <div class="glass-card overflow-hidden mb-6">
      <div class="px-5 py-3 border-b border-surface-200">
        <h2 class="text-sm font-semibold text-surface-900">Download Laporan PDF</h2>
        <p class="text-[10px] text-surface-500 mt-0.5">Generate laporan kas dan tagihan</p>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <p class="text-xs font-medium text-surface-700 mb-2">Laporan Kas Bulanan</p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label-field">Bulan</label>
              <select v-model="pdfMonth" class="select-field text-sm">
                <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Tahun</label>
              <select v-model="pdfYear" class="select-field text-sm">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <button class="btn-primary py-2.5 w-full" @click="downloadKasPDF" :disabled="pdfGenerating">
                <svg v-if="!pdfGenerating" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ pdfGenerating ? 'Membuat...' : 'Download' }}
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-surface-100 pt-4">
          <p class="text-xs font-medium text-surface-700 mb-2">Tagihan Belum Lunas</p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label-field">Bulan</label>
              <select v-model="unpaidMonth" class="select-field text-sm">
                <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Tahun</label>
              <select v-model="unpaidYear" class="select-field text-sm">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <button class="btn-primary py-2.5 w-full" @click="downloadUnpaidPDF" :disabled="unpaidGenerating">
                <svg v-if="!unpaidGenerating" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ unpaidGenerating ? 'Membuat...' : 'Download' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IplRecord, SiteConfig } from "~/types";

useHead({ title: "Dashboard - IPL Manager" });

const { getSiteConfig } = useDatabase();
const { calculateTotal, formatCurrency } = useBilling();
const { authFetch } = useAuthFetch();
const toast = useToast();

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const idx = parseInt(month || "1", 10) - 1;
  return `${MONTHS[idx] || month} ${year}`;
}

const monthOptions = computed(() => MONTHS_ID.map((name, i) => ({ label: name, value: i + 1 })));
const yearOptions = computed(() => {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) years.push(y);
  return years;
});

// Cumulative
interface CumulativeData {
  grandTotal: { iuranTerkumpul: number; kasMasukLainnya: number; totalPengeluaran: number; saldoAkhir: number };
  breakdown: Array<{ period: string; iuranTerkumpul: number; rumahTerbayar: number; rumahBelumBayar: number; kasMasukLainnya: number; totalPengeluaran: number; saldoPeriod: number }>;
}

const cumulativeLoading = ref(false);
const cumulative = ref<CumulativeData | null>(null);

async function loadCumulative() {
  cumulativeLoading.value = true;
  try {
    cumulative.value = await $fetch<CumulativeData>("/api/summary/all");
  } catch {
    cumulative.value = null;
  } finally {
    cumulativeLoading.value = false;
  }
}

// PDF Kas Bulanan
const pdfMonth = ref(new Date().getMonth() + 1);
const pdfYear = ref(new Date().getFullYear());
const pdfGenerating = ref(false);

async function downloadKasPDF() {
  pdfGenerating.value = true;
  try {
    const period = `${pdfYear.value}-${String(pdfMonth.value).padStart(2, "0")}`;

    const [config, iplRes, kasRes] = await Promise.all([
      getSiteConfig(),
      $fetch<{ records: IplRecord[]; isGenerated: boolean }>("/api/ipl", { query: { period } }),
      authFetch<any[]>("/api/kas", { query: { period } }),
    ]);

    const paidRecords = iplRes.records.filter((r) => r.status_iuran === "Terbayarkan");
    let totalIuran = 0;
    paidRecords.forEach((r) => { totalIuran += calculateTotal(r, config); });

    let kasMasuk = 0;
    let kasKeluar = 0;
    const kasRows: Array<[string, string, string, string, string]> = [];

    iplRes.records.forEach((r) => {
      if (r.status_iuran === "Terbayarkan") {
        const nominal = calculateTotal(r, config);
        kasRows.push([`${r.block} No. ${r.house_number}`, "Iuran", r.jenis_iuran, (r as any).description || "-", formatCurrency(nominal)]);
      }
    });

    kasRes.forEach((entry: any) => {
      const dateStr = entry.transaction_date ? new Date(entry.transaction_date).toLocaleDateString("id-ID") : entry.created_at ? new Date(entry.created_at).toLocaleDateString("id-ID") : "-";
      if (entry.type === "masuk") {
        kasMasuk += entry.amount || 0;
        kasRows.push([dateStr, "Masuk", entry.category, entry.description || "-", formatCurrency(entry.amount)]);
      } else {
        kasKeluar += entry.amount || 0;
        kasRows.push([dateStr, "Keluar", entry.category, entry.description || "-", formatCurrency(entry.amount)]);
      }
    });

    const totalPemasukan = totalIuran + kasMasuk;
    const saldoAkhir = totalPemasukan - kasKeluar;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KAS BULANAN WARGA", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("REKAPITULASI " + MONTHS_ID[pdfMonth.value - 1].toUpperCase() + " " + pdfYear.value, pageWidth / 2, 27, { align: "center" });

    doc.setFontSize(9);
    doc.text("Perumahan Waris - Sistem Pengelolaan Iuran Warga", pageWidth / 2, 33, { align: "center" });

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
      startY: 47, head: [], body: summaryData, theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" }, 1: { cellWidth: 60, halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 47;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RINCIAN TRANSAKSI", 14, finalY + 8);

    autoTable(doc, {
      startY: finalY + 11,
      head: [["Tanggal/Unit", "Tipe", "Kategori", "Deskripsi", "Jumlah (Rp)"]],
      body: kasRows, theme: "striped",
      headStyles: { fillColor: [53, 104, 83], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 15 }, 2: { cellWidth: 35 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40, halign: "right" } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Dokumen ini digenerate otomatis oleh sistem IPLKu pada " + new Date().toLocaleDateString("id-ID"), pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(`Laporan_Kas_${MONTHS_ID[pdfMonth.value - 1]}_${pdfYear.value}.pdf`);
    toast.show("Laporan PDF berhasil diunduh!", "success");
  } catch (e) {
    console.error("PDF generation failed", e);
    toast.show("Gagal membuat laporan PDF.", "error");
  } finally {
    pdfGenerating.value = false;
  }
}

// PDF Tagihan Belum Lunas
const unpaidMonth = ref(new Date().getMonth() + 1);
const unpaidYear = ref(new Date().getFullYear());
const unpaidGenerating = ref(false);

async function downloadUnpaidPDF() {
  unpaidGenerating.value = true;
  try {
    const period = `${unpaidYear.value}-${String(unpaidMonth.value).padStart(2, "0")}`;

    const [housesRes, iplRes] = await Promise.all([
      $fetch<any[]>("/api/houses"),
      $fetch<{ records: any[]; isGenerated: boolean }>("/api/ipl", { query: { period } }),
    ]);

    const config = await getSiteConfig();

    const houseMap = new Map<string, any>();
    housesRes.forEach((h: any) => houseMap.set(h.id, h));

    const unpaidRecords = iplRes.records.filter((r) => {
      if (r.status_iuran === "Terbayarkan") return false;
      if (r.status_rumah !== "Ditinggali" && r.status_rumah !== "Disewakan") return false;
      const house = houseMap.get(r.house_id);
      if (!house || house.is_active === false) return false;
      return true;
    });

    if (unpaidRecords.length === 0) {
      toast.show("Semua rumah aktif sudah lunas untuk periode ini!", "success");
      return;
    }

    unpaidRecords.sort((a: any, b: any) => {
      if (a.block === b.block) return a.house_number.localeCompare(b.house_number, undefined, { numeric: true });
      return a.block.localeCompare(b.block);
    });

    let totalNominal = 0;
    const rows: Array<[string, string, string, string, string]> = [];

    unpaidRecords.forEach((r: any, i: number) => {
      const house = houseMap.get(r.house_id);
      const pic = house?.pic || "-";
      const usage = Math.max(0, r.water_meter_current - r.water_meter_past);
      let nominal = 0;
      if ((r.jenis_iuran || "").includes("Sampah")) nominal += config.dues_trash_flat || 25000;
      if ((r.jenis_iuran || "").includes("Air")) {
        const minFee = config.water_min_fee || 25000;
        const pricePerCubic = config.water_price_per_cubic || 3500;
        if (r.status_rumah === "Kosong" && usage === 0) { /* no water fee */ }
        else nominal += usage <= 10 ? minFee : minFee + (usage - 10) * pricePerCubic;
      }
      totalNominal += nominal;
      rows.push([String(i + 1), `${r.block} No. ${r.house_number}`, pic, r.jenis_iuran, formatCurrency(nominal)]);
    });

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DAFTAR TAGIHAN BELUM LUNAS", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("PERIODE " + MONTHS_ID[unpaidMonth.value - 1].toUpperCase() + " " + unpaidYear.value, pageWidth / 2, 27, { align: "center" });

    doc.setFontSize(9);
    doc.text("Perumahan Waris - Sistem Pengelolaan Iuran Warga", pageWidth / 2, 33, { align: "center" });

    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.5);
    doc.line(14, 36, pageWidth - 14, 36);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72);
    doc.text(`${unpaidRecords.length} rumah belum membayar iuran`, 14, 44);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total tagihan: ${formatCurrency(totalNominal)}`, 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [["No", "Blok & No. Rumah", "PIC", "Jenis Iuran", "Nominal"]],
      body: rows, theme: "striped",
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 45 }, 2: { cellWidth: 40 }, 3: { cellWidth: 35 }, 4: { cellWidth: 35, halign: "right" } },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 55;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL TAGIHAN:", 14, finalY + 8);
    doc.text(formatCurrency(totalNominal), pageWidth - 14, finalY + 8, { align: "right" });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("Dokumen ini digenerate otomatis oleh sistem IPLKu pada " + new Date().toLocaleDateString("id-ID"), pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(`Tagihan_Belum_Lunas_${MONTHS_ID[unpaidMonth.value - 1]}_${unpaidYear.value}.pdf`);
    toast.show("Daftar tagihan PDF berhasil diunduh!", "success");
  } catch (e) {
    console.error("Unpaid PDF generation failed", e);
    toast.show("Gagal membuat daftar tagihan PDF.", "error");
  } finally {
    unpaidGenerating.value = false;
  }
}
</script>
