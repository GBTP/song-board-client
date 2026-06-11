import { createRouter, createWebHashHistory } from 'vue-router'
import OverlayView from '@/views/OverlayView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: OverlayView },
    { path: '/settings', component: SettingsView },
  ],
})

export default router
