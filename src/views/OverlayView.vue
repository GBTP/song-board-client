<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CameraLayer from '@/components/CameraLayer.vue'
import StatusBar from '@/components/StatusBar.vue'
import SongQueue from '@/components/SongQueue.vue'
import ToastNotify from '@/components/ToastNotify.vue'
import { WsClient } from '@/core/ws-client'
import { handleDanmaku } from '@/stores/queue'
import { handleGiftMessage } from '@/stores/gift'
import { settings } from '@/stores/settings'
import { songDB } from '@/core/song-db'
import { maimaiAdapter } from '@/core/adapters/maimai'
import { config } from '@/stores/queue'

const connected = ref(false)
const loading = ref(true)
let ws: WsClient | null = null

onMounted(async () => {
  songDB.registerAdapter(maimaiAdapter)
  await songDB.load(config.gameName)
  loading.value = false

  if (settings.wsUrl) {
    ws = new WsClient(settings.wsUrl)
    ws.onMessage((msg) => {
      if (msg.type === 'gift') {
        handleGiftMessage(msg)
      } else {
        handleDanmaku(msg)
      }
    })
    ws.onStatus((status) => (connected.value = status))
    ws.connect()
  }
})

onUnmounted(() => {
  ws?.disconnect()
})
</script>

<template>
  <div class="overlay-view">
    <CameraLayer />
    <ToastNotify />
    <div class="overlay-content" :style="{ opacity: settings.overlayOpacity }">
      <StatusBar :connected="connected" />
      <div v-if="loading" class="loading-text">加载歌曲数据中...</div>
      <SongQueue v-else />
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
  padding-top: calc(env(safe-area-inset-top, 0px) + 6px);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 6px);
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
</style>
