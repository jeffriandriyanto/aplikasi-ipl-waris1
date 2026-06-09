export function useAuthFetch() {
  const { getIdToken } = useAuth()

  async function authFetch<T>(url: string, opts: any = {}): Promise<T> {
    const token = await getIdToken()
    const headers: Record<string, string> = { ...opts.headers }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return $fetch(url, { ...opts, headers }) as Promise<T>
  }

  return { authFetch }
}
