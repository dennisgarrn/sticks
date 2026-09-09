<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMetronome } from '../composables/useMetronome'
import { useTimer } from '../composables/useTimer'
import DrumGrid from '../components/DrumGrid.vue'
import { adaptNotation, adaptStickingLabel, blocksFor, exerciseById, type PlannedSlot, type Quality } from '../domain'
import { useSettingsStore } from '../stores/settings'
import { usePlanStore } from '../stores/plan'
import { usePracticeStore } from '../stores/practice'
import { useProgressStore } from '../stores/progress'

const plan = usePlanStore()
const practice = usePracticeStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const session = computed(() => plan.session)
const activeIndex = ref<number | null>(null)
const active = computed<PlannedSlot | null>(() =>
  activeIndex.value === null ? null : (session.value?.slots[activeIndex.value] ?? null),
)
const activeExercise = computed(() => (active.value ? exerciseById(active.value.exerciseId) : null))
const sheet = computed(() => (activeExercise.value?.notation ? adaptNotation(activeExercise.value.notation, settingsStore.settings, session.value?.type ?? 'kit') : null))
const stickingLabel = computed(() => adaptStickingLabel(activeExercise.value?.sticking, settingsStore.settings))

const timer = useTimer()
const metro = useMetronome()

// Practice blocks for the slot (ladder rungs, fill tempos, or one block).
const blocks = computed(() =>
  active.value ? blocksFor(active.value.exerciseId, active.value.minutes, progressStore.progress, practice.recent) : [],
)
const blockIndex = ref(0)
const resting = ref(false)
const block = computed(() => blocks.value[blockIndex.value])
const multiBlock = computed(() => blocks.value.length > 1)
const usesClick = computed(() => (activeExercise.value?.click ?? 'every') !== 'none')

const SLOT_LABEL: Record<PlannedSlot['slot'], string> = {
  warmup: 'Warm-up',
  hands: 'Hands',
  fills: 'Fills',
  independence: 'Independence',
  time: 'Time',
  repertoire: 'Repertoire',
}

const weekdayName = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date())
const doneCount = computed(() => session.value?.slots.filter((s) => s.done).length ?? 0)
const doneMinutes = computed(() => session.value?.slots.filter((s) => s.done).reduce((a, s) => a + s.minutes, 0) ?? 0)

function open(i: number) {
  activeIndex.value = i
  blockIndex.value = 0
  resting.value = false
  timer.stop()
  metro.stop()
  const ex = exerciseById(session.value!.slots[i].exerciseId)
  metro.mode.value = ex.click ?? 'every'
  metro.beatsPerBar.value = ex.notation?.beats ?? 4
  const first = blocks.value[0]
  if (first?.bpm) metro.setBpm(first.bpm)
  else if (progressStore.progress.tempoPRs[ex.id]) metro.setBpm(progressStore.progress.tempoPRs[ex.id])
}

function close() {
  timer.stop()
  metro.stop()
  activeIndex.value = null
}

function startBlock() {
  const b = block.value
  if (!b) return
  if (b.bpm) metro.setBpm(b.bpm)
  if (usesClick.value) metro.start()
  timer.start(b.minutes * 60, () => {
    metro.stop()
    const isLast = blockIndex.value >= blocks.value.length - 1
    if (isLast) return
    const advance = () => {
      resting.value = false
      blockIndex.value++
      startBlock()
    }
    if (b.restAfter > 0) {
      resting.value = true
      timer.start(b.restAfter, advance)
    } else {
      advance()
    }
  })
}

function jumpTo(i: number) {
  timer.stop()
  metro.stop()
  resting.value = false
  blockIndex.value = i
  if (blocks.value[i]?.bpm) metro.setBpm(blocks.value[i].bpm!)
}

const logBpm = ref<number>(100)
watch(() => metro.bpm.value, (v) => (logBpm.value = v), { immediate: true })

function log(quality: Quality) {
  if (!active.value || !session.value || activeIndex.value === null) return
  const ex = activeExercise.value!
  const tracksTempo = !!ex.ladder || !!ex.contextTempos || !!ex.targetBpm
  progressStore.record({
    exerciseId: active.value.exerciseId,
    date: plan.today,
    sessionType: session.value.type,
    minutes: Math.max(1, Math.round(timer.elapsed.value / 60) || active.value.minutes),
    quality,
    bpm: tracksTempo ? logBpm.value : undefined,
    rung: activeExercise.value!.ladder ? blockIndex.value : undefined,
  })
  plan.markDone(activeIndex.value)
  close()
}

const pr = computed(() => (activeExercise.value ? progressStore.progress.tempoPRs[activeExercise.value.id] : undefined))
</script>

<template>
  <main class="today">
    <header class="masthead">
      <p class="eyebrow">{{ weekdayName }} · <span v-if="session">{{ session.type === 'kit' ? 'Kit day' : 'Pad day' }}</span><span v-else>Rest day</span></p>
      <h1 v-if="session">{{ session.totalMinutes }}<small>min</small></h1>
      <h1 v-else>Rest</h1>
      <div class="theme">
        <span class="tape">This week</span>
        <strong>{{ exerciseById(plan.theme.rudimentId).name }}</strong>
        <span class="plus">+</span>
        <strong>{{ exerciseById(plan.theme.fillId).name }}</strong>
      </div>
    </header>

    <section v-if="session" class="setlist" :class="{ dimmed: active }">
      <ol>
        <li
          v-for="(slot, i) in session.slots"
          :key="i"
          :class="{ done: slot.done, current: i === activeIndex }"
          @click="open(i)"
        >
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="kind">{{ SLOT_LABEL[slot.slot] }}</span>
          <span class="name">{{ exerciseById(slot.exerciseId).name }}</span>
          <span class="mins">{{ slot.minutes }}′</span>
        </li>
      </ol>
      <footer class="tally">
        <span>{{ doneCount }}/{{ session.slots.length }} slots</span>
        <span>{{ doneMinutes }}/{{ session.totalMinutes }} min</span>
        <span class="challenge" :class="{ met: plan.challengeMet }">
          {{ plan.challengeMet ? '✓ ' : '' }}{{ plan.challenge.title }} · {{ plan.challenge.xpReward }} XP
        </span>
      </footer>
    </section>

    <section v-else class="rest">
      <p>No session planned. Sticks down — or open a pad session anyway from the plan.</p>
    </section>

    <transition name="rise">
      <section v-if="active && activeExercise" class="focus">
        <button class="back" @click="close">← setlist</button>
        <p class="eyebrow">{{ SLOT_LABEL[active.slot] }} · {{ active.minutes }} min</p>
        <h2>{{ activeExercise.name }}</h2>
        <p v-if="stickingLabel" class="sticking">{{ stickingLabel }}</p>
        <p class="desc">{{ activeExercise.description }}</p>
        <p v-if="session?.type === 'pad' && activeExercise.slot === 'fills'" class="pad-hint">On the pad: play the sticking only. Picture the drums the notes would land on — that's the point of previewing it here.</p>

        <DrumGrid v-if="sheet" :notation="sheet" :beat="metro.beat.value" :playing="metro.playing.value" class="sheet" />

        <div v-if="multiBlock" class="ladder">
          <button
            v-for="b in blocks"
            :key="b.index"
            class="rung"
            :class="{ active: b.index === blockIndex, pr: b.isPrAttempt }"
            @click="jumpTo(b.index)"
          >{{ b.bpm ?? b.label }}<small>{{ b.minutes }}′</small></button>
          <span v-if="pr" class="pr-note">PR {{ pr }}</span>
        </div>

        <div class="clock" :class="{ resting, silent: !usesClick }">
          <div v-if="usesClick" class="beats">
            <i v-for="b in metro.beatsPerBar.value" :key="b" :class="{ on: metro.playing.value && metro.beat.value === b - 1, muted: metro.mode.value === 'dropout' && metro.bar.value % 2 === 1 }" />
            <span v-if="metro.mode.value !== 'every'" class="mode">{{ metro.mode.value === '2and4' ? 'click on 2 & 4' : 'click every other bar' }}</span>
          </div>
          <div class="time">{{ resting ? 'REST ' : '' }}{{ timer.mmss.value }}</div>
          <p v-if="multiBlock && block" class="block-label">{{ block.label }} · {{ blockIndex + 1 }}/{{ blocks.length }}</p>
          <div v-if="usesClick" class="bpm">
            <button @click="metro.setBpm(metro.bpm.value - 5)">−5</button>
            <output>{{ metro.bpm }}<small>bpm</small></output>
            <button @click="metro.setBpm(metro.bpm.value + 5)">+5</button>
          </div>
          <div class="transport">
            <button v-if="!timer.running.value && timer.remaining.value === 0" class="primary" @click="startBlock">Start</button>
            <button v-else-if="timer.running.value" @click="timer.pause(); metro.stop()">Pause</button>
            <button v-else class="primary" @click="timer.resume(); if (usesClick) metro.start()">Resume</button>
            <button v-if="usesClick" @click="metro.toggle()">{{ metro.playing.value ? 'Click off' : 'Click only' }}</button>
          </div>
        </div>

        <div class="log">
          <p class="eyebrow">How did it feel?</p>
          <div class="quality">
            <button @click="log('sloppy')">Sloppy</button>
            <button @click="log('okay')">Okay</button>
            <button class="clean" @click="log('clean')">Clean</button>
          </div>
        </div>
      </section>
    </transition>
  </main>
</template>

<style scoped>
.today { max-width: 640px; margin: 0 auto; padding: 1.5rem 1.25rem 6rem; position: relative; }

.eyebrow { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-dim); margin: 0 0 0.35rem; }

.masthead h1 { font-family: var(--display); font-size: clamp(5rem, 22vw, 9rem); line-height: 0.85; margin: 0; color: var(--paper); letter-spacing: -0.01em; }
.masthead h1 small { font-size: 0.22em; margin-left: 0.15em; color: var(--accent); font-family: var(--mono); letter-spacing: 0.1em; }

.theme { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; margin-top: 1.25rem; font-size: 0.95rem; }
.theme strong { color: var(--paper); font-weight: 500; }
.theme .plus { color: var(--accent); font-family: var(--display); font-size: 1.4rem; }
.tape { background: var(--tape); color: var(--bg); font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 0.2rem 0.5rem; transform: rotate(-2deg); display: inline-block; }

.setlist { margin-top: 2.5rem; transition: opacity 0.3s; }
.setlist.dimmed { opacity: 0.15; pointer-events: none; }
.setlist ol { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--line); }
.setlist li { display: grid; grid-template-columns: 2.2rem 7rem 1fr auto; align-items: baseline; gap: 0.75rem; padding: 0.95rem 0; border-bottom: 1px solid var(--line); cursor: pointer; transition: transform 0.15s; }
.setlist li:hover { transform: translateX(6px); }
.setlist li:hover .name { color: var(--accent); }
.num { font-family: var(--display); font-size: 1.4rem; color: var(--ink-dim); }
.kind { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-dim); }
.name { font-size: 1.15rem; color: var(--paper); }
.mins { font-family: var(--mono); color: var(--ink-dim); }
.setlist li.done { opacity: 0.4; }
.setlist li.done .name { text-decoration: line-through; text-decoration-color: var(--accent); }

.tally { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-top: 1rem; font-family: var(--mono); font-size: 0.75rem; color: var(--ink-dim); }
.challenge { color: var(--tape); }
.challenge.met { color: var(--accent); }

.rest { margin-top: 3rem; color: var(--ink-dim); }

/* Focus mode */
.focus { position: absolute; inset: 0; top: 0; padding: 1.5rem 1.25rem 4rem; background: linear-gradient(180deg, var(--bg) 0%, var(--bg) 60%, transparent 100%); }
.back { background: none; border: none; color: var(--ink-dim); font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.1em; padding: 0; margin-bottom: 1.5rem; cursor: pointer; }
.focus h2 { font-family: var(--display); font-size: clamp(2.4rem, 9vw, 3.6rem); line-height: 0.95; margin: 0 0 0.5rem; color: var(--paper); }
.sticking { font-family: var(--mono); color: var(--accent); letter-spacing: 0.25em; margin: 0 0 0.75rem; }
.desc { color: var(--ink); margin: 0 0 1rem; max-width: 46ch; line-height: 1.5; }
.pad-hint { font-family: var(--mono); font-size: 0.72rem; color: var(--tape); margin: 0 0 1.25rem; max-width: 52ch; line-height: 1.5; }

.sheet { margin: 0 0 1.25rem; padding: 0.75rem 0.5rem 0.5rem; border: 1px solid var(--line); background: rgba(0,0,0,0.25); }
.ladder { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.rung { font-family: var(--mono); font-size: 0.85rem; padding: 0.35rem 0.6rem; border: 1px solid var(--line); color: var(--ink-dim); background: none; cursor: pointer; }
.rung small { display: block; font-size: 0.6rem; color: var(--ink-dim); margin-top: 0.1rem; }
.block-label { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--tape); margin: 0.25rem 0 0; }
.clock.silent { border-style: dashed; }
.beats .mode { font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.12em; color: var(--ink-dim); margin-left: 0.75rem; align-self: center; }
.beats i.muted { opacity: 0.35; }
.rung.active { border-color: var(--accent); color: var(--paper); background: rgba(255, 90, 31, 0.12); }
.rung.pr { border-style: dashed; }
.pr-note { margin-left: auto; font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.15em; color: var(--tape); }

.clock { border: 1px solid var(--line); padding: 1.5rem 1.25rem; position: relative; overflow: hidden; }
.clock::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 120%, rgba(255, 90, 31, 0.18), transparent 60%); pointer-events: none; }
.clock.resting { border-color: var(--tape); }
.beats { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.beats i { width: 0.75rem; height: 0.75rem; border-radius: 50%; background: var(--line); transition: background 0.05s, transform 0.05s; }
.beats i.on { background: var(--accent); transform: scale(1.4); box-shadow: 0 0 16px var(--accent); }
.time { font-family: var(--display); font-size: clamp(4rem, 18vw, 6.5rem); line-height: 0.9; color: var(--paper); font-variant-numeric: tabular-nums; }
.bpm { display: flex; align-items: center; gap: 1rem; margin: 1rem 0; }
.bpm output { font-family: var(--mono); font-size: 1.6rem; color: var(--paper); min-width: 5ch; text-align: center; }
.bpm output small { font-size: 0.55rem; letter-spacing: 0.15em; margin-left: 0.3rem; color: var(--ink-dim); }
.bpm button, .transport button, .quality button { background: none; border: 1px solid var(--line); color: var(--paper); font-family: var(--mono); font-size: 0.8rem; letter-spacing: 0.08em; padding: 0.6rem 0.9rem; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.bpm button:hover, .transport button:hover, .quality button:hover { border-color: var(--accent); }
.transport { display: flex; gap: 0.5rem; }
.transport .primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 600; }

.log { margin-top: 1.5rem; }
.quality { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.quality button { padding: 0.9rem; }
.quality .clean { border-color: var(--accent); color: var(--accent); }
.quality .clean:hover { background: var(--accent); color: var(--bg); }

.rise-enter-active, .rise-leave-active { transition: opacity 0.25s, transform 0.25s; }
.rise-enter-from, .rise-leave-to { opacity: 0; transform: translateY(16px); }

@media (max-width: 480px) {
  .setlist li { grid-template-columns: 2rem 1fr auto; }
  .kind { grid-column: 2; }
  .name { grid-column: 2; }
  .mins { grid-column: 3; grid-row: 1 / 3; }
}
</style>
