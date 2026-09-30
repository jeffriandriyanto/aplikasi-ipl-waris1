import { getFirestoreDb } from './firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from './cache'
import { generateHouseId, normalizeHouseNumber } from '~/types'
import type { House } from '~/types'

export async function getHouseIdMap(): Promise<Map<string, string>> {
  const houses = await cachedFetch<House[]>(CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
    const snapshot = await getFirestoreDb().collection('houses').get()
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

  const map = new Map<string, string>()
  houses.forEach(h => {
    map.set(`${String(h.block).trim()}|${normalizeHouseNumber(h.house_number)}`, h.id!)
  })
  return map
}

export function resolveHouseId(
  houseIdMap: Map<string, string>,
  block: string,
  houseNumber: string,
  fallback?: string,
): string {
  const key = `${String(block ?? '').trim()}|${normalizeHouseNumber(houseNumber)}`
  return houseIdMap.get(key) || fallback || generateHouseId(block, houseNumber)
}
