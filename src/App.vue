<script setup lang="ts">
import { ref } from 'vue'
import TodayView from './views/TodayView.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useProgressStore } from './stores/progress'

const progressStore = useProgressStore()
const showSettings = ref(false)
</script>

<template>
  <div class="app">
    <nav class="topbar">
      <span class="brand">Sticks</span>
      <span class="level">
        <span class="tape">Lv {{ progressStore.level }}</span>
        <span class="xp">{{ progressStore.progress.xp }} XP · {{ progressStore.toNext }} to next</span>
        <button class="gear" :class="{ on: showSettings }" @click="showSettings = !showSettings" aria-label="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <template v-if="showSettings"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></template>
            <template v-else><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></template>
          </svg>
        </button>
      </span>
    </nav>
    <SettingsPanel v-if="showSettings" />
    <TodayView v-else />
    <div class="toasts">
      <transition-group name="toast">
        <div v-for="t in progressStore.toasts" :key="t.id" class="toast">{{ t.text }}</div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.topbar { display: flex; justify-content: space-between; align-items: center; max-width: 640px; margin: 0 auto; padding: 16px 20px 0; }
.brand { font-family: var(--display); font-size: 28px; line-height: 32px; color: var(--accent); letter-spacing: 0.04em; }
.level { display: flex; align-items: center; gap: 12px; }
.level .tape { transform: rotate(2deg); }
.xp { font-family: var(--mono); font-size: 12px; line-height: 16px; letter-spacing: 0.02em; color: var(--ink-dim); font-variant-numeric: tabular-nums; }
.gear { display: grid; place-items: center; background: none; border: 1px solid var(--line); color: var(--ink-dim); width: 32px; height: 32px; padding: 0; cursor: pointer; transition: color 150ms var(--ease), border-color 150ms var(--ease); }
.gear:hover { color: var(--paper); }
.gear.on { border-color: var(--accent); color: var(--paper); }
.toasts { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 10; }
.toast { background: var(--paper); color: var(--bg); font-family: var(--mono); font-size: 14px; line-height: 20px; padding: 8px 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
.toast-enter-active, .toast-leave-active { transition: opacity 300ms var(--ease), transform 300ms var(--ease); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>
