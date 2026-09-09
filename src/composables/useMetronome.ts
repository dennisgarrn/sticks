import { onUnmounted, ref } from 'vue'
import type { ClickMode } from '../domain'

/**
 * Web Audio metronome using the lookahead scheduling pattern — beats are
 * scheduled ahead on the audio clock, so JS timer jitter never reaches your ears.
 *
 * `mode` controls which beats are audible:
 *   every   — all beats, accented downbeat
 *   2and4   — only beats 2 and 4 (the click "sits on the snare")
 *   dropout — bar 1 audible, bar 2 silent, alternating
 *   none    — timer only; the UI hides the click entirely
 * The visual beat pulse always runs so you can see silent beats.
 */
export function useMetronome(initialBpm = 100) {
  const bpm = ref(initialBpm)
  const playing = ref(false)
  const beat = ref(0)
  const bar = ref(0)
  const beatsPerBar = ref(4)
  const mode = ref<ClickMode>('every')

  let ctx: AudioContext | null = null
  let nextNoteTime = 0
  let current = 0
  let currentBar = 0
  let timer: number | undefined
  const LOOKAHEAD_MS = 25
  const SCHEDULE_AHEAD_S = 0.1

  const audible = (b: number, barIdx: number) => {
    switch (mode.value) {
      case 'every': return true
      case '2and4': return b % 2 === 1
      case 'dropout': return barIdx % 2 === 0
      case 'none': return false
    }
  }

  const click = (time: number, accent: boolean) => {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1400 : 900
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.05)
  }

  const scheduler = () => {
    if (!ctx) return
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      if (audible(current, currentBar)) click(nextNoteTime, current === 0 && mode.value === 'every')
      const b = current
      const bi = currentBar
      const delay = Math.max(0, (nextNoteTime - ctx.currentTime) * 1000)
      window.setTimeout(() => {
        beat.value = b
        bar.value = bi
      }, delay)
      nextNoteTime += 60 / bpm.value
      current = (current + 1) % beatsPerBar.value
      if (current === 0) currentBar++
    }
  }

  function start() {
    if (playing.value) return
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    current = 0
    currentBar = 0
    nextNoteTime = ctx.currentTime + 0.05
    playing.value = true
    timer = window.setInterval(scheduler, LOOKAHEAD_MS)
  }
  function stop() {
    playing.value = false
    if (timer) clearInterval(timer)
    timer = undefined
  }
  function toggle() {
    playing.value ? stop() : start()
  }
  function setBpm(v: number) {
    bpm.value = Math.min(300, Math.max(30, Math.round(v)))
  }

  onUnmounted(() => {
    stop()
    ctx?.close()
  })
  return { bpm, playing, beat, bar, beatsPerBar, mode, start, stop, toggle, setBpm }
}
