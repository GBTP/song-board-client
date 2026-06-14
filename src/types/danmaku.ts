export interface DanmakuMessage {
  type?: 'chat' | 'gift'
  platform: 'qq' | 'bilibili' | 'douyin'
  userId: string
  nickname: string
  avatar?: string
  content: string
  timestamp: number
  gift?: {
    name: string
    value: number
  }
}
