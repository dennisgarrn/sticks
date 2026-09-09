import type { Exercise, Notation, TempoLadder } from './types'

const ladder = (startBpm: number, rungs = 4, stepBpm = 5, restSeconds = 30): TempoLadder => ({
  startBpm,
  stepBpm,
  rungs,
  restSeconds,
})

// Notation helpers ---------------------------------------------------------
const n16 = (voices: Notation['voices'], sticking?: string, caption?: string): Notation => ({ subdivision: 4, voices, sticking, caption })
const n8 = (voices: Notation['voices'], sticking?: string, caption?: string): Notation => ({ subdivision: 2, voices, sticking, caption })
const n12 = (voices: Notation['voices'], sticking?: string, caption?: string): Notation => ({ subdivision: 3, voices, sticking, caption })

const BACKBEAT_8: Notation['voices'] = [
  { name: 'HH', pattern: 'xxxxxxxx' },
  { name: 'SN', pattern: '--o---o-' },
  { name: 'K', pattern: 'o---o---' },
]

// ---------------------------------------------------------------------------
// Warm-ups (pad + kit)
// ---------------------------------------------------------------------------
export const WARMUPS: Exercise[] = [
  {
    id: 'wu-singles-easy',
    name: 'Easy singles',
    slot: 'warmup',
    surfaces: ['pad', 'kit'],
    difficulty: 1,
    sticking: 'RLRL',
    description: 'Single strokes at a tempo where every note is relaxed. Watch the rebound.',
    notation: n8([{ name: 'SN', pattern: 'oooooooo' }], 'RLRLRLRL'),
  },
  {
    id: 'wu-doubles-easy',
    name: 'Easy doubles',
    slot: 'warmup',
    surfaces: ['pad', 'kit'],
    difficulty: 1,
    sticking: 'RRLL',
    description: 'Double strokes, both notes of each pair at equal volume.',
    notation: n8([{ name: 'SN', pattern: 'oooooooo' }], 'RRLLRRLL'),
  },
  {
    id: 'wu-8-on-a-hand',
    name: '8 on a hand',
    slot: 'warmup',
    surfaces: ['pad', 'kit'],
    difficulty: 1,
    sticking: 'RRRRRRRR LLLLLLLL',
    description: 'Eight strokes per hand, focusing on fulcrum and wrist motion.',
    notation: n16([{ name: 'SN', pattern: 'oooooooooooooooo' }], 'RRRRRRRRLLLLLLLL'),
  },
]

// ---------------------------------------------------------------------------
// Hand technique — the weekly rudiment. Pad ladders, kit application.
// ---------------------------------------------------------------------------
export const RUDIMENTS: Exercise[] = [
  {
    id: 'rud-singles',
    name: 'Single stroke roll',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RLRL',
    targetBpm: 170,
    ladder: ladder(130),
    description: '16th notes, evenly spaced, both hands the same volume. On the kit: one beat per drum, snare → tom 1 → tom 2 → floor.',
    notation: n16([{ name: 'SN', pattern: 'oooooooooooooooo' }], 'RLRLRLRLRLRLRLRL'),
  },
  {
    id: 'rud-doubles',
    name: 'Double stroke roll',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RRLL',
    targetBpm: 140,
    ladder: ladder(100),
    description: '16th notes. The second stroke of each pair should be as loud as the first — let the fingers close the second one.',
    notation: n16([{ name: 'SN', pattern: 'oooooooooooooooo' }], 'RRLLRRLLRRLLRRLL'),
  },
  {
    id: 'rud-paradiddle',
    name: 'Paradiddle',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RLRR LRLL',
    targetBpm: 130,
    ladder: ladder(95),
    description: 'Accent the first note of each group. On the kit: accented note on a tom, the rest on the snare.',
    notation: n16([{ name: 'SN', pattern: 'OoooOoooOoooOooo' }], 'RLRRLRLLRLRRLRLL'),
  },
  {
    id: 'rud-paradiddle-displaced',
    name: 'Paradiddle with displaced accents',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 3,
    sticking: 'RLRR LRLL',
    targetBpm: 120,
    ladder: ladder(85),
    minLevel: 2,
    description: 'Same sticking, move the accent one note later every bar. Bar 1 accents note 1, bar 2 note 2, and so on. Four bars = one cycle.',
    notation: n16([{ name: 'SN', pattern: 'oOoooOoooOoooOoo' }], 'RLRRLRLLRLRRLRLL', 'shown: bar 2, accent on note 2'),
  },
  {
    id: 'rud-flam-tap',
    name: 'Flam tap',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 3,
    sticking: 'lR R rL L',
    targetBpm: 110,
    ladder: ladder(80),
    description: 'Flam, then a tap with the same hand. Keep the grace note low and close. On the kit: flams on floor tom, taps on snare.',
    notation: n8([{ name: 'SN', pattern: 'fofofofo' }], 'RRLLRRLL', 'f = flam (grace note from the other hand)'),
  },
  {
    id: 'rud-six-stroke',
    name: 'Six-stroke roll',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 3,
    sticking: 'R LL RR L',
    targetBpm: 100,
    ladder: ladder(70),
    minLevel: 2,
    description: 'Two per bar as triplets. Accent the single strokes at each end — lead hand starts. Becomes a tom fill later in the week.',
    notation: n12([{ name: 'SN', pattern: 'OooooOOooooO' }], 'RLLRRLRLLRRL'),
  },
  {
    id: 'rud-swiss-triplet',
    name: 'Swiss army triplet',
    slot: 'hands',
    surfaces: ['pad', 'kit'],
    difficulty: 4,
    sticking: 'lR R L',
    targetBpm: 120,
    ladder: ladder(85),
    minLevel: 3,
    description: 'Flam, the same hand again, then the other hand. Great for triplet fills around the kit.',
    notation: n12([{ name: 'SN', pattern: 'foofoofoofoo' }], 'RRLRRLRRLRRL'),
  },
]

// ---------------------------------------------------------------------------
// Fills — previewed on the pad, played in context on the kit.
// Context = 3 bars groove + 1 bar fill, looped, at each context tempo.
// ---------------------------------------------------------------------------
export const FILLS: Exercise[] = [
  {
    id: 'fill-16ths-around',
    name: '16ths around the kit',
    slot: 'fills',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RLRL per drum',
    contextTempos: [90, 110, 130],
    description: 'One beat of 16ths on each drum, moving down the kit. Land a crash on the 1 of the next bar.',
    notation: n16(
      [
        { name: 'SN', pattern: 'oooo------------' },
        { name: 'T1', pattern: '----oooo--------' },
        { name: 'T2', pattern: '--------oooo----' },
        { name: 'FT', pattern: '------------oooo' },
      ],
      'RLRLRLRLRLRLRLRL',
      'then crash + kick on 1',
    ),
  },
  {
    id: 'fill-paradiddle-toms',
    name: 'Paradiddle fill',
    slot: 'fills',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RLRR LRLL',
    contextTempos: [90, 110, 130],
    description: 'Lead hand on the toms, other hand stays on the snare. The sticking does the orchestration for you.',
    notation: n16(
      [
        { name: 'T1', pattern: 'o-oo-o--o-oo-o--' },
        { name: 'SN', pattern: '-o--o-oo-o--o-oo' },
      ],
      'RLRRLRLLRLRRLRLL',
      'second half: move the lead hand to the next tom',
    ),
  },
  {
    id: 'fill-triplets',
    name: 'Triplet fill',
    slot: 'fills',
    surfaces: ['pad', 'kit'],
    difficulty: 2,
    sticking: 'RLR LRL',
    contextTempos: [90, 110, 130],
    description: 'One triplet per drum moving down the kit. Make the triplets even before you make them fast.',
    notation: n12(
      [
        { name: 'SN', pattern: 'ooo---------' },
        { name: 'T1', pattern: '---ooo------' },
        { name: 'T2', pattern: '------ooo---' },
        { name: 'FT', pattern: '---------ooo' },
      ],
      'RLRLRLRLRLRL',
      'then crash on 1',
    ),
  },
  {
    id: 'fill-six-stroke',
    name: 'Six-stroke fill',
    slot: 'fills',
    surfaces: ['pad', 'kit'],
    difficulty: 3,
    sticking: 'R LL RR L',
    contextTempos: [80, 100, 120],
    minLevel: 2,
    description: 'Accented singles on the toms, doubles on the snare. Two six-strokes fill the bar as triplets.',
    notation: n12(
      [
        { name: 'T1', pattern: 'O-----------' },
        { name: 'T2', pattern: '-----O------' },
        { name: 'FT', pattern: '------O----O' },
        { name: 'SN', pattern: '-oooo--oooo-' },
      ],
      'RLLRRLRLLRRL',
    ),
  },
  {
    id: 'fill-offbeat-crash',
    name: 'Fill ending on an offbeat crash',
    slot: 'fills',
    surfaces: ['kit'],
    difficulty: 3,
    contextTempos: [90, 110, 130],
    minLevel: 2,
    description: 'Any fill, but the crash lands on the "a" of 4 instead of the 1. Keep the groove going straight after.',
    notation: n16(
      [
        { name: 'CR', pattern: '---------------X' },
        { name: 'SN', pattern: 'oooo----oooo----' },
        { name: 'T1', pattern: '----oooo--------' },
        { name: 'FT', pattern: '------------ooo-' },
        { name: 'K', pattern: '---------------o' },
      ],
      'RLRLRLRLRLRLRLR-',
      'crash + kick on the "a" of 4, then straight back into the groove',
    ),
  },
  {
    id: 'fill-linear-16ths',
    name: 'Linear 16th fill',
    slot: 'fills',
    surfaces: ['pad', 'kit'],
    difficulty: 4,
    sticking: 'R L K',
    contextTempos: [80, 100, 120],
    minLevel: 3,
    description: 'No two limbs strike together. Hands on snare and toms, kick fills the gaps. RLK repeats over the 16th grid.',
    notation: n16(
      [
        { name: 'SN', pattern: 'oo-oo-oo-oo-oo-o' },
        { name: 'K', pattern: '--o--o--o--o--o-' },
      ],
      'RL-RL-RL-RL-RL-R',
      'move the hands to the toms once the pattern is solid',
    ),
  },
]

// ---------------------------------------------------------------------------
// Independence — kit only.
// ---------------------------------------------------------------------------
export const INDEPENDENCE: Exercise[] = [
  {
    id: 'ind-hh-foot-2-4',
    name: 'Hi-hat foot on 2 & 4',
    slot: 'independence',
    surfaces: ['kit'],
    difficulty: 2,
    description: 'Ride instead of hi-hat, so the hi-hat foot is free. It chicks on 2 and 4, exactly together with the snare. Once it locks, vary the kick.',
    notation: n8([
      { name: 'RD', pattern: 'xxxxxxxx' },
      { name: 'SN', pattern: '--o---o-' },
      { name: 'K', pattern: 'o--oo---' },
      { name: 'HF', pattern: '--x---x-' },
    ]),
  },
  {
    id: 'ind-syncopation-feet',
    name: 'Syncopation reading with feet',
    slot: 'independence',
    surfaces: ['kit'],
    difficulty: 3,
    description: 'Hands keep 8ths on the hi-hat and snare on 2 & 4. The kick plays a syncopated line — this one, then make up your own.',
    notation: n8(
      [
        { name: 'HH', pattern: 'xxxxxxxx' },
        { name: 'SN', pattern: '--o---o-' },
        { name: 'K', pattern: 'o--o-o-o' },
      ],
      undefined,
      'change the kick line every few repeats',
    ),
  },
  {
    id: 'ind-linear-groove',
    name: 'Linear 16th groove',
    slot: 'independence',
    surfaces: ['kit'],
    difficulty: 3,
    description: 'Hi-hat, snare and kick share the 16th grid — never two at once. Loop the bar until it stops feeling like counting.',
    notation: n16([
      { name: 'HH', pattern: '-xx--x-xx-x--xx-' },
      { name: 'SN', pattern: '----o-------o---' },
      { name: 'K', pattern: 'o--o--o--o-o---o' },
    ]),
  },
  {
    id: 'ind-ostinato-ride',
    name: 'Ride ostinato with kick variations',
    slot: 'independence',
    surfaces: ['kit'],
    difficulty: 3,
    minLevel: 2,
    description: 'Ride plays this fixed pattern with snare on 2 & 4. Kick starts on the 1, then moves one 8th later each repeat until it comes back around.',
    notation: n8(
      [
        { name: 'RD', pattern: 'x-xx-x-x' },
        { name: 'SN', pattern: '--o---o-' },
        { name: 'K', pattern: 'o-------' },
      ],
      undefined,
      'kick moves through all 8 positions',
    ),
  },
]

// ---------------------------------------------------------------------------
// Groove & time — kit only.
// ---------------------------------------------------------------------------
export const TIME: Exercise[] = [
  {
    id: 'time-click-2-4',
    name: 'Click on 2 & 4',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 2,
    click: '2and4',
    description: 'The click only sounds on 2 and 4 — it sits on your snare. Play a simple groove and keep the click buried inside the backbeat.',
    notation: n8([...BACKBEAT_8, { name: 'CL', pattern: '--o---o-' }]),
  },
  {
    id: 'time-click-dropout',
    name: 'Click drops out every other bar',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 3,
    click: 'dropout',
    description: 'The click plays one bar, then goes silent for one bar. Land exactly on it when it comes back. The dots still pulse so you can see when it returns.',
    notation: n8([...BACKBEAT_8, { name: 'CL', pattern: 'o-o-o-o-' }], undefined, 'bar 1 click, bar 2 silent'),
  },
  {
    id: 'time-ghost-groove',
    name: '16th hi-hat groove with ghost notes',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 3,
    description: 'Ghost notes on the "e" and "a" of 2 and 4, as quiet as you can make them. The backbeat stays loud.',
    notation: n16([
      { name: 'HH', pattern: 'xxxxxxxxxxxxxxxx' },
      { name: 'SN', pattern: '----Og-g----Og-g' },
      { name: 'K', pattern: 'o------oo-------' },
    ]),
  },
  {
    id: 'time-half-time-shuffle',
    name: 'Half-time shuffle',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 4,
    minLevel: 2,
    description: 'Shuffled hi-hat, backbeat on 3, ghosted snare in between. Start around 70 bpm and let the ghost notes sit inside the hi-hat.',
    notation: n12([
      { name: 'HH', pattern: 'x-xx-xx-xx-x' },
      { name: 'SN', pattern: '-g-g--O--g-g' },
      { name: 'K', pattern: 'o------o----' },
    ]),
  },
  {
    id: 'time-seven-eight',
    name: 'Groove in 7/8',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 3,
    minLevel: 2,
    description: 'Count 2 + 2 + 3. Kick on 1, snare on 3 and 5. Hold it without adding an extra beat at the end of the bar.',
    notation: {
      beats: 7,
      subdivision: 1,
      voices: [
        { name: 'HH', pattern: 'xxxxxxx' },
        { name: 'SN', pattern: '--o-o--' },
        { name: 'K', pattern: 'o----o-' },
      ],
      caption: 'count 1 2 | 1 2 | 1 2 3',
    },
  },
  {
    id: 'time-slow-60',
    name: 'Groove at 60 bpm',
    slot: 'time',
    surfaces: ['kit'],
    difficulty: 2,
    description: 'The simplest groove you know, at 60. Slow tempos expose rushing — subdivide 16ths in your head.',
    notation: n8(BACKBEAT_8),
  },
]

// ---------------------------------------------------------------------------
// Repertoire — kit only. No metronome: the track is the click.
// ---------------------------------------------------------------------------
export const REPERTOIRE: Exercise[] = [
  {
    id: 'rep-learn',
    name: 'Learn a song section',
    slot: 'repertoire',
    surfaces: ['kit'],
    difficulty: 2,
    click: 'none',
    description: 'Pick one section of a song in "learning" status and loop it until it feels natural.',
  },
  {
    id: 'rep-playthrough',
    name: 'Full play-through',
    slot: 'repertoire',
    surfaces: ['kit'],
    difficulty: 2,
    click: 'none',
    description: 'Play a whole song top to bottom. Log it clean to move it towards performance-ready.',
  },
]

export const LIBRARY: Exercise[] = [...WARMUPS, ...RUDIMENTS, ...FILLS, ...INDEPENDENCE, ...TIME, ...REPERTOIRE]

export const exerciseById = (id: string): Exercise => {
  const ex = LIBRARY.find((e) => e.id === id)
  if (!ex) throw new Error(`Unknown exercise: ${id}`)
  return ex
}

export const bySlot = (slot: Exercise['slot'], surface?: Exercise['surfaces'][number]) =>
  LIBRARY.filter((e) => e.slot === slot && (!surface || e.surfaces.includes(surface)))
