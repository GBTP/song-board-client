import { reactive } from 'vue'

export interface Notification {
  id: number
  message: string
}

let idCounter = 0
const DURATION = 5000

export const notifications = reactive<Notification[]>([])

export function notify(message: string) {
  const id = ++idCounter
  notifications.push({ id, message })
  setTimeout(() => {
    const idx = notifications.findIndex((n) => n.id === id)
    if (idx !== -1) notifications.splice(idx, 1)
  }, DURATION)
}
