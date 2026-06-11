<script setup lang="ts">
import { state, config } from '@/stores/queue'

const props = defineProps<{
  connected: boolean
}>()
</script>

<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-dot" :class="connected ? 'on' : 'off'"></span>
      <span class="status-text">{{ state.paused ? '暂停中' : '点歌中' }}</span>
      <span class="game-badge">{{ config.gameName }}</span>
    </div>
    <div class="status-right">
      <span class="queue-count">{{ state.trackList.length }}/{{ config.maxQueueLength }}</span>
      <router-link to="/settings" class="btn-settings">⚙</router-link>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  backdrop-filter: blur(4px);
}
.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.on { background: #4caf50; }
.status-dot.off { background: #f44336; }
.status-text {
  font-size: 12px;
  color: #fff;
}
.game-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}
.queue-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
.btn-settings {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 16px;
}
</style>
