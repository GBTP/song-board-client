import { reactive } from 'vue'
import type { DanmakuMessage } from '@/types/danmaku'
import { notify } from '@/stores/notify'

// 内部以"分"为单位存储，避免浮点运算
const balances = reactive<Map<string, number>>(new Map())

function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}

export function handleGiftMessage(msg: DanmakuMessage) {
  if (msg.type !== 'gift' || !msg.gift) return
  const current = balances.get(msg.userId) ?? 0
  const newBalance = current + yuanToCents(msg.gift.value)
  balances.set(msg.userId, newBalance)
  notify(`收到 ${msg.nickname} 的礼物 +${msg.gift.value} 元（余额: ${newBalance / 100} 元）`)
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
