// ---------------------------------------------------------------------------
// Domain types — pure TypeScript, no Vue. Everything here is serialisable.
// ---------------------------------------------------------------------------

export type ISODate = string // "2026-09-08"

export type SessionType = 'pad' | 'kit'

export type Slot =
  | 'warmup'
  | 'hands' // tempo ladder on the pad / rudiment around the kit
  | 'fills'
  | 'independence'
  | 'time'
  | 'repertoire'

export type Difficulty = 1 | 2 | 3 | 4 | 5

/** How the exercise felt when you logged it. */
export type Quality = 'sloppy' | 'okay' | 'clean'

/**
 * One bar of grid notation. Each voice is a string with one char per slot
 * (beats * subdivision). o = hit, O = accent, g = ghost, x = closed hat/ride,
 * X = accented, f = flam, - = rest.
 */
export interface Notation {
  beats?: number // default 4
  subdivision: 1 | 2 | 3 | 4 // slots per beat
  voices: Array<{ name: VoiceName; pattern: string }>
  /** One char per slot: R, L, K or - */
  sticking?: string
  /** Shown under the grid, e.g. "then crash on 1". */
  caption?: string
}

export type VoiceName = 'CR' | 'HH' | 'RD' | 'SN' | 'T1' | 'T2' | 'FT' | 'K' | 'HF' | 'CL' | 'PD'

/** What the metronome does during the exercise. */
export type ClickMode = 'every' | '2and4' | 'dropout' | 'none'

export interface TempoLadder {
  startBpm: number
  stepBpm: number
  rungs: number
  /** Seconds of shake-out between rungs. */
  restSeconds: number
}

export interface Exercise {
  id: string
  name: string
  slot: Slot
  /** Which session types this exercise can be scheduled in. */
  surfaces: SessionType[]
  difficulty: Difficulty
  description: string
  /** Sticking in R/L notation, if it applies. */
  sticking?: string
  /** Target tempo at which the exercise counts as graduated. */
  targetBpm?: number
  ladder?: TempoLadder
  /** Fills only: tempos at which the fill must be logged clean "in context". */
  contextTempos?: number[]
  /** Minimum level required before this exercise enters rotation. */
  minLevel?: number
  notation?: Notation
  /** Defaults to 'every'. */
  click?: ClickMode
}

export interface PracticeLog {
  id: string
  exerciseId: string
  date: ISODate
  sessionType: SessionType
  minutes: number
  quality: Quality
  bpm?: number
  /** Which rung of the ladder was reached, if the exercise has one. */
  rung?: number
}

export type SongStatus = 'candidate' | 'learning' | 'can-play' | 'performance-ready'

export interface Song {
  id: string
  title: string
  artist: string
  bpm?: number
  status: SongStatus
  /** Exercises that feed this song (a fast groove -> singles, a fill -> fill id). */
  linkedExerciseIds: string[]
  notes?: string
}

/** One rudiment + one fill concept per week. */
export interface WeekTheme {
  weekStart: ISODate // always a Wednesday in this app (day after kit day)
  rudimentId: string
  fillId: string
}

export interface PlannedSlot {
  slot: Slot
  exerciseId: string
  minutes: number
  done: boolean
}

export interface PlannedSession {
  date: ISODate
  type: SessionType
  slots: PlannedSlot[]
  totalMinutes: number
}

export interface Settings {
  /** 0 = Sunday … 6 = Saturday. Kit day is Tuesday by default. */
  kitWeekday: number
  /** Minutes per slot of the kit session; total is the sum. */
  kitSlotMinutes: Record<Slot, number>
  padMinutes: number
  /** Hand that leads stickings. Library patterns are written R-lead and mirrored for L. */
  leadHand: 'R' | 'L'
  /** Number of toms on the kit (rack toms + floor). Patterns written for 3 are folded to 2. */
  toms: 2 | 3
  /** Days of the week you intend to do pad work. */
  padWeekdays: number[]
}

export interface Progress {
  xp: number
  /** exerciseId -> best bpm logged as 'clean'. */
  tempoPRs: Record<string, number>
  /** exerciseId -> number of clean logs at target tempo, split by surface. */
  graduation: Record<string, { pad: number; kit: number }>
  badges: string[]
  padStreak: number
  kitStreak: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  weekStart: ISODate
  xpReward: number
  /** Predicate is evaluated by scoring.ts against logs of that week. */
  kind: 'sessions' | 'tempo' | 'coverage' | 'fill-context'
  params: Record<string, number | string>
}

export const DEFAULT_SETTINGS: Settings = {
  kitWeekday: 2, // Tuesday
  kitSlotMinutes: { warmup: 5, hands: 7, fills: 9, independence: 6, time: 5, repertoire: 28 },
  padMinutes: 15,
  leadHand: 'R',
  toms: 3,
  padWeekdays: [1, 3, 4, 5, 6, 0], // every day except Tuesday
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  tempoPRs: {},
  graduation: {},
  badges: [],
  padStreak: 0,
  kitStreak: 0,
}
