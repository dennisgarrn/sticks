import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useStorage } from '../composables/useStorage'
import { EMPTY_PROGRESS, applyLog, levelFromXp, xpToNextLevel, type PracticeLog, type Progress } from '../domain'
import { usePracticeStore } from './practice'
import { useSettingsStore } from './settings'

export interface Toast {
  id: number
  text: string
}

export const useProgressStore = defineStore('progress', () => {
  const progress = useStorage<Progress>('drum:progress', EMPTY_PROGRESS)
  const toasts = ref<Toast[]>([])
  const level = computed(() => levelFromXp(progress.value.xp))
  const toNext = computed(() => xpToNextLevel(progress.value.xp))

  const push = (text: string) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, text })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 3500)
  }

  /** Records a log and applies its consequences to progress. */
  const record = (log: Omit<PracticeLog, 'id'>) => {
    const practice = usePracticeStore()
    const { settings } = useSettingsStore()
    const before = [...practice.logs]
    const entry = practice.add(log)
    const result = applyLog(progress.value, entry, before, settings)
    const prevLevel = level.value
    progress.value = result.progress
    push(`+${result.xpGained} XP`)
    if (result.wasPr) push(`New PR: ${entry.bpm} bpm`)
    result.newBadges.forEach((b) => push(`Badge unlocked: ${b}`))
    if (level.value > prevLevel) push(`Level ${level.value}!`)
    return result
  }

  return { progress, level, toNext, toasts, record }
})
