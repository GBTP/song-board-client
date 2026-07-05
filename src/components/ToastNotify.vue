<script setup lang="ts">
import { notifications } from '@/stores/notify'
</script>

<template>
  <Transition name="toast-group">
    <div v-if="notifications.length" class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="n in notifications" :key="n.id" class="toast-item">
          {{ n.message }}
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 48px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  width: 90%;
  max-width: 360px;
}
.toast-item {
  padding: 8px 14px;
  background: rgba(239, 83, 80, 0.9);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
