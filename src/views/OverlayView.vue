<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CameraLayer from '@/components/CameraLayer.vue'
import StatusBar from '@/components/StatusBar.vue'
import SongQueue from '@/components/SongQueue.vue'
import { WsClient } from '@/core/ws-client'
import { handleDanmaku } from '@/stores/queue'
import { settings } from '@/stores/settings'
import { songDB } from '@/core/song-db'
import { maimaiAdapter } from '@/core/adapters/maimai'
import { config } from '@/stores/queue'
import type { DanmakuMessage } from '@/types/danmaku'

const connected = ref(false)
const loading = ref(true)
const debugInput = ref('')
const debugResult = ref('')
let ws: WsClient | null = null

onMounted(async () => {
  songDB.registerAdapter(maimaiAdapter)
  await songDB.load(config.gameName)
  loading.value = false

  if (settings.wsUrl) {
    ws = new WsClient(settings.wsUrl)
    ws.onMessage(handleDanmaku)
    ws.onStatus((status) => (connected.value = status))
    ws.connect()
  }
})

onUnmounted(() => {
  ws?.disconnect()
})

function sendDebug() {
  const text = debugInput.value.trim()
  if (!text) return

  const msg: DanmakuMessage = {
    platform: 'qq',
    userId: 'debug_user',
    nickname: '测试用户',
    content: text,
    timestamp: Date.now(),
  }

  const result = handleDanmaku(msg)
  debugResult.value = result ?? '(无匹配指令)'
  debugInput.value = ''

  setTimeout(() => { debugResult.value = '' }, 3000)
}
</script>

<template>
  <div class="overlay-view">
    <CameraLayer />
    <div class="overlay-content" :style="{ opacity: settings.overlayOpacity }">
      <StatusBar :connected="connected" />
      <div v-if="loading" class="loading-text">加载歌曲数据中...</div>
      <SongQueue v-else />
      <!-- Debug input -->
      <div class="debug-bar">
        <div v-if="debugResult" class="debug-result">{{ debugResult }}</div>
        <div class="debug-input-row">
          <input
            v-model="debugInput"
            class="debug-input"
            placeholder="输入指令测试，如: 点歌 Oshama Scramble"
            @keyup.enter="sendDebug"
          />
          <button class="debug-btn" @click="sendDebug">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.overlay-content {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 6px;
  pointer-events: none;
}
.overlay-content > * {
  pointer-events: auto;
}
.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
.debug-bar {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.debug-result {
  font-size: 12px;
  color: #4fc3f7;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
}
.debug-input-row {
  display: flex;
  gap: 6px;
}
.debug-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
  backdrop-filter: blur(4px);
}
.debug-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
.debug-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #4fc3f7;
  color: #000;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
</style>
