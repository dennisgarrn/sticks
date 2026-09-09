import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '../composables/useStorage'
import type { ISODate, PracticeLog } from '../domain'

export const usePracticeStore = defineStore('practice', () => {
  const logs = useStorage<PracticeLog[]>('drum:logs', [])

  const forDate = (date: ISODate) => logs.value.filter((l) => l.date === date)
  const since = (date: ISODate) => logs.value.filter((l) => l.date >= date)
  const recent = computed(() => [...logs.value].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50))

  const add = (log: Omit<PracticeLog, 'id'>): PracticeLog => {
    const entry: PracticeLog = { ...log, id: crypto.randomUUID() }
    logs.value.push(entry)
    return entry
  }

  return { logs, recent, forDate, since, add }
})
