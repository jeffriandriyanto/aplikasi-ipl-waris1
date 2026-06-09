import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { invalidateCache } from '../../utils/cache'
import { CACHE_KEYS } from '../../utils/cache'

const PERIOD_REGEX = /^\d{4}-\d{2}$/
const VALID_TYPES = new Set(['masuk', 'keluar'])
const VALID_CATEGORIES = new Set([
  'Donasi', 'Iuran Tambahan', 'Sumbangan', 'Lainnya',
  'Perbaikan', 'Operasional', 'Infrastruktur', 'Kebersihan',
])

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { period, type, category, description, amount } = body

  if (!period || !type || !category || !description || amount == null) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (typeof period !== 'string' || !PERIOD_REGEX.test(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Period must be YYYY-MM format' })
  }

  if (!VALID_TYPES.has(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be masuk or keluar' })
  }

  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid category' })
  }

  if (typeof description !== 'string' || description.length > 500) {
    throw createError({ statusCode: 400, statusMessage: 'Description must be a string under 500 characters' })
  }

  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number under 1 billion' })
  }

  const db = getFirestoreDb()
  const admin = getFirebaseAdmin()

  const docRef = await db.collection('kas_log').add({
    period,
    type,
    category,
    description: description.trim(),
    amount: Math.round(amount),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  })

  invalidateCache(CACHE_KEYS.kasEntries(period))

  return {
    id: docRef.id,
    period,
    type,
    category,
    description: description.trim(),
    amount: Math.round(amount),
    created_at: new Date(),
  }
})
