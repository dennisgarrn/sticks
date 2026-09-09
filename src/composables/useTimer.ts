import { computed, onUnmounted, ref } from 'vue'

export function useTimer() {
  const remaining = ref(0)
  const running = ref(false)
  const elapsed = ref(0)
  let handle: number | undefined
  let onDone: (() => void) | undefined

  const tick = () => {
    if (remaining.value > 0) {
      remaining.value--
      elapsed.value++
    } else {
      stop()
      onDone?.()
    }
  }

  function start(seconds: number, done?: () => void) {
    stop()
    remaining.value = seconds
    elapsed.value = 0
    onDone = done
    running.value = true
    handle = window.setInterval(tick, 1000)
  }
  function pause() {
    running.value = false
    if (handle) clearInterval(handle)
  }
  function resume() {
    if (running.value || remaining.value === 0) return
    running.value = true
    handle = window.setInterval(tick, 1000)
  }
  function stop() {
    running.value = false
    if (handle) clearInterval(handle)
    handle = undefined
  }

  const mmss = computed(() => {
    const m = Math.floor(remaining.value / 60)
    const s = remaining.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  onUnmounted(stop)
  return { remaining, elapsed, running, mmss, start, pause, resume, stop }
}
