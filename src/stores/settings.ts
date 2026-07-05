import { reactive, watch } from 'vue'

export type CameraResolution = '480p' | '720p' | '1080p'

export const cameraResolutionMap: Record<CameraResolution, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
}

export interface Settings {
  wsUrl: string
  cameraFacing: 'user' | 'environment'
  cameraResolution: CameraResolution
  overlayOpacity: number
  overlayPosition: 'top' | 'bottom'
  overlayScale: number
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('settings')
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {}
  return { ...defaultSettings }
}

const defaultSettings: Settings = {
  wsUrl: '',
  cameraFacing: 'environment',
  cameraResolution: '720p',
  overlayOpacity: 0.85,
  overlayPosition: 'top',
  overlayScale: 1,
}

export const settings: Settings = reactive(loadSettings())

watch(settings, (val) => {
  localStorage.setItem('settings', JSON.stringify(val))
}, { deep: true })
