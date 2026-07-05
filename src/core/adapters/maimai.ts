import type { SongEntry, GameAdapter } from '@/types/song'

const API_BASE = 'https://maimai.lxns.net/api/v0/maimai'
const ASSETS_BASE = 'https://assets2.lxns.net/maimai'

const DIFFICULTY_NAMES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER']

interface LxnsSong {
  id: number
  title: string
  artist: string
  genre: string
  bpm: number
  version: number
  difficulties: {
    standard: LxnsDifficulty[]
    dx: LxnsDifficulty[]
  }
}

interface LxnsDifficulty {
  type: string
  difficulty: number
  level: string
  level_value: number
  note_designer: string
  version: number
}

interface LxnsAlias {
  song_id: number
  aliases: string[]
}

export const maimaiAdapter: GameAdapter = {
  name: 'maimai',
  displayName: '舞萌 DX',

  async fetchSongs(): Promise<SongEntry[]> {
    const res = await fetch(`${API_BASE}/song/list`)
    if (!res.ok) throw new Error(`获取歌曲列表失败: ${res.status}`)
    const data: { songs: LxnsSong[] } = await res.json()

    return data.songs.map((s) => {
      const diffs = s.difficulties.dx.length > 0 ? s.difficulties.dx : s.difficulties.standard
      const lvArr = diffs.map((d) => d.level)
      const lvNameArr = diffs.map((d) => DIFFICULTY_NAMES[d.difficulty] ?? `LV${d.difficulty}`)

      return {
        id: String(s.id),
        title: s.title,
        artist: s.artist,
        category: s.genre,
        bpm: s.bpm,
        lvArr,
        lvNameArr,
        cover: `${ASSETS_BASE}/jacket/${s.id}.png`,
      }
    })
  },

  async fetchAliases(): Promise<Map<string, string[]>> {
    const res = await fetch(`${API_BASE}/alias/list`)
    if (!res.ok) throw new Error(`获取别名列表失败: ${res.status}`)
    const data: { aliases: LxnsAlias[] } = await res.json()

    const map = new Map<string, string[]>()
    for (const entry of data.aliases) {
      map.set(String(entry.song_id), entry.aliases)
    }
    return map
  },

  getCoverUrl(songId: string): string {
    return `${ASSETS_BASE}/jacket/${songId}.png`
  },
}
