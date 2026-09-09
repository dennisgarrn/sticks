import { exerciseById } from './library'
import type { Challenge, Exercise, ISODate, PracticeLog, Progress, Quality, Settings } from './types'

// ---------------------------------------------------------------------------
// XP & levels
// ---------------------------------------------------------------------------
const QUALITY_MULTIPLIER: Record<Quality, number> = { sloppy: 1, okay: 1.5, clean: 2 }
export const PR_BONUS_XP = 50

/** Level n requires 200·n² total XP. */
export const xpForLevel = (level: number) => 200 * level * level
export const levelFromXp = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 200)))
export const xpToNextLevel = (xp: number) => xpForLevel(levelFromXp(xp) + 1) - xp

export const xpForLog = (log: PracticeLog, wasPr: boolean) =>
  Math.round(log.minutes * QUALITY_MULTIPLIER[log.quality]) + (wasPr ? PR_BONUS_XP : 0)

// ---------------------------------------------------------------------------
// Graduation: clean at target twice on the pad AND once on the kit.
// Fills graduate when logged clean in context at every context tempo.
// ---------------------------------------------------------------------------
export const isGraduated = (ex: Exercise, progress: Progress): boolean => {
  if (ex.slot === 'hands') {
    const g = progress.graduation[ex.id]
    return !!g && g.pad >= 2 && g.kit >= 1
  }
  if (ex.slot === 'fills' && ex.contextTempos) {
    const pr = progress.tempoPRs[ex.id] ?? 0
    const g = progress.graduation[ex.id]
    return pr >= Math.max(...ex.contextTempos) && !!g && g.kit >= ex.contextTempos.length
  }
  return false
}

// ---------------------------------------------------------------------------
// Applying a log to progress (pure — returns a new Progress)
// ---------------------------------------------------------------------------
export interface ApplyResult {
  progress: Progress
  xpGained: number
  wasPr: boolean
  newBadges: string[]
}

export const applyLog = (
  progress: Progress,
  log: PracticeLog,
  allLogs: PracticeLog[],
  settings: Settings,
): ApplyResult => {
  const ex = exerciseById(log.exerciseId)
  const next: Progress = {
    ...progress,
    tempoPRs: { ...progress.tempoPRs },
    graduation: { ...progress.graduation },
    badges: [...progress.badges],
  }

  let wasPr = false
  if (log.quality === 'clean' && log.bpm !== undefined) {
    const prev = next.tempoPRs[ex.id] ?? 0
    if (log.bpm > prev) {
      next.tempoPRs[ex.id] = log.bpm
      wasPr = prev > 0 // first ever bpm isn't a "PR", just a baseline
    }
    const target = ex.targetBpm ?? (ex.contextTempos ? Math.min(...ex.contextTempos) : undefined)
    if (target !== undefined && log.bpm >= target) {
      const g = next.graduation[ex.id] ?? { pad: 0, kit: 0 }
      next.graduation[ex.id] = { ...g, [log.sessionType]: g[log.sessionType] + 1 }
    }
  }

  const xpGained = xpForLog(log, wasPr)
  next.xp += xpGained

  const logsIncl = [...allLogs, log]
  next.padStreak = streak(logsIncl, 'pad', settings, log.date)
  next.kitStreak = streak(logsIncl, 'kit', settings, log.date)

  const newBadges = evaluateBadges(next, logsIncl).filter((b) => !next.badges.includes(b))
  next.badges.push(...newBadges)

  return { progress: next, xpGained, wasPr, newBadges }
}

// ---------------------------------------------------------------------------
// Streaks — counted per surface against your own intended days, so a missed
// pad day never breaks the Tuesday streak and vice versa.
// ---------------------------------------------------------------------------
const addDays = (date: ISODate, n: number): ISODate => {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
const weekday = (date: ISODate) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export const streak = (
  logs: PracticeLog[],
  type: 'pad' | 'kit',
  settings: Settings,
  asOf: ISODate,
): number => {
  const intended = type === 'kit' ? [settings.kitWeekday] : settings.padWeekdays
  const practised = new Set(logs.filter((l) => l.sessionType === type).map((l) => l.date))
  let count = 0
  let cursor = asOf
  // Walk back day by day; only intended days can break the streak.
  for (let i = 0; i < 400; i++) {
    if (intended.includes(weekday(cursor))) {
      if (practised.has(cursor)) count++
      else if (cursor !== asOf) break // today not yet done doesn't break it
      else if (i > 0) break
    }
    cursor = addDays(cursor, -1)
  }
  return count
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
export interface BadgeDef {
  id: string
  name: string
  description: string
  test: (p: Progress, logs: PracticeLog[]) => boolean
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-log',
    name: 'Count-in',
    description: 'Logged your first exercise.',
    test: (_, logs) => logs.length >= 1,
  },
  {
    id: 'singles-160',
    name: 'Buzzsaw',
    description: 'Single strokes clean at 160 bpm.',
    test: (p) => (p.tempoPRs['rud-singles'] ?? 0) >= 160,
  },
  {
    id: 'doubles-130',
    name: 'Double trouble',
    description: 'Double strokes clean at 130 bpm.',
    test: (p) => (p.tempoPRs['rud-doubles'] ?? 0) >= 130,
  },
  {
    id: 'pad-streak-7',
    name: 'Pad week',
    description: '7 pad days in a row.',
    test: (p) => p.padStreak >= 7,
  },
  {
    id: 'kit-streak-4',
    name: 'Tuesday regular',
    description: '4 kit sessions in a row.',
    test: (p) => p.kitStreak >= 4,
  },
  {
    id: 'first-graduation',
    name: 'Graduated',
    description: 'Graduated your first rudiment.',
    test: (p) => Object.values(p.graduation).some((g) => g.pad >= 2 && g.kit >= 1),
  },
  {
    id: 'ghost-whisperer',
    name: 'Ghost whisperer',
    description: 'Ghost-note groove logged clean 3 times.',
    test: (_, logs) =>
      logs.filter((l) => l.exerciseId === 'time-ghost-groove' && l.quality === 'clean').length >= 3,
  },
  {
    id: 'six-fills',
    name: 'Vocabulary',
    description: 'Six different fills logged clean in context.',
    test: (_, logs) =>
      new Set(
        logs.filter((l) => l.sessionType === 'kit' && l.quality === 'clean' && l.exerciseId.startsWith('fill-')).map((l) => l.exerciseId),
      ).size >= 6,
  },
]

export const evaluateBadges = (p: Progress, logs: PracticeLog[]): string[] =>
  BADGES.filter((b) => b.test(p, logs)).map((b) => b.id)

// ---------------------------------------------------------------------------
// Weekly challenges
// ---------------------------------------------------------------------------
export const generateChallenge = (
  weekStart: ISODate,
  rudimentId: string,
  progress: Progress,
  weekIndex: number,
): Challenge => {
  const pr = progress.tempoPRs[rudimentId]
  const rud = exerciseById(rudimentId)
  const kinds: Challenge[] = [
    {
      id: `ch-${weekStart}-tempo`,
      title: `${rud.name} +10 bpm`,
      description: `Log ${rud.name} clean at ${(pr ?? rud.ladder?.startBpm ?? 100) + 10} bpm before next kit day.`,
      weekStart,
      xpReward: 150,
      kind: 'tempo',
      params: { exerciseId: rudimentId, bpm: (pr ?? rud.ladder?.startBpm ?? 100) + 10 },
    },
    {
      id: `ch-${weekStart}-sessions`,
      title: 'Five pad days',
      description: 'Log at least 5 pad sessions this week.',
      weekStart,
      xpReward: 100,
      kind: 'sessions',
      params: { sessionType: 'pad', count: 5 },
    },
    {
      id: `ch-${weekStart}-coverage`,
      title: 'Full kit',
      description: 'Complete every slot of the kit session.',
      weekStart,
      xpReward: 100,
      kind: 'coverage',
      params: { slots: 6 },
    },
  ]
  return kinds[weekIndex % kinds.length]
}

export const isChallengeMet = (c: Challenge, weekLogs: PracticeLog[]): boolean => {
  switch (c.kind) {
    case 'tempo':
      return weekLogs.some(
        (l) => l.exerciseId === c.params.exerciseId && l.quality === 'clean' && (l.bpm ?? 0) >= Number(c.params.bpm),
      )
    case 'sessions':
      return new Set(weekLogs.filter((l) => l.sessionType === c.params.sessionType).map((l) => l.date)).size >= Number(c.params.count)
    case 'coverage': {
      const kitDays = new Set(weekLogs.filter((l) => l.sessionType === 'kit').map((l) => l.date))
      return [...kitDays].some(
        (d) => new Set(weekLogs.filter((l) => l.date === d).map((l) => exerciseById(l.exerciseId).slot)).size >= Number(c.params.slots),
      )
    }
    case 'fill-context':
      return weekLogs.some((l) => l.exerciseId === c.params.exerciseId && l.quality === 'clean' && (l.bpm ?? 0) >= Number(c.params.bpm))
  }
}
