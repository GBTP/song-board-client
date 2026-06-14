import { reactive } from 'vue'
import type { DanmakuMessage } from '@/types/danmaku'

const balances = reactive<Map<string, number>>(new Map())

export function handleGiftMessage(msg: DanmakuMessage) {
  if (msg.type !== 'gift' || !msg.gift) return
  const current = balances.get(msg.userId) ?? 0
  balances.set(msg.userId, current + msg.gift.value)
}

export function getBalance(userId: string): number {
  return balances.get(userId) ?? 0
}

export function deductBalance(userId: string, amount: number): boolean {
  const current = balances.get(userId) ?? 0
  if (current < amount) return false
  balances.set(userId, current - amount)
  return true
}

export function resetBalances() {
  balances.clear()
}
