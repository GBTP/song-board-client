import { reactive, watch } from 'vue'
import type { TrackEntry, BoardState, BoardConfig } from '@/types/queue'
import type { DanmakuMessage } from '@/types/danmaku'
import type { SearchResult } from '@/types/song'
import { parseCommand, type ParsedCommand } from '@/core/command-parser'
import { songDB } from '@/core/song-db'
import { deductBalance, getBalance } from '@/stores/gift'
import { notify } from '@/stores/notify'

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch {}
  return fallback
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

let trackIdCounter = 0
function nextTrackId(): string {
  return `t_${Date.now()}_${++trackIdCounter}`
}

export const config: BoardConfig = reactive(
  loadJSON<BoardConfig>('board-config', {
    gameName: 'maimai',
    maxQueueLength: 20,
    maxPerUser: 3,
    allowRepeat: false,
    adminIds: [],
    allowedLevels: [],
    giftOrderEnabled: false,
    giftOrderCost: 0,
  })
)

watch(config, (val) => saveJSON('board-config', val), { deep: true })

export const state: BoardState = reactive(
  loadJSON<BoardState>('board-state', {
    trackList: [],
    trackDoneList: [],
    paused: false,
  })
)

watch(state, (val) => saveJSON('board-state', val), { deep: true })

const adminSet = new Set(config.adminIds)
watch(() => config.adminIds, (ids) => {
  adminSet.clear()
  ids.forEach((id) => adminSet.add(id))
}, { immediate: true })

export function handleDanmaku(msg: DanmakuMessage): string | null {
  const cmd = parseCommand(msg, adminSet)
  if (!cmd) return null

  switch (cmd.type) {
    case 'order': return handleOrder(cmd)
    case 'cancelOrder': return handleCancelOrder(cmd)
    case 'difficulty': return handleDifficulty(cmd)
    case 'lookup': return handleLookup(cmd)
    case 'delete': return handleDelete(cmd)
    case 'finish': return handleFinish(cmd)
    case 'clear': return handleClear()
    case 'pause':
      state.paused = true
      return '已暂停点歌'
    case 'resume':
      state.paused = false
      return '已开放点歌'
    case 'playing': return handlePlaying(cmd)
    default: return null
  }
}

function handleOrder(cmd: ParsedCommand): string {
  if (state.paused) {
    notify(`${cmd.source.nickname} 点歌失败：点歌已暂停`)
    return '点歌已暂停'
  }
  if (state.trackList.length >= config.maxQueueLength) {
    notify(`${cmd.source.nickname} 点歌失败：点歌板已满`)
    return '点歌板已满'
  }

  const userCount = state.trackList.filter(
    (t) => t.orderedBy.userId === cmd.source.userId
  ).length
  if (config.maxPerUser > 0 && userCount >= config.maxPerUser) {
    notify(`${cmd.source.nickname} 点歌失败：每人最多点 ${config.maxPerUser} 首`)
    return `每人最多点 ${config.maxPerUser} 首`
  }

  const allowedLevels = config.allowedLevels.length > 0 ? config.allowedLevels : undefined

  let results: SearchResult[]
  if (cmd.params.exactId) {
    const song = songDB.getSong(config.gameName, cmd.params.exactId)
    if (song) results = [{ song, score: 200, matchedField: 'id' as const }]
    else results = []
  } else {
    results = songDB.search(config.gameName, cmd.params.keywords, 20, allowedLevels)
  }

  if (results.length === 0) {
    notify(`${cmd.source.nickname} 点歌失败：找不到「${cmd.params.keywords}」`)
    return '找不到相关歌曲'
  }

  const song = results[0].song

  if (!config.allowRepeat) {
    const exists = state.trackList.some((t) => t.songId === song.id)
    if (exists) {
      notify(`${cmd.source.nickname} 点歌失败：「${song.title}」已在队列中`)
      return '这首歌已在队列中'
    }
  }

  // Resolve difficulty and level
  let difficulty: string
  let level: string
  const levelSet = allowedLevels ? new Set(allowedLevels) : null

  if (cmd.params.difficulty) {
    const idx = song.lvNameArr.findIndex(
      (n) => n.toUpperCase() === cmd.params.difficulty!.toUpperCase()
    )
    if (idx !== -1) {
      difficulty = song.lvNameArr[idx]
      level = song.lvArr[idx]
    } else {
      difficulty = song.lvNameArr[song.lvNameArr.length - 1]
      level = song.lvArr[song.lvArr.length - 1]
    }
  } else if (levelSet) {
    // Pick highest difficulty within allowed levels
    let bestIdx = -1
    for (let i = song.lvArr.length - 1; i >= 0; i--) {
      if (levelSet.has(song.lvArr[i])) { bestIdx = i; break }
    }
    if (bestIdx === -1) {
      notify(`${cmd.source.nickname} 点歌失败：「${song.title}」没有符合难度限制的谱面`)
      return '该歌曲没有符合难度限制的谱面'
    }
    difficulty = song.lvNameArr[bestIdx]
    level = song.lvArr[bestIdx]
  } else {
    // Default: highest difficulty
    const lastIdx = song.lvNameArr.length - 1
    difficulty = song.lvNameArr[lastIdx]
    level = song.lvArr[lastIdx]
  }

  const track: TrackEntry = {
    id: nextTrackId(),
    songId: song.id,
    song,
    orderedBy: {
      userId: cmd.source.userId,
      nickname: cmd.source.nickname,
      platform: cmd.source.platform,
      avatar: cmd.source.avatar,
    },
    orderTime: Date.now(),
    difficulty,
    level,
    isPlaying: false,
  }

  if (config.giftOrderEnabled && config.giftOrderCost > 0) {
    if (!deductBalance(cmd.source.userId, config.giftOrderCost)) {
      const balance = getBalance(cmd.source.userId)
      notify(`${cmd.source.nickname} 余额不足：当前 ${balance} 元，需要 ${config.giftOrderCost} 元`)
      return `余额不足，点歌需要 ${config.giftOrderCost} 元（当前: ${balance} 元）`
    }
  }

  state.trackList.push(track)
  notify(`${cmd.source.nickname} 点歌：${song.title} [${difficulty} ${level}]`)
  return `${song.title} [${difficulty} ${level}] 已加入 (第${state.trackList.length}首)`
}

function handleCancelOrder(cmd: ParsedCommand): string {
  const idx = findLastIndex(
    state.trackList,
    (t) => t.orderedBy.userId === cmd.source.userId
  )
  if (idx === -1) return '你没有已点的歌曲'

  const removed = state.trackList.splice(idx, 1)[0]
  return `已取消: ${removed.song.title}`
}

function handleDifficulty(cmd: ParsedCommand): string {
  const userTracks = state.trackList.filter(
    (t) => t.orderedBy.userId === cmd.source.userId
  )
  if (userTracks.length === 0) return '你没有已点的歌曲'

  const target = userTracks[userTracks.length - 1]
  const value = cmd.params.value.toUpperCase()

  if (value === '+' || value === '-') {
    if (!target.song.lvNameArr.length) return '该曲目无难度信息'
    const currentIdx = target.difficulty
      ? target.song.lvNameArr.findIndex((n) => n.toUpperCase() === target.difficulty?.toUpperCase())
      : 0
    const newIdx = value === '+'
      ? Math.min(currentIdx + 1, target.song.lvNameArr.length - 1)
      : Math.max(currentIdx - 1, 0)
    target.difficulty = target.song.lvNameArr[newIdx]
    target.level = target.song.lvArr[newIdx]
    return `${target.song.title}: ${target.difficulty} ${target.level ?? ''}`
  }

  const matchIdx = target.song.lvNameArr.findIndex(
    (n) => n.toUpperCase() === value || n.toUpperCase().includes(value)
  )
  if (matchIdx !== -1) {
    target.difficulty = target.song.lvNameArr[matchIdx]
    target.level = target.song.lvArr[matchIdx]
    return `${target.song.title}: ${target.difficulty} ${target.level ?? ''}`
  }

  return `未匹配到难度: ${cmd.params.value}`
}

function handleLookup(cmd: ParsedCommand): string {
  const results = songDB.search(config.gameName, cmd.params.keywords, 1)
  if (results.length > 0) {
    const s = results[0].song
    return `找到了: ${s.title} - ${s.artist}`
  }
  return '没有找到相关歌曲'
}

function handleDelete(cmd: ParsedCommand): string {
  const target = cmd.params.target
  if (target === 'all') {
    state.trackList.splice(0)
    return '已清空点歌板'
  }
  const num = parseInt(target)
  if (!isNaN(num) && num > 0 && num <= state.trackList.length) {
    const removed = state.trackList.splice(num - 1, 1)[0]
    return `已删除: ${removed.song.title}`
  }
  return '无效的序号'
}

function handleFinish(cmd: ParsedCommand): string {
  const num = parseInt(cmd.params.target)
  if (!isNaN(num) && num > 0 && num <= state.trackList.length) {
    const [done] = state.trackList.splice(num - 1, 1)
    state.trackDoneList.push(done)
    return `已完成: ${done.song.title}`
  }
  return '无效的序号'
}

function handleClear(): string {
  state.trackList.splice(0)
  return '已清空点歌板'
}

function handlePlaying(cmd: ParsedCommand): string {
  const idx = cmd.params.index ? parseInt(cmd.params.index) - 1 : -1

  // Clear all playing states
  state.trackList.forEach((t) => (t.isPlaying = false))

  if (idx >= 0 && idx < state.trackList.length) {
    state.trackList[idx].isPlaying = true
    return `游玩中: ${state.trackList[idx].song.title}`
  }
  return '已取消游玩状态'
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i
  }
  return -1
}
