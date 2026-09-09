<script setup lang="ts">
import { computed } from 'vue'
import { kitTotalMinutes, type Slot } from '../domain'
import { useSettingsStore } from '../stores/settings'

const store = useSettingsStore()
const s = computed(() => store.settings)
const SLOTS: Array<[Slot, string]> = [
  ['warmup', 'Warm-up'],
  ['hands', 'Hands'],
  ['fills', 'Fills'],
  ['independence', 'Independence'],
  ['time', 'Time'],
  ['repertoire', 'Repertoire'],
]
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const total = computed(() => kitTotalMinutes(s.value))

const togglePadDay = (d: number) => {
  const days = s.value.padWeekdays.includes(d) ? s.value.padWeekdays.filter((x) => x !== d) : [...s.value.padWeekdays, d]
  store.update({ padWeekdays: days })
}
</script>

<template>
  <section class="settings">
    <h2>Kit & schedule</h2>

    <div class="row">
      <span class="k">Lead hand</span>
      <div class="seg">
        <button :class="{ on: s.leadHand === 'L' }" @click="store.update({ leadHand: 'L' })">Left</button>
        <button :class="{ on: s.leadHand === 'R' }" @click="store.update({ leadHand: 'R' })">Right</button>
      </div>
    </div>
    <div class="row">
      <span class="k">Toms</span>
      <div class="seg">
        <button :class="{ on: s.toms === 2 }" @click="store.update({ toms: 2 })">2</button>
        <button :class="{ on: s.toms === 3 }" @click="store.update({ toms: 3 })">3</button>
      </div>
    </div>

    <div class="row">
      <span class="k">Kit day</span>
      <div class="seg">
        <button v-for="(d, i) in DAYS" :key="d" :class="{ on: s.kitWeekday === i }" @click="store.update({ kitWeekday: i })">{{ d }}</button>
      </div>
    </div>
    <div class="row">
      <span class="k">Pad days</span>
      <div class="seg">
        <button v-for="(d, i) in DAYS" :key="d" :class="{ on: s.padWeekdays.includes(i) }" :disabled="i === s.kitWeekday" @click="togglePadDay(i)">{{ d }}</button>
      </div>
    </div>
    <div class="row">
      <span class="k">Pad minutes</span>
      <input type="number" min="5" max="60" :value="s.padMinutes" @change="store.update({ padMinutes: Number(($event.target as HTMLInputElement).value) })" />
    </div>

    <h3>Kit session <span class="total">{{ total }} min</span></h3>
    <div v-for="[slot, label] in SLOTS" :key="slot" class="row">
      <span class="k">{{ label }}</span>
      <input
        type="number"
        min="0"
        max="60"
        :value="s.kitSlotMinutes[slot]"
        @change="store.update({ kitSlotMinutes: { ...s.kitSlotMinutes, [slot]: Number(($event.target as HTMLInputElement).value) } })"
      />
    </div>
    <p class="hint">Set a slot to 0 to skip it.</p>
  </section>
</template>

<style scoped>
.settings { max-width: 640px; margin: 0 auto; padding: 1.5rem 1.25rem 6rem; }
h2 { font-family: var(--display); font-size: 2.4rem; margin: 0 0 1rem; color: var(--paper); }
h3 { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-dim); margin: 2rem 0 0.5rem; display: flex; justify-content: space-between; }
.total { color: var(--accent); }
.row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid var(--line); }
.k { color: var(--ink); }
.seg { display: flex; gap: 0.25rem; flex-wrap: wrap; justify-content: flex-end; }
.seg button { background: none; border: 1px solid var(--line); color: var(--ink-dim); font-family: var(--mono); font-size: 0.75rem; padding: 0.4rem 0.6rem; cursor: pointer; }
.seg button.on { border-color: var(--accent); color: var(--paper); background: rgba(255, 90, 31, 0.12); }
.seg button:disabled { opacity: 0.3; cursor: default; }
input[type='number'] { width: 4.5rem; background: none; border: 1px solid var(--line); color: var(--paper); font-family: var(--mono); padding: 0.4rem 0.5rem; text-align: right; }
.hint { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-dim); margin-top: 0.75rem; }
</style>
