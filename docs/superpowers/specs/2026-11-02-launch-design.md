# Launch: a side-scrolling story level with a rocket, a UFO, and a fireball finale

**Date:** 2026-11-02 · **Status:** approved by request, implemented

## Requested

A horizontally scrolling level, **Launch**: the stick figure runs right through a
forest, is chased by an alien in a UFO, reaches a rocket ship and flies the final
stretch, and arrives at a city just as a fireball streaks down. Camera follows to
the right with a clear end at the city; parallax pencil trees; the UFO hovers and
drops things to dodge with the alien visible; the rocket is the highlight (flickering
flame, a launch moment, up/down steering); a pencil city skyline and a celebration
at the end. Music and a few sound effects, a remembered mute button, audio that
starts only after the first tap or keypress. Added to the mode picker.

## The fireball finale (proposal, built)

Halfway through the flight, a **fireball streaks down from the sky and chases the
rocket**. It sits behind the rocket, following its height. Then it **aims**: it glows
and a dashed pencil line shows the lane it's about to take. Then it **lunges** along
that lane, fast. Steer up or down out of the lane to dodge. It does this three times,
re-entering from the sky each time. When the rocket reaches the city, the fireball
**bursts into fireworks over the skyline** instead of hitting it, and that's the
celebration. It reads as danger turned into a party, and it's clear for kids: the
dashed line says where it's going.

## Story beats and layout

| Beat | Where (world x) | What happens |
| --- | --- | --- |
| Forest | 0 – 2600 | Run right on the bottom line, jump over logs, collect stars. Parallax trees. WALK at the start. |
| UFO chase | 1300 – 3300 | HURRY! A saucer with an alien in its dome hovers over the figure and drops glowing goo after a short warning (rays under the saucer). |
| Rocket | 3600 | The UFO zooms away. Reach the rocket: he climbs in (his face appears in the porthole), 3, 2, 1, GO!, rumble and smoke, ignition, lift-off, and the rocket tips over to fly right. |
| Flight | 3600 – 7600 | The rocket flies right on its own; Up/Down (or ▲ ▼) steer. Stars to collect, clouds drift by in the background. |
| Fireball | from 5200 | LOOK OUT! The fireball chases, aims, and lunges three times. |
| City | 7600 – 8400 | The rocket lands at the skyline, he hops out, the fireball bursts into fireworks, THE END is written, and the level is complete. |

## Decisions (Claude's calls; review these)

- **Getting hit is gentle.** Goo or the fireball stuns for about a second: the figure
  (or rocket) is knocked back and blinks, and controls pause. There's no game over,
  following PHILOSOPHY.md ("failing is gentle").
- **Music is generated in code with the Web Audio API**, not a CC0 file: no audio
  files, licenses, or downloads, and it fits "everything drawn in code". A cheerful
  4-bar loop (triangle-wave melody, soft square bass) that gets busier during the
  chase and faster in the fireball finale, then a fanfare at the end. Sound effects
  are synthesized too: jump, star pickup, launch rumble, fireball whoosh, a bump
  when hit.
- **Audio rules.** One `AudioContext`, created on the first tap or keypress anywhere
  (phones require a user gesture). A pencil speaker button in the top-right corner of
  Launch mutes and unmutes (or press M); the setting is saved in `localStorage` and
  applies everywhere. Phaser's own audio is disabled so only one context exists.
  Sound is only in Launch for now; other modes can opt in later.
- **Color.** Fire (the rocket flame, the fireball, fireworks) gets a warm fill under
  its pencil lines (`COLORS.fire`), like ink blots in Climb: color is special, and here
  it means fire.
- **Long paper.** The level is one long sheet: ruled lines across the whole length, the
  red margin and hole punches only at the very start.
- **Controls.** Running uses the normal controls and touch buttons. During flight, the
  touch buttons switch to ▲ ▼ on the right; keyboard is Up/W and Down/S.
- **Words.** WALK, HURRY!, LOOK OUT! (approved), the countdown 3 2 1 GO!, and
  THE END (proposed in the philosophy, used here for the classic cartoon ending).
- **Mode picker.** A third strip, LAUNCH, between GETTING STARTED and CLIMB on the
  comic page. Its panel shows a rocket on its pad; once finished, a rocket over the
  city with a firework.

## Tunables

`LAUNCH` in `src/config.js`: section positions (`forestEnd`, `ufoStart`, `ufoEnd`,
`rocketX`, `finaleX`, `cityX`, `length`), parallax factors, UFO hover height, drop
interval and goo gravity, stun time, flight speed and steering, flight ceiling/floor,
fireball timings and lunge speed, number of lunges, music tempo.

## Structure

- `scenes/LaunchScene.js`: the level and its phases (`run`, `launching`, `flying`,
  `landing`, `done`).
- `objects/launchArt.js`: rocket, flame, smoke, UFO and alien, goo, log, trees,
  clouds, fireball, city, fireworks.
- `objects/LongPaper.js`: the long sheet of paper.
- `src/audio.js`: audio unlock, mute, music loop, sound effects.
- `TouchControls` gains a `flight` layout (▲ ▼) and `setLayout()`; `PlayerInput`
  reports `up` and `down`; `StickFigure` sets `jumped` on the frame it jumps (for the
  jump sound).

## Out of scope

Sound in the other modes, more levels in the strip, a way to lose.
