import { FILLS, RUDIMENTS, bySlot, exerciseById } from './library'
import type {
  Exercise,
  ISODate,
  PlannedSession,
  PlannedSlot,
  PracticeLog,
  Progress,
  Settings,
  SessionType,
  WeekTheme,
} from './types'
import { levelFromXp, isGraduated } from './scoring'

// ---------------------------------------------------------------------------
// Date helpers (local time, no library)
// ---------------------------------------------------------------------------
export const toISODate = (d: Date): ISODate => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const parseISODate = (s: ISODate): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const weekdayOf = (date: ISODate) => parseISODate(date).getDay()

/**
 * The practice week starts the day after kit day, so the pad grind leads up
 * to the kit session where the theme is applied.
 */
export const weekStartFor = (date: ISODate, settings: Settings): ISODate => {
  const d = parseISODate(date)
  const startWeekday = (settings.kitWeekday + 1) % 7
  const diff = (d.getDay() - startWeekday + 7) % 7
  d.setDate(d.getDate() - diff)
  return toISODate(d)
}

export const sessionTypeFor = (date: ISODate, settings: Settings): SessionType | null => {
  const wd = weekdayOf(date)
  if (wd === settings.kitWeekday) return 'kit'
  if (settings.padWeekdays.includes(wd)) return 'pad'
  return null
}

// ---------------------------------------------------------------------------
// Week theme: next non-graduated rudiment + fill unlocked at current level.
// ---------------------------------------------------------------------------
const nextActive = (pool: Exercise[], progress: Progress, previousId?: string): Exercise => {
  const level = levelFromXp(progress.xp)
  const eligible = pool.filter((e) => (e.minLevel ?? 1) <= level && !isGraduated(e, progress))
  if (eligible.length === 0) {
    // Everything graduated — cycle for maintenance, avoiding an immediate repeat.
    const maintenance = pool.filter((e) => e.id !== previousId)
    return maintenance[0] ?? pool[0]
  }
  return eligible[0]
}

export const generateWeekTheme = (
  weekStart: ISODate,
  progress: Progress,
  previous?: WeekTheme,
): WeekTheme => ({
  weekStart,
  rudimentId: nextActive(RUDIMENTS, progress, previous?.rudimentId).id,
  fillId: nextActive(FILLS, progress, previous?.fillId).id,
})

// ---------------------------------------------------------------------------
// Rotation helper: pick the least-recently-logged exercise in a slot.
// ---------------------------------------------------------------------------
const leastRecent = (candidates: Exercise[], logs: PracticeLog[], level: number): Exercise => {
  const unlocked = candidates.filter((e) => (e.minLevel ?? 1) <= level)
  const pool = unlocked.length ? unlocked : candidates
  const lastSeen = (id: string) =>
    logs
      .filter((l) => l.exerciseId === id)
      .reduce((max, l) => (l.date > max ? l.date : max), '')
  return [...pool].sort((a, b) => lastSeen(a.id).localeCompare(lastSeen(b.id)))[0]
}

// ---------------------------------------------------------------------------
// Session templates
// ---------------------------------------------------------------------------
const slot = (s: PlannedSlot['slot'], exerciseId: string, minutes: number): PlannedSlot => ({
  slot: s,
  exerciseId,
  minutes,
  done: false,
})

/** Pad: 20% warm-up, 60% ladder, 20% fill preview. Below 12 min the preview is dropped. */
export const generatePadSession = (
  date: ISODate,
  theme: WeekTheme,
  settings: Settings,
  logs: PracticeLog[],
  progress: Progress,
): PlannedSession => {
  const total = settings.padMinutes
  const level = levelFromXp(progress.xp)
  const warmup = leastRecent(bySlot('warmup', 'pad'), logs, level)
  const slots: PlannedSlot[] = []
  const fillOnPad = exerciseById(theme.fillId).surfaces.includes('pad')

  if (total < 12 || !fillOnPad) {
    slots.push(slot('warmup', warmup.id, Math.round(total * 0.25)))
    slots.push(slot('hands', theme.rudimentId, total - slots[0].minutes))
  } else {
    const wu = Math.round(total * 0.2)
    const fill = Math.round(total * 0.2)
    slots.push(slot('warmup', warmup.id, wu))
    slots.push(slot('hands', theme.rudimentId, total - wu - fill))
    slots.push(slot('fills', theme.fillId, fill))
  }
  return { date, type: 'pad', slots, totalMinutes: total }
}

/** Kit: one slot per category, minutes from settings.kitSlotMinutes. */
const KIT_ORDER: PlannedSlot['slot'][] = ['warmup', 'hands', 'fills', 'independence', 'time', 'repertoire']

export const kitTotalMinutes = (settings: Settings) =>
  KIT_ORDER.reduce((sum, s) => sum + (settings.kitSlotMinutes[s] ?? 0), 0)

export const generateKitSession = (
  date: ISODate,
  theme: WeekTheme,
  settings: Settings,
  logs: PracticeLog[],
  progress: Progress,
  hasSongsToLearn = false,
): PlannedSession => {
  const level = levelFromXp(progress.xp)

  const pick = (s: PlannedSlot['slot']): string => {
    switch (s) {
      case 'warmup':
        return leastRecent(bySlot('warmup', 'kit'), logs, level).id
      case 'hands':
        return theme.rudimentId
      case 'fills':
        return theme.fillId
      case 'independence':
      case 'time':
        return leastRecent(bySlot(s, 'kit'), logs, level).id
      case 'repertoire':
        return hasSongsToLearn ? 'rep-learn' : 'rep-playthrough'
    }
  }

  const slots = KIT_ORDER.filter((s) => settings.kitSlotMinutes[s] > 0).map((s) =>
    slot(s, pick(s), settings.kitSlotMinutes[s]),
  )
  return { date, type: 'kit', slots, totalMinutes: kitTotalMinutes(settings) }
}

export const generateSession = (
  date: ISODate,
  theme: WeekTheme,
  settings: Settings,
  logs: PracticeLog[],
  progress: Progress,
  hasSongsToLearn = false,
): PlannedSession | null => {
  const type = sessionTypeFor(date, settings)
  if (type === 'kit') return generateKitSession(date, theme, settings, logs, progress, hasSongsToLearn)
  if (type === 'pad') return generatePadSession(date, theme, settings, logs, progress)
  return null
}

// ---------------------------------------------------------------------------
// Practice blocks — how a slot's minutes are spent.
//  - ladder exercises: rungs climbing to a PR attempt, with rest between
//  - fills: one block per context tempo
//  - everything else: a single block
// ---------------------------------------------------------------------------
export interface PracticeBlock {
  index: number
  bpm?: number
  minutes: number
  label: string
  isPrAttempt: boolean
  /** Rest to take after this block, in seconds. */
  restAfter: number
}

export const blocksFor = (
  exerciseId: string,
  minutes: number,
  progress: Progress,
  recentLogs: PracticeLog[],
): PracticeBlock[] => {
  const ex = exerciseById(exerciseId)

  if (ex.ladder) {
    const { rungs, stepBpm, restSeconds } = ex.ladder
    const pr = progress.tempoPRs[exerciseId]
    let start = pr ? pr - stepBpm * (rungs - 2) : ex.ladder.startBpm
    start = Math.max(start, ex.ladder.startBpm)

    // Fatigue guard: two consecutive sloppy logs at the same tempo -> drop 10.
    const last = recentLogs
      .filter((l) => l.exerciseId === exerciseId && l.bpm !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 2)
    if (last.length === 2 && last.every((l) => l.quality === 'sloppy' && l.bpm === last[0].bpm)) start -= 10

    // Rest time is taken out of the slot so the slot length stays honest.
    const restTotal = (restSeconds * (rungs - 1)) / 60
    const perRung = Math.max(1, Math.floor((minutes - restTotal) / rungs))
    return Array.from({ length: rungs }, (_, i) => ({
      index: i,
      bpm: start + i * stepBpm,
      minutes: perRung,
      label: i === rungs - 1 ? 'PR attempt' : `Rung ${i + 1}`,
      isPrAttempt: i === rungs - 1,
      restAfter: i < rungs - 1 ? restSeconds : 0,
    }))
  }

  if (ex.contextTempos) {
    const per = Math.max(1, Math.floor(minutes / ex.contextTempos.length))
    return ex.contextTempos.map((bpm, i) => ({
      index: i,
      bpm,
      minutes: per,
      label: `In context @ ${bpm}`,
      isPrAttempt: false,
      restAfter: 0,
    }))
  }

  return [{ index: 0, minutes, label: ex.name, isPrAttempt: false, restAfter: 0 }]
}

/** @deprecated use blocksFor */
export const ladderFor = blocksFor
