import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { IplRecord, HouseStatus, DuesType, PaymentStatus, House } from '~/types'

function getPreviousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const prevDate = new Date(year!, (month || 1) - 2, 1)
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = query.period as string
  
  if (!period) {
    throw createError({ statusCode: 400, statusMessage: 'Period is required' })
  }

  // Cache the full merged result per period (5 min TTL)
  return cachedFetch(CACHE_KEYS.iplRecords(period), CACHE_TTL.IPL_RECORDS, async () => {
    const db = getFirestoreDb()
    
    // Fetch houses from cache (10 min TTL) to avoid extra Firestore reads
    const allHouses = await cachedFetch<House[]>(CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
      const snapshot = await db.collection('houses').get()
      const result: House[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        result.push({
          id: doc.id,
          block: data.block,
          house_number: data.house_number,
          pic: data.pic,
          is_active: data.is_active !== false,
          created_at: null,
        })
      })
      return result
    })

    // Only generate records for active houses
    const houses = allHouses.filter(h => h.is_active !== false)
    
    // Fetch existing records for current period
    const currentRecordsSnap = await db.collection('ipl_records')
      .where('period', '==', period)
      .get()
      
    // Create map for O(1) lookups
    const currentMap = new Map<string, any>()
    currentRecordsSnap.forEach(doc => currentMap.set(doc.data().house_id, { id: doc.id, ...doc.data() }))
    
    // Only fetch previous records if we actually need them (some houses missing from current)
    let prevMap = new Map<string, any>()
    if (currentRecordsSnap.size < houses.length) {
      const prevPeriod = getPreviousPeriod(period)
      const prevRecordsSnap = await db.collection('ipl_records')
        .where('period', '==', prevPeriod)
        .get()
      prevRecordsSnap.forEach(doc => prevMap.set(doc.data().house_id, doc.data()))
    }
    
    const mergedRecords: IplRecord[] = []
    
    // Loop through ALL master houses to ensure the table is always full
    houses.forEach(house => {
      const houseId = house.id!
      
      if (currentMap.has(houseId)) {
        // Record already exists for this month, use it
        const currentData = currentMap.get(houseId)
        mergedRecords.push({
          id: currentData.id,
          period: currentData.period,
          house_id: currentData.house_id,
          block: currentData.block,
          house_number: currentData.house_number,
          status_rumah: currentData.status_rumah as HouseStatus,
          jenis_iuran: currentData.jenis_iuran as DuesType,
          status_iuran: currentData.status_iuran as PaymentStatus,
          water_meter_past: currentData.water_meter_past,
          water_meter_current: currentData.water_meter_current,
          amount_paid: currentData.amount_paid ?? undefined,
          updated_at: currentData.updated_at ? currentData.updated_at.toDate() : null,
        })
      } else {
        // Record doesn't exist yet, generate a MOCK object
        const prev = prevMap.get(houseId)
        mergedRecords.push({
          period,
          house_id: houseId,
          block: house.block,
          house_number: house.house_number,
          status_rumah: (prev?.status_rumah || '') as HouseStatus,
          jenis_iuran: (prev?.jenis_iuran || 'Air & Sampah') as DuesType,
          status_iuran: 'Belum Terbayarkan',
          water_meter_past: prev?.water_meter_current || 0,
          water_meter_current: 0,
          amount_paid: undefined,
          updated_at: null,
        })
      }
    })
    
    // Sort in-memory to prevent Firestore missing index errors
    mergedRecords.sort((a, b) => {
      if (a.block === b.block) {
        return a.house_number.localeCompare(b.house_number, undefined, { numeric: true })
      }
      return a.block.localeCompare(b.block)
    })
    
    // If ANY record is missing from the DB, we consider the dataset partially "isGenerated"
    const isGenerated = currentRecordsSnap.size < houses.length
    
    return { records: mergedRecords, isGenerated }
  })
})
