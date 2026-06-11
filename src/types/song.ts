export interface SongEntry {
  id: string
  title: string
  artist: string
  category: string
  bpm: number
  lvArr: string[]
  lvNameArr: string[]
  cover: string
}

export interface SearchResult {
  song: SongEntry
  score: number
  matchedField: 'id' | 'title' | 'artist' | 'alias'
}

export interface GameAdapter {
  name: string
  displayName: string
  fetchSongs(): Promise<SongEntry[]>
  fetchAliases(): Promise<Map<string, string[]>>
  getCoverUrl(songId: string): string
}
