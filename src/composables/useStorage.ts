import { ref, watch, type Ref } from 'vue'

/** A ref persisted to localStorage. Deep-watched, JSON serialised. */
export function useStorage<T>(key: string, fallback: T): Ref<T> {
  const raw = localStorage.getItem(key)
  const parsed = raw ? (JSON.parse(raw) as T) : undefined
  // Shallow-merge objects so newly added settings keys pick up their defaults.
  const initial =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? ({ ...fallback, ...parsed } as T) : (parsed ?? fallback)
  const state = ref(initial) as Ref<T>
  watch(state, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true })
  return state
}
