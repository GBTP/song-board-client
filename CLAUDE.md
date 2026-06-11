# Song Board Client

音游点歌板前端 - 纯静态 Web 应用，用于手机直播时叠加在摄像头画面上显示点歌队列。

## 技术栈

- Vue 3 + TypeScript + Vite
- 无 UI 框架，纯 CSS
- 数据持久化：localStorage（设置/队列）+ IndexedDB（歌曲缓存）

## 项目结构

```
src/
├── types/          # 类型定义（danmaku, song, queue）
├── core/           # 核心逻辑
│   ├── ws-client.ts        # WebSocket 客户端（连弹幕推送后端）
│   ├── command-parser.ts   # 弹幕指令解析
│   ├── song-db.ts          # 歌曲搜索引擎 + IndexedDB 缓存
│   └── adapters/           # 游戏数据适配器
│       └── maimai.ts       # maimai DX (lxns API)
├── stores/         # 状态管理（Vue reactive + localStorage）
│   ├── queue.ts            # 点歌队列 + 指令处理
│   └── settings.ts         # UI/连接设置
├── views/          # 页面
│   ├── OverlayView.vue     # 主界面（摄像头 + 点歌板叠加）
│   └── SettingsView.vue    # 设置页
└── components/     # UI 组件
```

## 开发

```bash
npm install
npm run dev          # 启动开发服务器（0.0.0.0，手机可局域网访问）
npm run build        # 构建静态产物到 dist/
npx vue-tsc --noEmit # 类型检查
```

## 架构要点

- 前端不直连任何直播平台，只通过 WebSocket 接收统一格式的弹幕消息（`DanmakuMessage`）
- 弹幕推送后端是独立项目（私有仓库），负责对接 NapCat/B站/抖音等
- 歌曲数据运行时从 lxns API 拉取，24h 缓存到 IndexedDB
- 游戏适配器模式（`GameAdapter` 接口）支持扩展多游戏
- 点歌逻辑全在浏览器端完成

## 弹幕消息格式（前后端契约）

```typescript
interface DanmakuMessage {
  platform: 'qq' | 'bilibili' | 'douyin'
  userId: string
  nickname: string
  content: string
  timestamp: number
}
```

## 支持的指令

用户指令：
- `点歌 <关键词/别名/#id> [难度名]`
- `取消点歌`
- `难度 <MASTER/Re:MASTER/+/->`
- `有没有 <关键词>`

管理员指令：
- `删除 <序号/all>`
- `完成 <序号>`
- `清空`
- `暂停点歌` / `开放点歌`
- `游玩 [序号]`
