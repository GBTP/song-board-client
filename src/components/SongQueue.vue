<script setup lang="ts">
import { ref } from 'vue'
import { state } from '@/stores/queue'
import SongCard from './SongCard.vue'

const showDone = ref(false)

function handleFinish(index: number) {
  const [done] = state.trackList.splice(index - 1, 1)
  if (done) state.trackDoneList.push(done)
}

function clearDone() {
  state.trackDoneList.splice(0)
}
</script>

<template>
  <div class="song-queue">
    <div v-if="state.trackList.length === 0 && !showDone" class="queue-empty">
      暂无点歌
    </div>

    <!-- Active queue -->
    <div v-if="state.trackList.length > 0" class="queue-scroll">
      <SongCard
        v-for="(track, idx) in state.trackList"
        :key="track.id"
        :track="track"
        :index="idx + 1"
        :show-finish="true"
        @finish="handleFinish"
      />
    </div>

    <!-- Done toggle -->
    <div v-if="state.trackDoneList.length > 0" class="done-bar">
      <button class="done-toggle" @click="showDone = !showDone">
        {{ showDone ? '收起' : '已完成' }} ({{ state.trackDoneList.length }})
      </button>
      <button v-if="showDone" class="done-clear" @click="clearDone">清空</button>
    </div>

    <!-- Done list -->
    <div v-if="showDone && state.trackDoneList.length > 0" class="queue-scroll done-list">
      <SongCard
        v-for="(track, idx) in state.trackDoneList"
        :key="track.id"
        :track="track"
        :index="idx + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.song-queue {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 4px;
}
.queue-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0;
}
.queue-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
.done-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.done-toggle {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
}
.done-clear {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(239, 83, 80, 0.3);
  color: #ef5350;
  font-size: 11px;
  cursor: pointer;
}
.done-list {
  opacity: 0.6;
}
</style>
