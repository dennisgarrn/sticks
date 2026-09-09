import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS, EMPTY_PROGRESS, LIBRARY, applyLog, generateKitSession, generatePadSession,
  generateWeekTheme, blocksFor, levelFromXp, sessionTypeFor, weekStartFor, type PracticeLog,
  adaptNotation, mirrorSticking, exerciseById,
} from './index'

describe('library', () => {
  it('has unique ids', () => {
    const ids = LIBRARY.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('calendar', () => {
  it('Tuesday is kit day, Wednesday starts the week', () => {
    expect(sessionTypeFor('2026-09-08', DEFAULT_SETTINGS)).toBe('kit') // Tue
    expect(sessionTypeFor('2026-09-09', DEFAULT_SETTINGS)).toBe('pad') // Wed
    expect(weekStartFor('2026-09-08', DEFAULT_SETTINGS)).toBe('2026-09-02')
    expect(weekStartFor('2026-09-09', DEFAULT_SETTINGS)).toBe('2026-09-09')
  })
})

describe('sessions', () => {
  const theme = generateWeekTheme('2026-09-09', EMPTY_PROGRESS)

  it('first theme is singles + 16ths fill', () => {
    expect(theme.rudimentId).toBe('rud-singles')
    expect(theme.fillId).toBe('fill-16ths-around')
  })

  it('15-min pad session is 3/9/3', () => {
    const s = generatePadSession('2026-09-09', theme, DEFAULT_SETTINGS, [], EMPTY_PROGRESS)
    expect(s.slots.map((x) => x.minutes)).toEqual([3, 9, 3])
  })

  it('10-min pad session drops the fill preview', () => {
    const s = generatePadSession('2026-09-09', theme, { ...DEFAULT_SETTINGS, padMinutes: 10 }, [], EMPTY_PROGRESS)
    expect(s.slots.map((x) => x.slot)).toEqual(['warmup', 'hands'])
    expect(s.totalMinutes).toBe(10)
  })

  it('kit session uses per-slot minutes, 60 total by default', () => {
    const s = generateKitSession('2026-09-08', theme, DEFAULT_SETTINGS, [], EMPTY_PROGRESS)
    expect(s.slots.map((x) => x.minutes)).toEqual([5, 7, 9, 6, 5, 28])
    expect(s.totalMinutes).toBe(60)
  })

  it('a slot set to 0 minutes is skipped', () => {
    const s = generateKitSession('2026-09-08', theme, { ...DEFAULT_SETTINGS, kitSlotMinutes: { ...DEFAULT_SETTINGS.kitSlotMinutes, time: 0 } }, [], EMPTY_PROGRESS)
    expect(s.slots.map((x) => x.slot)).not.toContain('time')
    expect(s.totalMinutes).toBe(55)
  })
})

describe('ladder', () => {
  it('starts at the exercise base with no PR', () => {
    const rungs = blocksFor('rud-singles', 9, EMPTY_PROGRESS, [])
    expect(rungs.map((r) => r.bpm)).toEqual([130, 135, 140, 145])
    expect(rungs.at(-1)?.isPrAttempt).toBe(true)
    expect(rungs[0].restAfter).toBe(30)
    expect(rungs.at(-1)?.restAfter).toBe(0)
  })
  it('fills get one block per context tempo', () => {
    const b = blocksFor('fill-16ths-around', 9, EMPTY_PROGRESS, [])
    expect(b.map((x) => x.bpm)).toEqual([90, 110, 130])
    expect(b.map((x) => x.minutes)).toEqual([3, 3, 3])
  })
  it('notation patterns match their grid length', () => {
    for (const ex of LIBRARY) {
      if (!ex.notation) continue
      const len = (ex.notation.beats ?? 4) * ex.notation.subdivision
      for (const v of ex.notation.voices) expect(v.pattern.length, `${ex.id}/${v.name}`).toBe(len)
      if (ex.notation.sticking) expect(ex.notation.sticking.length, `${ex.id}/sticking`).toBe(len)
    }
  })
  it('ends one step above the PR', () => {
    const rungs = blocksFor('rud-singles', 9, { ...EMPTY_PROGRESS, tempoPRs: { 'rud-singles': 150 } }, [])
    expect(rungs.map((r) => r.bpm)).toEqual([140, 145, 150, 155])
  })
  it('fatigue guard drops 10 bpm after two sloppy logs at the same tempo', () => {
    const logs: PracticeLog[] = [
      { id: '1', exerciseId: 'rud-singles', date: '2026-09-09', sessionType: 'pad', minutes: 9, quality: 'sloppy', bpm: 150 },
      { id: '2', exerciseId: 'rud-singles', date: '2026-09-10', sessionType: 'pad', minutes: 9, quality: 'sloppy', bpm: 150 },
    ]
    const rungs = blocksFor('rud-singles', 9, { ...EMPTY_PROGRESS, tempoPRs: { 'rud-singles': 150 } }, logs)
    expect(rungs[0].bpm).toBe(130)
  })
})

describe('scoring', () => {
  it('awards xp, tracks PRs and graduation', () => {
    const base: PracticeLog = { id: 'a', exerciseId: 'rud-singles', date: '2026-09-09', sessionType: 'pad', minutes: 9, quality: 'clean', bpm: 150 }
    let r = applyLog(EMPTY_PROGRESS, base, [], DEFAULT_SETTINGS)
    expect(r.xpGained).toBe(18)
    expect(r.wasPr).toBe(false) // baseline
    r = applyLog(r.progress, { ...base, id: 'b', date: '2026-09-10', bpm: 170 }, [base], DEFAULT_SETTINGS)
    expect(r.wasPr).toBe(true)
    expect(r.xpGained).toBe(68)
    expect(r.progress.graduation['rud-singles']).toEqual({ pad: 1, kit: 0 })
    expect(r.progress.badges).toContain('singles-160')
    expect(r.progress.padStreak).toBe(2)
    expect(levelFromXp(r.progress.xp)).toBe(1)
  })
})

describe('kit adaptation', () => {
  it('mirrors sticking for left lead', () => {
    expect(mirrorSticking('RLRRLRLL')).toBe('LRLLRLRR')
    expect(mirrorSticking('lR R L')).toBe('rL L R')
  })
  it('folds tom 2 into the floor tom on a two-tom kit', () => {
    const n = adaptNotation(exerciseById('fill-16ths-around').notation!, { ...DEFAULT_SETTINGS, toms: 2, leadHand: 'L' })
    expect(n.voices.map((v) => v.name)).toEqual(['SN', 'T1', 'FT'])
    expect(n.voices.find((v) => v.name === 'FT')!.pattern).toBe('--------oooooooo')
    expect(n.sticking).toBe('LRLRLRLRLRLRLRLR')
  })
})

describe('pad days', () => {
  it('pad sessions only contain pad-capable exercises', () => {
    const theme = { weekStart: '2026-09-09', rudimentId: 'rud-singles', fillId: 'fill-offbeat-crash' } // kit-only fill
    const s = generatePadSession('2026-09-09', theme, DEFAULT_SETTINGS, [], EMPTY_PROGRESS)
    for (const slot of s.slots) expect(exerciseById(slot.exerciseId).surfaces).toContain('pad')
    expect(s.slots.map((x) => x.slot)).toEqual(['warmup', 'hands'])
    expect(s.totalMinutes).toBe(15)
  })
  it('pad notation collapses to a single Pad row', () => {
    const n = adaptNotation(exerciseById('fill-16ths-around').notation!, DEFAULT_SETTINGS, 'pad')
    expect(n.voices).toEqual([{ name: 'PD', pattern: 'oooooooooooooooo' }])
    const lin = adaptNotation(exerciseById('fill-linear-16ths').notation!, DEFAULT_SETTINGS, 'pad')
    expect(lin.voices[0].pattern).toBe('oo-oo-oo-oo-oo-o') // kick slots become rests
  })
})
