import { reactive, watch } from 'vue'

export interface Settings {
  wsUrl: string
  cameraFacing: 'user' | 'environment'
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
  overlayOpacity: 0.85,
  overlayPosition: 'top',
  overlayScale: 1,
}

export const settings: Settings = reactive(loadSettings())

watch(settings, (val) => {
  localStorage.setItem('settings', JSON.stringify(val))
}, { deep: true })
