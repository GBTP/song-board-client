<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { settings } from '@/stores/settings'

const video = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const error = ref('')

async function startCamera() {
  stopCamera()
  error.value = ''
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: settings.cameraFacing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    })
    if (video.value) {
      video.value.srcObject = stream.value
    }
  } catch (e: any) {
    error.value = e.message || '无法访问摄像头'
  }
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
}

onMounted(startCamera)
onUnmounted(stopCamera)

watch(() => settings.cameraFacing, startCamera)
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
