export interface DanmakuMessage {
  platform: 'qq' | 'bilibili' | 'douyin'
  userId: string
  nickname: string
  content: string
  timestamp: number
}
