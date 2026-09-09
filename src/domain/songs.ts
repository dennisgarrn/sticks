import type { Song } from './types'

/**
 * Curated suggestions keyed by the exercise they showcase. The repertoire slot
 * offers one of these when the song list is empty. Titles only — no
 * transcriptions, the app links you to the track and you learn by ear.
 */
export const SONG_SUGGESTIONS: Record<string, Array<Pick<Song, 'title' | 'artist' | 'bpm'>>> = {
  'rud-singles': [
    { title: 'Toxicity', artist: 'System of a Down', bpm: 125 },
    { title: 'Hot for Teacher', artist: 'Van Halen', bpm: 138 },
  ],
  'rud-doubles': [
    { title: 'Hysteria', artist: 'Muse', bpm: 94 },
    { title: 'Wipe Out', artist: 'The Surfaris', bpm: 160 },
  ],
  'rud-paradiddle': [
    { title: 'Cissy Strut', artist: 'The Meters', bpm: 90 },
    { title: 'Superstition', artist: 'Stevie Wonder', bpm: 100 },
  ],
  'rud-six-stroke': [
    { title: 'Tom Sawyer', artist: 'Rush', bpm: 88 },
  ],
  'fill-triplets': [
    { title: 'Rosanna', artist: 'Toto', bpm: 84 },
    { title: 'Everlong', artist: 'Foo Fighters', bpm: 158 },
  ],
  'fill-16ths-around': [
    { title: 'In the Air Tonight', artist: 'Phil Collins', bpm: 96 },
    { title: 'Seven Nation Army', artist: 'The White Stripes', bpm: 124 },
  ],
  'time-half-time-shuffle': [
    { title: 'Rosanna', artist: 'Toto', bpm: 84 },
    { title: 'Fool in the Rain', artist: 'Led Zeppelin', bpm: 132 },
  ],
  'time-seven-eight': [
    { title: 'Money', artist: 'Pink Floyd', bpm: 120 },
    { title: 'Solsbury Hill', artist: 'Peter Gabriel', bpm: 102 },
  ],
}

export const suggestSongs = (exerciseIds: string[], existing: Song[]) => {
  const known = new Set(existing.map((s) => `${s.title}|${s.artist}`))
  return exerciseIds
    .flatMap((id) => (SONG_SUGGESTIONS[id] ?? []).map((s) => ({ ...s, linkedExerciseId: id })))
    .filter((s) => !known.has(`${s.title}|${s.artist}`))
}
