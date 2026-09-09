# sticks

A daily drum-practice coach. Sticks plans your session, runs the metronome and timer, and tracks progress — so you open the app and just play.

## What it does

- **Plans your day.** Kit day and pad days are set from your schedule. Each session is auto-built from slots (warm-up, hands, fills, independence, time, repertoire) sized by the minutes you've allotted.
- **One rudiment + one fill per week.** A "week theme" rotates in a new rudiment and fill concept once you graduate the current one, so you're always working the next thing rather than picking blindly.
- **Runs the exercise for you.** Built-in metronome and timer drive tempo ladders (climbing BPM rungs toward a PR attempt) and fill-in-context drills (same fill, several tempos) automatically, with rest breaks between rungs.
- **Reads the notation.** Exercises with sticking or grid notation render as a drum grid, adapted to your lead hand and number of toms.
- **Tracks how it felt.** Log each exercise as sloppy / okay / clean. Clean logs at target tempo count toward graduation; tempo PRs, streaks, XP, and weekly challenges build up over time.
- **Keeps a song list.** Songs move through candidate → learning → can-play → performance-ready, linked to the exercises that feed them.

## Stack

Vue 3 + TypeScript + Pinia, built with Vite. Practice logic (planning, scoring, notation adaptation) lives in `src/domain` as plain, tested TypeScript with no Vue dependency.

## Development

```bash
npm install
npm run dev        # start dev server
npm run test       # run tests
npm run typecheck  # type-check only
npm run build      # type-check + production build
```

<img width="1454" height="1556" alt="Screenshot 2026-09-08 at 18 44 00" src="https://github.com/user-attachments/assets/363aeb70-28cd-4d6d-a9a0-447950313a58" />
