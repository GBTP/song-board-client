import type { SongEntry, SearchResult, GameAdapter } from '@/types/song'

const CJK_VARIANTS: Record<string, string> = {
  红: '紅', 华: '華', 乐: '楽', 图: '図', 气: '気', 实: '実',
  传: '伝', 战: '戦', 鸟: '鳥', 爱: '愛', 梦: '夢', 门: '門',
  龙: '竜', 铁: '鉄', 觉: '覚', 单: '単', 劳: '労', 团: '団',
  樱: '桜', 绘: '絵', 惠: '恵', 丝: '糸', 权: '権',
  卖: '売', 亚: '亜', 兽: '獣', 发: '発', 严: '厳',
  广: '広', 应: '応', 艺: '芸', 转: '転', 轻: '軽', 边: '辺',
  对: '対', 体: '体', 个: '個', 两: '両',
  举: '挙', 从: '従', 围: '囲', 圆: '円', 报: '報', 変: '変',
  姬: '姫', 齐: '斉', 灵: '霊', 涩: '渋', 泽: '沢', 择: '択',
  晓: '暁', 济: '済', 赖: '頼',
  荣: '栄', 営: '営', 满: '満', 県: '県',
  萤: '蛍', 释: '釈', 恋: '恋', 続: '続',
}

function normalizeText(text: string): string {
  let result = text.toLowerCase().replace(/[～〜~]/g, '').replace(/[\s　]+/g, ' ').trim()
  let mapped = ''
  for (const ch of result) {
    mapped += CJK_VARIANTS[ch] ?? ch
  }
  return mapped
}

interface SongIndex {
  songs: SongEntry[]
  songMap: Map<string, SongEntry>
  aliases: Map<string, string[]> // normalized alias → song ids
  normalizedTitles: Map<string, string> // song id → normalized title
  normalizedArtists: Map<string, string> // song id → normalized artist
}

const DB_NAME = 'song-board-cache'
const DB_VERSION = 1
const STORE_NAME = 'songs'
const CACHE_TTL = 24 * 60 * 60 * 1000

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCached<T>(key: string): Promise<T | null> {
  const db = await openCacheDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => {
      const entry = req.result
      if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        resolve(entry.data as T)
      } else {
        resolve(null)
      }
    }
    req.onerror = () => resolve(null)
  })
}

async function setCache(key: string, data: unknown): Promise<void> {
  const db = await openCacheDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ data, timestamp: Date.now() }, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

export class SongDB {
  private adapters: Map<string, GameAdapter> = new Map()
  private indices: Map<string, SongIndex> = new Map()
  private loading: Map<string, Promise<void>> = new Map()

  registerAdapter(adapter: GameAdapter) {
    this.adapters.set(adapter.name, adapter)
  }

  getAdapterNames(): string[] {
    return [...this.adapters.keys()]
  }

  async load(gameName: string): Promise<void> {
    if (this.indices.has(gameName)) return
    if (this.loading.has(gameName)) return this.loading.get(gameName)

    const promise = this.doLoad(gameName).catch((err) => {
      this.loading.delete(gameName)
      throw err
    })
    this.loading.set(gameName, promise)
    await promise
    this.loading.delete(gameName)
  }

  private async doLoad(gameName: string): Promise<void> {
    const adapter = this.adapters.get(gameName)
    if (!adapter) throw new Error(`No adapter for game: ${gameName}`)

    const cacheKey = `${gameName}-songs`
    const aliasCacheKey = `${gameName}-aliases`

    let songs = await getCached<SongEntry[]>(cacheKey)
    if (!songs) {
      songs = await adapter.fetchSongs()
      await setCache(cacheKey, songs)
    }

    let aliasRaw = await getCached<[string, string[]][]>(aliasCacheKey)
    let aliasMap: Map<string, string[]>
    if (!aliasRaw) {
      aliasMap = await adapter.fetchAliases()
      await setCache(aliasCacheKey, [...aliasMap.entries()])
    } else {
      aliasMap = new Map(aliasRaw)
    }

    const songMap = new Map<string, SongEntry>()
    const normalizedTitles = new Map<string, string>()
    const normalizedArtists = new Map<string, string>()

    for (const song of songs) {
      songMap.set(song.id, song)
      normalizedTitles.set(song.id, normalizeText(song.title))
      normalizedArtists.set(song.id, normalizeText(song.artist))
    }

    // Build alias index: normalize each alias string → song ids
    const aliases = new Map<string, string[]>()
    for (const [songId, aliasList] of aliasMap) {
      for (const alias of aliasList) {
        const key = normalizeText(alias)
        if (!key) continue
        const existing = aliases.get(key) ?? []
        existing.push(songId)
        aliases.set(key, existing)
      }
    }

    this.indices.set(gameName, { songs, songMap, aliases, normalizedTitles, normalizedArtists })
  }

  getSong(gameName: string, id: string): SongEntry | undefined {
    return this.indices.get(gameName)?.songMap.get(id)
  }

  getSongCount(gameName: string): number {
    return this.indices.get(gameName)?.songs.length ?? 0
  }

  search(gameName: string, query: string, maxResults = 20, allowedLevels?: string[]): SearchResult[] {
    const index = this.indices.get(gameName)
    if (!index) return []

    const normalized = normalizeText(query)
    if (!normalized) return []

    const levelFilter = allowedLevels && allowedLevels.length > 0
      ? new Set(allowedLevels)
      : null

    const results: SearchResult[] = []

    for (const song of index.songs) {
      if (levelFilter && !song.lvArr.some((lv) => levelFilter.has(lv))) {
        continue
      }

      let score = 0
      let matchedField: SearchResult['matchedField'] = 'title'

      const nTitle = index.normalizedTitles.get(song.id)!
      const nArtist = index.normalizedArtists.get(song.id)!

      // ID exact match
      if (song.id === query) {
        score = 200
        matchedField = 'id'
      }
      // Alias exact match
      else if (index.aliases.has(normalized)) {
        const ids = index.aliases.get(normalized)!
        if (ids.includes(song.id)) {
          score = 90
          matchedField = 'alias'
        }
      }

      if (score === 0) {
        // Title matching
        if (nTitle === normalized) {
          score = 120
        } else if (nTitle.startsWith(normalized)) {
          score = 60
        } else if (nTitle.includes(normalized)) {
          score = 30
        }
        // Artist matching
        else if (nArtist.includes(normalized)) {
          score = 15
          matchedField = 'artist'
        }
      }

      if (score > 0) {
        // Shorter titles rank higher for ties
        score -= nTitle.length / 100
        results.push({ song, score, matchedField })
      }
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, maxResults)
  }

  getAllLevels(gameName: string): string[] {
    const index = this.indices.get(gameName)
    if (!index) return []
    const levels = new Set<string>()
    for (const song of index.songs) {
      song.lvArr.forEach((lv) => levels.add(lv))
    }
    return [...levels].sort(sortLevel)
  }

  getCoverUrl(gameName: string, songId: string): string {
    const adapter = this.adapters.get(gameName)
    return adapter?.getCoverUrl(songId) ?? ''
  }

  async clearCache(): Promise<void> {
    const db = await openCacheDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
  }
}

function sortLevel(a: string, b: string): number {
  const na = parseFloat(a)
  const nb = parseFloat(b)
  if (!isNaN(na) && !isNaN(nb)) {
    if (na !== nb) return na - nb
    return (a.endsWith('+') ? 1 : 0) - (b.endsWith('+') ? 1 : 0)
  }
  return a.localeCompare(b)
}

export const songDB = new SongDB()
