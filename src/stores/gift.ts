import { reactive } from 'vue'
import type { DanmakuMessage } from '@/types/danmaku'

// 内部以"分"为单位存储，避免浮点运算
const balances = reactive<Map<string, number>>(new Map())

function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}

export function handleGiftMessage(msg: DanmakuMessage) {
  if (msg.type !== 'gift' || !msg.gift) return
  const current = balances.get(msg.userId) ?? 0
  balances.set(msg.userId, current + yuanToCents(msg.gift.value))
}

export function getBalance(userId: string): number {
  return (balances.get(userId) ?? 0) / 100
}

export function deductBalance(userId: string, amountYuan: number): boolean {
  const current = balances.get(userId) ?? 0
  const cost = yuanToCents(amountYuan)
  if (current < cost) return false
  balances.set(userId, current - cost)
  return true
}

export function resetBalances() {
  balances.clear()
}
