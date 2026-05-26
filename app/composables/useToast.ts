/**
 * Global toast notification composable
 */
export function useToast() {
  const visible = useState<boolean>('toast-visible', () => false)
  const message = useState<string>('toast-message', () => '')
  const type = useState<'success' | 'error' | 'info'>('toast-type', () => 'info')

  let timer: ReturnType<typeof setTimeout> | null = null

  function show(msg: string, toastType: 'success' | 'error' | 'info' = 'info', duration = 4000) {
    if (timer) clearTimeout(timer)

    message.value = msg
    type.value = toastType
    visible.value = true

    timer = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  function hide() {
    if (timer) clearTimeout(timer)
    visible.value = false
  }

  return {
    visible: readonly(visible),
    message: readonly(message),
    type: readonly(type),
    show,
    hide,
  }
}
