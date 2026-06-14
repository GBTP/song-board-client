<script setup lang="ts">
import { ref, computed } from 'vue'
import { settings } from '@/stores/settings'
import { config, state } from '@/stores/queue'
import { songDB } from '@/core/song-db'
import { resetBalances } from '@/stores/gift'

const newAdminId = ref('')

const allLevels = computed(() => songDB.getAllLevels(config.gameName))

function toggleLevel(level: string) {
  const idx = config.allowedLevels.indexOf(level)
  if (idx !== -1) {
    config.allowedLevels.splice(idx, 1)
  } else {
    config.allowedLevels.push(level)
  }
}

function addAdmin() {
  const id = newAdminId.value.trim()
  if (id && !config.adminIds.includes(id)) {
    config.adminIds.push(id)
  }
  newAdminId.value = ''
}

function removeAdmin(id: string) {
  const idx = config.adminIds.indexOf(id)
  if (idx !== -1) config.adminIds.splice(idx, 1)
}

function clearQueue() {
  state.trackList.splice(0)
}

function clearDone() {
  state.trackDoneList.splice(0)
}

async function refreshSongData() {
  await songDB.clearCache()
  await songDB.load(config.gameName)
}

function openCertUrl() {
  const httpsUrl = settings.wsUrl.replace(/^wss:\/\//, 'https://')
  window.open(httpsUrl, '_blank')
}
</script>

<template>
  <div class="settings-view">
    <header class="settings-header">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <h1>设置</h1>
    </header>

    <section class="settings-section">
      <h2>连接</h2>
      <label>
        <span>弹幕服务器地址</span>
        <input v-model="settings.wsUrl" placeholder="ws://your-server:3000" />
      </label>
      <button v-if="settings.wsUrl.startsWith('wss://')" class="trust-cert-btn" @click="openCertUrl">
        信任证书（首次连接需要）
      </button>
    </section>

    <section class="settings-section">
      <h2>摄像头</h2>
      <label>
        <span>摄像头方向</span>
        <select v-model="settings.cameraFacing">
          <option value="environment">后置</option>
          <option value="user">前置</option>
        </select>
      </label>
    </section>

    <section class="settings-section">
      <h2>叠加层</h2>
      <label>
        <span>透明度</span>
        <input type="range" v-model.number="settings.overlayOpacity" min="0.3" max="1" step="0.05" />
        <span class="range-value">{{ Math.round(settings.overlayOpacity * 100) }}%</span>
      </label>
    </section>

    <section class="settings-section">
      <h2>点歌规则</h2>
      <label>
        <span>游戏</span>
        <select v-model="config.gameName">
          <option value="maimai">舞萌 DX</option>
        </select>
      </label>
      <label>
        <span>队列上限</span>
        <input type="number" v-model.number="config.maxQueueLength" min="1" max="100" />
      </label>
      <label>
        <span>每人点歌上限 (0=不限)</span>
        <input type="number" v-model.number="config.maxPerUser" min="0" max="50" />
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="config.allowRepeat" />
        <span>允许重复点歌</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="config.giftOrderEnabled" />
        <span>开启礼物点歌（需送礼才能点歌）</span>
      </label>
      <label v-if="config.giftOrderEnabled">
        <span>每次点歌消耗</span>
        <input type="number" v-model.number="config.giftOrderCost" min="0" step="0.1" />
        <span class="range-value">元</span>
      </label>
    </section>

    <section class="settings-section">
      <h2>难度筛选</h2>
      <p class="section-hint">勾选允许的难度等级，不勾选则不限制</p>
      <div class="level-grid">
        <button
          v-for="lv in allLevels"
          :key="lv"
          class="level-chip"
          :class="{ active: config.allowedLevels.includes(lv) }"
          @click="toggleLevel(lv)"
        >{{ lv }}</button>
      </div>
      <button v-if="config.allowedLevels.length > 0" class="clear-levels-btn" @click="config.allowedLevels.splice(0)">
        清除筛选 (当前已选 {{ config.allowedLevels.length }} 个)
      </button>
    </section>

    <section class="settings-section">
      <h2>管理员</h2>
      <div class="admin-list">
        <div v-for="id in config.adminIds" :key="id" class="admin-item">
          <span>{{ id }}</span>
          <button @click="removeAdmin(id)">×</button>
        </div>
      </div>
      <div class="admin-add">
        <input v-model="newAdminId" placeholder="QQ号/用户ID" @keyup.enter="addAdmin" />
        <button @click="addAdmin">添加</button>
      </div>
    </section>

    <section class="settings-section">
      <h2>操作</h2>
      <div class="action-buttons">
        <button @click="clearQueue">清空队列</button>
        <button @click="clearDone">清空已完成</button>
        <button @click="resetBalances">重置礼物余额</button>
        <button @click="refreshSongData">刷新歌曲数据</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-view {
  min-height: 100vh;
  padding: 16px;
  background: #1a1a2e;
  color: #eee;
  overflow-y: auto;
  position: fixed;
  inset: 0;
}
.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.settings-header h1 {
  font-size: 18px;
  margin: 0;
}
.back-btn {
  color: #4fc3f7;
  text-decoration: none;
  font-size: 14px;
}
.settings-section {
  margin-bottom: 20px;
}
.settings-section h2 {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
}
.settings-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}
.settings-section label > span:first-child {
  min-width: 100px;
  color: rgba(255, 255, 255, 0.8);
}
.settings-section input[type="text"],
.settings-section input[type="number"],
.settings-section input:not([type]),
.settings-section select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
}
.settings-section input[type="number"] {
  max-width: 80px;
}
.range-value {
  min-width: 36px;
  text-align: right;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.checkbox-label {
  cursor: pointer;
}
.admin-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.admin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 12px;
}
.admin-item button {
  background: none;
  border: none;
  color: #ef5350;
  font-size: 16px;
  cursor: pointer;
}
.admin-add {
  display: flex;
  gap: 8px;
}
.admin-add input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
}
.admin-add button, .action-buttons button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4fc3f7;
  color: #000;
  font-size: 12px;
  cursor: pointer;
}
.trust-cert-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 171, 64, 0.2);
  color: #ffab40;
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
}
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.action-buttons button {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.section-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}
.level-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.level-chip {
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
}
.level-chip.active {
  background: rgba(79, 195, 247, 0.25);
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.clear-levels-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
}
</style>
