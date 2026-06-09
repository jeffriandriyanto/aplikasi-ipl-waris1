import { getFirebaseAdmin } from '../utils/firebase'

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

const PROTECTED_WRITE_PREFIXES = [
  '/api/houses/create',
  '/api/houses/update',
  '/api/houses/',
  '/api/ipl/sync',
  '/api/ipl/temp-bulk',
  '/api/kas',
  '/api/config',
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const method = getMethod(event)

  const isWrite = WRITE_METHODS.has(method)
  const isProtectedKasRead = path.startsWith('/api/kas') && method === 'GET'
  const isProtectedWrite = isWrite && PROTECTED_WRITE_PREFIXES.some(p => path.startsWith(p))

  if (!isProtectedWrite && !isProtectedKasRead) return

  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: missing token' })
  }

  try {
    const admin = getFirebaseAdmin()
    const token = authHeader.slice(7)
    const decoded = await admin.auth().verifyIdToken(token)
    event.context.auth = { uid: decoded.uid, email: decoded.email }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: invalid token' })
  }
})
