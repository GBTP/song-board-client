<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { settings, cameraResolutionMap } from '@/stores/settings'

const video = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const error = ref('')
let restartTimer: ReturnType<typeof setTimeout> | null = null

async function startCamera() {
  stopCamera()
  error.value = ''
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: settings.cameraFacing,
        width: { ideal: cameraResolutionMap[settings.cameraResolution].width },
        height: { ideal: cameraResolutionMap[settings.cameraResolution].height },
      },
      audio: false,
    })
    if (video.value) {
      video.value.srcObject = stream.value
    }
    // 监听 track 结束事件（安卓省电/过热会主动关闭 track）
    stream.value.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        scheduleRestart()
      })
    })
  } catch (e: any) {
    error.value = e.message || '无法访问摄像头'
  }
}

function stopCamera() {
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (video.value) {
    video.value.srcObject = null
  }
}

function scheduleRestart() {
  if (restartTimer) return
  restartTimer = setTimeout(() => {
    restartTimer = null
    startCamera()
  }, 500)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 页面恢复可见时，检查 track 是否仍然活跃
    const track = stream.value?.getVideoTracks()[0]
    if (!track || track.readyState === 'ended') {
      scheduleRestart()
    }
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startCamera()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopCamera()
})

watch(() => settings.cameraFacing, startCamera)
watch(() => settings.cameraResolution, startCamera)
</script>

<template>
  <div class="camera-layer">
    <video ref="video" autoplay playsinline muted class="camera-video" />
    <div v-if="error" class="camera-error">{{ error }}</div>
  </div>
</template>

<style scoped>
.camera-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #000;
}
.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.8);
}
</style>
