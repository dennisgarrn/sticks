import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '../composables/useStorage'
import {
  generateChallenge,
  generateSession,
  generateWeekTheme,
  isChallengeMet,
  toISODate,
  weekStartFor,
  type Challenge,
  type ISODate,
  type PlannedSession,
  type WeekTheme,
} from '../domain'
import { usePracticeStore } from './practice'
import { useProgressStore } from './progress'
import { useSettingsStore } from './settings'

export const usePlanStore = defineStore('plan', () => {
  const settingsStore = useSettingsStore()
  const practice = usePracticeStore()
  const progressStore = useProgressStore()

  const themes = useStorage<WeekTheme[]>('drum:themes', [])
  const challenges = useStorage<Challenge[]>('drum:challenges', [])
  /** date -> which slot indices are done (sessions themselves are regenerated). */
  const doneSlots = useStorage<Record<ISODate, number[]>>('drum:done', {})

  const today = computed(() => toISODate(new Date()))
  const weekStart = computed(() => weekStartFor(today.value, settingsStore.settings))

  const theme = computed<WeekTheme>(() => {
    const existing = themes.value.find((t) => t.weekStart === weekStart.value)
    if (existing) return existing
    const previous = [...themes.value].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]
    const fresh = generateWeekTheme(weekStart.value, progressStore.progress, previous)
    themes.value.push(fresh)
    return fresh
  })

  const challenge = computed<Challenge>(() => {
    const existing = challenges.value.find((c) => c.weekStart === weekStart.value)
    if (existing) return existing
    const fresh = generateChallenge(weekStart.value, theme.value.rudimentId, progressStore.progress, themes.value.length)
    challenges.value.push(fresh)
    return fresh
  })

  const challengeMet = computed(() => isChallengeMet(challenge.value, practice.since(weekStart.value)))

  const session = computed<PlannedSession | null>(() => {
    const s = generateSession(today.value, theme.value, settingsStore.settings, practice.logs, progressStore.progress)
    if (!s) return null
    const done = doneSlots.value[today.value] ?? []
    s.slots.forEach((slot, i) => (slot.done = done.includes(i)))
    return s
  })

  const markDone = (slotIndex: number) => {
    const list = doneSlots.value[today.value] ?? []
    if (!list.includes(slotIndex)) doneSlots.value[today.value] = [...list, slotIndex]
  }

  return { today, weekStart, theme, challenge, challengeMet, session, markDone }
})
