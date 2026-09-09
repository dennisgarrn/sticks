import type { Notation, SessionType, Settings, VoiceName } from './types'

/** Swap R/L (and r/l grace notes) in a sticking string. */
export const mirrorSticking = (s: string): string =>
  s.replace(/[RLrl]/g, (c) => ({ R: 'L', L: 'R', r: 'l', l: 'r' })[c] as string)

/**
 * Adapts library notation to the player's kit:
 *  - lead hand L: mirror the sticking row
 *  - two toms: fold T2 into FT (patterns merge; a hit in either becomes a floor hit)
 */
const HAND_VOICES: VoiceName[] = ['CR', 'HH', 'RD', 'SN', 'T1', 'T2', 'FT']

const mergePatterns = (a: string, b: string) =>
  a.split('').map((c, i) => (c !== '-' ? c : b[i])).join('')

export const adaptNotation = (n: Notation, settings: Settings, surface: SessionType = 'kit'): Notation => {
  let voices = n.voices

  // Pad: one surface. Fold every hand voice into a single Pad row, drop feet and click.
  if (surface === 'pad') {
    const len = (n.beats ?? 4) * n.subdivision
    const pad = voices
      .filter((v) => HAND_VOICES.includes(v.name))
      .reduce((acc, v) => mergePatterns(acc, v.pattern), '-'.repeat(len))
    const sticking = n.sticking && settings.leadHand === 'L' ? mirrorSticking(n.sticking) : n.sticking
    return { ...n, voices: [{ name: 'PD', pattern: pad }], sticking }
  }

  if (settings.toms === 2 && voices.some((v) => v.name === 'T2')) {
    const t2 = voices.find((v) => v.name === 'T2')!
    const ft = voices.find((v) => v.name === 'FT')
    const merged = ft
      ? ft.pattern.split('').map((c, i) => (c !== '-' ? c : t2.pattern[i])).join('')
      : t2.pattern
    voices = voices.filter((v) => v.name !== 'T2' && v.name !== 'FT').concat({ name: 'FT', pattern: merged })
  }
  const sticking = n.sticking && settings.leadHand === 'L' ? mirrorSticking(n.sticking) : n.sticking
  return { ...n, voices, sticking }
}

/** Adapts the short sticking label ("RLRR LRLL") shown under the exercise title. */
export const adaptStickingLabel = (s: string | undefined, settings: Settings) =>
  s && settings.leadHand === 'L' ? mirrorSticking(s) : s
