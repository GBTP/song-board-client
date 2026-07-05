import type { DanmakuMessage } from '@/types/danmaku'

type MessageHandler = (msg: DanmakuMessage) => void
type StatusHandler = (connected: boolean) => void

export class WsClient {
  private url: string
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private messageHandlers: Set<MessageHandler> = new Set()
  private statusHandlers: Set<StatusHandler> = new Set()
  private _connected = false

  constructor(url: string) {
    this.url = url
  }

  get connected(): boolean {
    return this._connected
  }

  setUrl(url: string) {
    const changed = this.url !== url
    this.url = url
    if (changed && this._connected) {
      this.disconnect()
      this.connect()
    }
  }

  connect() {
    if (this.ws) return
    if (!this.url) return

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this._connected = true
        this.reconnectAttempts = 0
        this.notifyStatus(true)
        this.clearReconnectTimer()
      }

      this.ws.onmessage = (ev) => {
        try {
          const msg: DanmakuMessage = JSON.parse(ev.data)
          this.messageHandlers.forEach((h) => h(msg))
        } catch {
          // ignore malformed messages
        }
      }

      this.ws.onclose = () => {
        this._connected = false
        this.ws = null
        this.notifyStatus(false)
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.clearReconnectTimer()
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this._connected = false
    this.notifyStatus(false)
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private notifyStatus(connected: boolean) {
    this.statusHandlers.forEach((h) => h(connected))
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return
    const delay = Math.min(3000 * 2 ** this.reconnectAttempts, 60000)
    this.reconnectAttempts++
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}
