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
        <button class="gear" :class="{ on: showSettings }" @click="showSettings = !showSettings" aria-label="Settings">{{ showSettings ? '×' : '⚙' }}</button>
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
.topbar { display: flex; justify-content: space-between; align-items: center; max-width: 640px; margin: 0 auto; padding: 1rem 1.25rem 0; }
.brand { font-family: var(--display); font-size: 1.6rem; color: var(--accent); letter-spacing: 0.04em; }
.level { display: flex; align-items: center; gap: 0.75rem; }
.tape { background: var(--tape); color: var(--bg); font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 0.2rem 0.5rem; transform: rotate(2deg); display: inline-block; }
.xp { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-dim); }
.gear { background: none; border: 1px solid var(--line); color: var(--ink-dim); width: 2rem; height: 2rem; cursor: pointer; font-size: 1rem; }
.gear.on { border-color: var(--accent); color: var(--paper); }
.toasts { position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 0.5rem; z-index: 10; }
.toast { background: var(--paper); color: var(--bg); font-family: var(--mono); font-size: 0.8rem; letter-spacing: 0.06em; padding: 0.6rem 1rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>
