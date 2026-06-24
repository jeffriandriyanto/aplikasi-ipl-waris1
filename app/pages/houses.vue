<template>
  <div class="page-container">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="page-title">Data Rumah</h1>
        <p class="page-subtitle">Kelola master data kavling perumahan</p>
      </div>
      <button
        id="add-house-btn"
        class="btn-primary text-sm"
        @click="openModal()"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Tambah Rumah
      </button>
    </div>

    <div
      v-if="status === 'pending'"
      class="flex items-center justify-center py-32"
    >
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
      v-else-if="!houses || houses.length === 0"
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <p class="text-surface-400 text-sm mb-1">Belum ada data rumah</p>
      <p class="text-surface-600 text-xs">Klik "Tambah Rumah" untuk memulai.</p>
    </div>

    <div v-else class="glass-card overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-200">
        <h2 class="text-lg font-semibold text-surface-900">Daftar Rumah</h2>
        <p class="text-xs text-surface-500 mt-0.5">
          {{ houses.length }} kavling terdaftar
          <span v-if="activeCount < houses.length" class="text-emerald-600">({{ activeCount }} aktif)</span>
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Blok</th>
              <th>No. Rumah</th>
              <th>PIC</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(h, i) in houses" :key="h.id" :class="{ 'opacity-50': h.is_active === false }">
              <td class="text-surface-500 font-mono text-xs">{{ i + 1 }}</td>
              <td class="font-medium text-surface-900">{{ h.block }}</td>
              <td class="font-mono">{{ h.house_number }}</td>
              <td class="text-surface-600">{{ h.pic }}</td>
              <td>
                <button
                  @click="toggleActive(h)"
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  :class="h.is_active !== false ? 'bg-primary' : 'bg-surface-300'"
                  :title="h.is_active !== false ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200"
                    :class="h.is_active !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  ></span>
                </button>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <button
                    class="btn-ghost p-1.5 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                    @click="openModal(h)"
                    title="Edit PIC"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    class="btn-ghost p-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    @click="confirmDelete(h)"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="modal-overlay"
          @click.self="showModal = false"
        >
          <div class="modal-content">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-surface-900">
                {{ isEditMode ? "Edit PIC Rumah" : "Tambah Rumah" }}
              </h3>
              <button class="btn-ghost p-1.5" @click="showModal = false">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label for="house-block" class="label-field"
                  >Blok <span class="text-rose-400">*</span></label
                >
                <input
                  id="house-block"
                  v-model="form.block"
                  type="text"
                  required
                  :disabled="isEditMode"
                  placeholder="e.g. Mallory"
                  class="input-field disabled:bg-surface-100 disabled:text-surface-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label for="house-number" class="label-field"
                  >No. Rumah <span class="text-rose-400">*</span></label
                >
                <input
                  id="house-number"
                  v-model="form.house_number"
                  type="text"
                  required
                  :disabled="isEditMode"
                  placeholder='e.g. 1, atau "32 & 34"'
                  class="input-field disabled:bg-surface-100 disabled:text-surface-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label for="house-pic" class="label-field"
                  >PIC (Penanggung Jawab)
                  </label
                >
                <input
                  id="house-pic"
                  v-model="form.pic"
                  type="text"
                  placeholder="Nama penghuni / pemilik"
                  class="input-field"
                />
              </div>

              <div
                class="flex justify-end gap-3 pt-4 border-t border-surface-200"
              >
                <button
                  type="button"
                  class="btn-secondary text-sm"
                  @click="showModal = false"
                >
                  Batal
                </button>
                <button
                  id="save-house"
                  type="submit"
                  class="btn-primary text-sm"
                  :disabled="isSaving"
                >
                  {{ isSaving ? "Menyimpan..." : "Simpan" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteConfirm"
          class="modal-overlay"
          @click.self="showDeleteConfirm = false"
        >
          <div class="modal-content">
            <div class="text-center mb-6">
              <div
                class="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-7 h-7 text-rose-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-surface-900 mb-2">
                Hapus Rumah?
              </h3>
              <p class="text-sm text-surface-500">
                Yakin ingin menghapus
                <strong
                  >{{ deleteTarget?.block }}
                  {{ deleteTarget?.house_number }}</strong
                >? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div class="flex justify-center gap-3">
              <button
                class="btn-secondary text-sm"
                @click="showDeleteConfirm = false"
              >
                Batal
              </button>
              <button
                id="confirm-delete"
                class="btn-danger text-sm"
                @click="handleDelete"
                :disabled="isDeleting"
              >
                {{ isDeleting ? "Menghapus..." : "Hapus" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { House } from "~/types";

useHead({ title: "Data Rumah - IPL Manager" });

const toast = useToast();
const { authFetch } = useAuthFetch();

const {
  data: houses,
  status,
  refresh,
} = useFetch<House[]>("/api/houses", {
  default: () => [],
});

const activeCount = computed(() => {
  if (!houses.value) return 0
  return houses.value.filter(h => h.is_active !== false).length
})

const showModal = ref(false);
const isEditMode = ref(false); // Penanda mode operasional modal
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref<House | null>(null);

// Form state diperluas untuk menyimpan ID opsional
const form = reactive<{
  id?: string;
  block: string;
  house_number: string;
  pic: string;
  created_at: any;
}>({
  id: undefined,
  block: "",
  house_number: "",
  pic: "",
  created_at: null,
});

// Jika menerima argument objek house, maka set modal ke mode EDIT
function openModal(house?: House) {
  if (house) {
    isEditMode.value = true;
    Object.assign(form, {
      id: house.id,
      block: house.block,
      house_number: house.house_number,
      pic: house.pic,
      created_at: house.created_at,
    });
  } else {
    isEditMode.value = false;
    Object.assign(form, {
      id: undefined,
      block: "",
      house_number: "",
      pic: "",
      created_at: null,
    });
  }
  showModal.value = true;
}

function confirmDelete(house: House) {
  deleteTarget.value = house;
  showDeleteConfirm.value = true;
}

async function handleSave() {
  if (!form.block.trim() || !form.house_number.trim())
    return;
  isSaving.value = true;

  try {
    if (isEditMode.value) {
      await authFetch("/api/houses/update", {
        method: "PATCH",
        body: {
          id: form.id,
          pic: form.pic,
        },
      });
      toast.show("PIC Rumah berhasil diperbarui.", "success");
    } else {
      await authFetch("/api/houses/create", {
        method: "POST",
        body: {
          block: form.block,
          house_number: form.house_number,
          pic: form.pic,
        },
      });
      toast.show("Rumah berhasil ditambahkan.", "success");
    }

    showModal.value = false;
    await refresh();
  } catch (e) {
    console.error(e);
    toast.show("Gagal menyimpan data.", "error");
  } finally {
    isSaving.value = false;
  }
}

async function handleDelete() {
  if (!deleteTarget.value || !deleteTarget.value.id) return;
  isDeleting.value = true;
  try {
    await authFetch(`/api/houses/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    toast.show("Rumah berhasil dihapus.", "success");
    showDeleteConfirm.value = false;
    await refresh();
  } catch (e) {
    console.error(e);
    toast.show("Gagal menghapus data.", "error");
  } finally {
    isDeleting.value = false;
  }
}

async function toggleActive(house: House) {
  if (!house.id) return
  const newState = house.is_active === false
  try {
    await authFetch("/api/houses/update", {
      method: "PATCH",
      body: { id: house.id, is_active: newState },
    })
    house.is_active = newState
    toast.show(`Rumah ${newState ? 'diaktifkan' : 'dinonaktifkan'}.`, "success")
  } catch (e) {
    console.error(e)
    toast.show("Gagal mengubah status rumah.", "error")
  }
}
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.3s ease-out;
}
.modal-leave-active {
  transition: all 0.2s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content {
  transform: scale(0.95);
}
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
