<script setup lang="ts">
import type { TrackEntry } from '@/types/queue'
import { songDB } from '@/core/song-db'
import { config } from '@/stores/queue'

const props = defineProps<{
  track: TrackEntry
  index: number
  showFinish?: boolean
}>()

const emit = defineEmits<{
  finish: [index: number]
}>()

const coverUrl = songDB.getCoverUrl(config.gameName, props.track.songId)
</script>

<template>
  <div class="song-card" :class="{ playing: track.isPlaying }">
    <div class="card-index">{{ index }}</div>
    <img :src="coverUrl" class="card-cover" loading="lazy" />
    <div class="card-title">{{ track.song.title }}</div>
    <div class="card-meta">
      <span class="card-diff">{{ track.difficulty ?? '' }}</span>
      <span class="card-level">{{ track.level ?? '' }}</span>
    </div>
    <div class="card-user">
      <img v-if="track.orderedBy.avatar" :src="track.orderedBy.avatar" class="card-avatar" />
      <span>{{ track.orderedBy.nickname }}</span>
    </div>
    <button v-if="showFinish" class="card-finish-btn" @click="emit('finish', index)">✓</button>
  </div>
</template>

<style scoped>
.song-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  position: relative;
  flex-shrink: 0;
}
.song-card.playing {
  border-color: #4fc3f7;
  background: rgba(30, 90, 140, 0.6);
}
.card-index {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
}
.card-cover {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  object-fit: cover;
}
.card-title {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-meta {
  display: flex;
  gap: 3px;
  font-size: 10px;
  margin-top: 2px;
}
.card-diff {
  color: #ffab40;
}
.card-level {
  color: #81c784;
}
.card-user {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
  max-width: 78px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.card-finish-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.7);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  padding: 0;
}
</style>
