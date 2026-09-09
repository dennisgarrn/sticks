<script setup lang="ts">
import { computed } from 'vue'
import type { Notation, VoiceName } from '../domain'

const props = defineProps<{
  notation: Notation
  /** Current beat (0-based) to highlight while the metronome runs. */
  beat?: number
  playing?: boolean
}>()

const LABEL: Record<VoiceName, string> = {
  CR: 'Crash',
  HH: 'Hi-hat',
  RD: 'Ride',
  SN: 'Snare',
  T1: 'Tom 1',
  T2: 'Tom 2',
  FT: 'Floor',
  K: 'Kick',
  HF: 'HH foot',
  CL: 'Click',
  PD: 'Pad',
}
const ORDER: VoiceName[] = ['PD', 'CR', 'HH', 'RD', 'SN', 'T1', 'T2', 'FT', 'K', 'HF', 'CL']

const beats = computed(() => props.notation.beats ?? 4)
const sub = computed(() => props.notation.subdivision)
const cols = computed(() => beats.value * sub.value)
const voices = computed(() => [...props.notation.voices].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)))

const counts = computed(() => {
  const out: string[] = []
  for (let b = 0; b < beats.value; b++) {
    for (let s = 0; s < sub.value; s++) {
      if (s === 0) out.push(String(b + 1))
      else if (sub.value === 2) out.push('&')
      else if (sub.value === 3) out.push(s === 1 ? '&' : 'a')
      else out.push(['e', '&', 'a'][s - 1])
    }
  }
  return out
})

// Geometry
const LABEL_W = 52
const CELL = 30
const ROW = 26
const TOP = 10
const width = computed(() => LABEL_W + cols.value * CELL + 8)
const hasSticking = computed(() => !!props.notation.sticking)
const height = computed(() => TOP + voices.value.length * ROW + 22 + (hasSticking.value ? 18 : 0))
const cx = (i: number) => LABEL_W + i * CELL + CELL / 2
const cy = (r: number) => TOP + r * ROW + ROW / 2
const countsY = computed(() => TOP + voices.value.length * ROW + 14)
const stickY = computed(() => countsY.value + 17)
</script>

<template>
  <svg class="grid" :viewBox="`0 0 ${width} ${height}`" :style="{ maxWidth: width + 'px' }" role="img" aria-label="One bar of notation">
    <!-- beat highlight -->
    <rect
      v-if="playing && beat !== undefined"
      :x="LABEL_W + beat * sub * CELL"
      :y="TOP - 4"
      :width="sub * CELL"
      :height="voices.length * ROW + 8"
      class="beat-hl"
    />
    <!-- beat separators -->
    <line
      v-for="b in beats + 1"
      :key="'b' + b"
      :x1="LABEL_W + (b - 1) * sub * CELL"
      :x2="LABEL_W + (b - 1) * sub * CELL"
      :y1="TOP - 4"
      :y2="TOP + voices.length * ROW + 4"
      :class="['beatline', { bar: b === 1 || b === beats + 1 }]"
    />
    <!-- rows -->
    <g v-for="(v, r) in voices" :key="v.name">
      <line :x1="LABEL_W" :x2="LABEL_W + cols * CELL" :y1="cy(r)" :y2="cy(r)" class="rowline" />
      <text :x="LABEL_W - 8" :y="cy(r) + 4" class="label" text-anchor="end">{{ LABEL[v.name] }}</text>
      <template v-for="(ch, i) in v.pattern.split('')" :key="i">
        <!-- accent -->
        <text v-if="ch === 'O' || ch === 'X'" :x="cx(i)" :y="cy(r) - 9" class="accent" text-anchor="middle">></text>
        <!-- flam grace note -->
        <circle v-if="ch === 'f'" :cx="cx(i) - 8" :cy="cy(r) - 5" r="2.5" class="grace" />
        <!-- hits -->
        <circle v-if="ch === 'o' || ch === 'O' || ch === 'f'" :cx="cx(i)" :cy="cy(r)" r="5" class="hit" />
        <circle v-else-if="ch === 'g'" :cx="cx(i)" :cy="cy(r)" r="4" class="ghost" />
        <g v-else-if="ch === 'x' || ch === 'X'" class="cross">
          <line :x1="cx(i) - 4" :x2="cx(i) + 4" :y1="cy(r) - 4" :y2="cy(r) + 4" />
          <line :x1="cx(i) - 4" :x2="cx(i) + 4" :y1="cy(r) + 4" :y2="cy(r) - 4" />
        </g>
      </template>
    </g>
    <!-- counts -->
    <text v-for="(c, i) in counts" :key="'c' + i" :x="cx(i)" :y="countsY" :class="['count', { strong: i % sub === 0 }]" text-anchor="middle">{{ c }}</text>
    <!-- sticking -->
    <template v-if="notation.sticking">
      <text v-for="(s, i) in notation.sticking.split('')" :key="'s' + i" :x="cx(i)" :y="stickY" class="stick" text-anchor="middle">{{ s === '-' ? '' : s }}</text>
    </template>
  </svg>
  <p v-if="notation.caption" class="caption">{{ notation.caption }}</p>
</template>

<style scoped>
.grid { width: 100%; height: auto; display: block; font-family: var(--mono); }
.beat-hl { fill: var(--accent); opacity: 0.12; }
.beatline { stroke: var(--line); stroke-width: 1; }
.beatline.bar { stroke: var(--ink-dim); stroke-width: 2; }
.rowline { stroke: var(--line); stroke-width: 1; }
.label { fill: var(--ink-dim); font-size: 10px; letter-spacing: 0.05em; }
.hit { fill: var(--paper); }
.ghost { fill: none; stroke: var(--ink); stroke-width: 1.2; }
.grace { fill: var(--accent); }
.cross line { stroke: var(--paper); stroke-width: 1.8; stroke-linecap: round; }
.accent { fill: var(--accent); font-size: 12px; font-weight: 700; }
.count { fill: var(--ink-dim); font-size: 10px; }
.count.strong { fill: var(--paper); font-weight: 500; font-size: 11px; }
.stick { fill: var(--tape); font-size: 10px; font-weight: 500; }
.caption { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-dim); margin: 0.35rem 0 0; letter-spacing: 0.04em; }
</style>
