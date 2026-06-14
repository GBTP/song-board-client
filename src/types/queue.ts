import type { SongEntry } from './song'

export interface TrackEntry {
  id: string
  songId: string
  song: SongEntry
  orderedBy: {
    userId: string
    nickname: string
    platform: string
    avatar?: string
  }
  orderTime: number
  difficulty?: string
  level?: string
  isPlaying: boolean
}

export interface BoardState {
  trackList: TrackEntry[]
  trackDoneList: TrackEntry[]
  paused: boolean
}

export interface BoardConfig {
  gameName: string
  maxQueueLength: number
  maxPerUser: number
  allowRepeat: boolean
  adminIds: string[]
  allowedLevels: string[]
  giftOrderEnabled: boolean
  giftOrderCost: number
}
