import type { DanmakuMessage } from '@/types/danmaku'

export type CommandType =
  | 'order'
  | 'cancelOrder'
  | 'difficulty'
  | 'lookup'
  | 'delete'
  | 'finish'
  | 'clear'
  | 'pause'
  | 'resume'
  | 'playing'

export interface ParsedCommand {
  type: CommandType
  source: DanmakuMessage
  params: Record<string, string>
}

interface CommandPattern {
  type: CommandType
  patterns: RegExp[]
  adminOnly: boolean
}

const PATTERNS: CommandPattern[] = [
  {
    type: 'order',
    patterns: [/^点歌\s+(.+)$/],
    adminOnly: false,
  },
  {
    type: 'cancelOrder',
    patterns: [/^取消点歌$/],
    adminOnly: false,
  },
  {
    type: 'difficulty',
    patterns: [/^难度\s+(.+)$/],
    adminOnly: false,
  },
  {
    type: 'lookup',
    patterns: [/^有没有\s+(.+)$/],
    adminOnly: false,
  },
  {
    type: 'delete',
    patterns: [/^删除\s+(.+)$/],
    adminOnly: true,
  },
  {
    type: 'finish',
    patterns: [/^完成\s+(.+)$/],
    adminOnly: true,
  },
  {
    type: 'clear',
    patterns: [/^清空$/],
    adminOnly: true,
  },
  {
    type: 'pause',
    patterns: [/^暂停点歌$/],
    adminOnly: true,
  },
  {
    type: 'resume',
    patterns: [/^(?:开放|开启)点歌$/],
    adminOnly: true,
  },
  {
    type: 'playing',
    patterns: [/^游玩\s*(.*)$/],
    adminOnly: true,
  },
]

export function parseCommand(msg: DanmakuMessage, adminIds: Set<string>): ParsedCommand | null {
  const text = msg.content.trim()
  if (!text) return null

  for (const cp of PATTERNS) {
    for (const pattern of cp.patterns) {
      const match = text.match(pattern)
      if (!match) continue

      if (cp.adminOnly && !adminIds.has(msg.userId)) {
        return null
      }

      const params: Record<string, string> = {}

      switch (cp.type) {
        case 'order': {
          const raw = match[1].trim()
          // Check for #id syntax
          if (raw.startsWith('#')) {
            params.exactId = raw.slice(1)
          } else {
            // Split into keywords and possible difficulty
            const parts = raw.split(/\s+/)
            const keywords: string[] = []
            for (const part of parts) {
              if (/^(BASIC|ADVANCED|EXPERT|MASTER|Re:MASTER)$/i.test(part)) {
                params.difficulty = part.toUpperCase()
              } else {
                keywords.push(part)
              }
            }
            params.keywords = keywords.join(' ')
          }
          break
        }
        case 'difficulty':
          params.value = match[1].trim()
          break
        case 'lookup':
          params.keywords = match[1].trim()
          break
        case 'delete':
        case 'finish':
          params.target = match[1].trim()
          break
        case 'playing':
          params.index = (match[1] ?? '').trim()
          break
      }

      return { type: cp.type, source: msg, params }
    }
  }

  return null
}
