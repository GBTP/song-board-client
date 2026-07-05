import { reactive } from 'vue'
import type { DanmakuMessage } from '@/types/danmaku'

const balances = reactive<Map<string, number>>(new Map())

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function handleGiftMessage(msg: DanmakuMessage) {
  if (msg.type !== 'gift' || !msg.gift) return
  const current = balances.get(msg.userId) ?? 0
  balances.set(msg.userId, round2(current + msg.gift.value))
}

export function getBalance(userId: string): number {
  return balances.get(userId) ?? 0
}

export function deductBalance(userId: string, amount: number): boolean {
  const current = balances.get(userId) ?? 0
  if (round2(current) < round2(amount)) return false
  balances.set(userId, round2(current - amount))
  return true
}

export function resetBalances() {
  balances.clear()
}
