import { defineStore } from 'pinia'
import { useStorage } from '../composables/useStorage'
import { DEFAULT_SETTINGS, type Settings } from '../domain'

export const useSettingsStore = defineStore('settings', () => {
  const settings = useStorage<Settings>('drum:settings', DEFAULT_SETTINGS)
  const update = (patch: Partial<Settings>) => Object.assign(settings.value, patch)
  return { settings, update }
})
