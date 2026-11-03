# Margins: Philosophy

This is the foundation of the look and feel of everything in Margins. Read it
before designing a level, writing on-screen text, or adding a feature. When a
decision isn't covered here, choose whatever fits the spirit of this page best,
and if it's a big call, ask before building.

## Who it's for

**Everyone.** Kids, teenagers, moms and dads.

Our benchmark player is **an early reader**, a child at about the level of
*Go, Dog. Go!* **If it works for an early reader, it works for everybody.**

That isn't "making it for little kids." Great interfaces work for everyone, so
simplicity here is an accessibility principle. Done right, Margins should also feel
nostalgic and interesting to older players, like the doodles in the back of a
school notebook come to life.

### The early reader test

Before anything ships, ask:

- Could an early reader play this **without a grown-up explaining it**?
- Could they **read every word** on the screen?
- When they fail, do they **want to try again** instead of feeling bad?
- Would a parent watching over their shoulder **smile**?

## Words on screen

**One big word at a time, right when it's needed.**

- Use single words a kindergartner or first grader can read: **WALK. JUMP. HURRY.
  LOOK OUT! DANGER.**
- A word appears at the **moment its meaning is obvious**: JUMP just before the
  first gap, DANGER when the eraser shows up. The situation teaches the word and
  the word teaches the situation. That makes every instruction a small reading
  lesson.
- Words are **written on the page in pencil** (and boil) like everything else,
  never in a separate UI box.
- **No sentences, no paragraphs, no menus to read.** If something needs more than
  one word, the design is too complicated. Fix the design, not the text.
- Words never stop play or need to be dismissed.

### Starter vocabulary

Approved: `WALK` `JUMP` `HURRY` `LOOK OUT!` `DANGER`

In use, not yet confirmed: `GO!` `UP!` (Climb milestone messages), `3 2 1 GO!`
and `THE END` (Launch)

Proposed, not yet confirmed: `STOP` `DOWN` `YES` `NO` `BIG` `LITTLE`
`IN` `OUT` `HELP`

Add new words only if an early reader can read them; when in doubt, check a
kindergarten or first-grade sight-word list.

Read mode is the one place with more words: there, the word *is* the puzzle. Its
words come from the skill ladder in `docs/reading-framework.md` (CVC words first),
one at a time, always with a picture to match.

> **Open question:** Strip titles (like "Getting Started") are a little longer
> than one word. Short, read-aloud-able titles are probably fine because a parent
> can read them out, but this isn't settled yet.

## Look and feel

- **It all lives on notebook paper.** Light blue ruled lines, a red margin, hole
  punches, coffee stains. The page itself is the world.
- **Everything is hand-drawn and boils.** Lines redraw with a slight wobble several
  times a second, like a flipbook. No image files; everything is drawn in code.
- **The paper's features are the game.** Ruled lines are floors, the margin is a
  wall, a coffee ring is the goal. New mechanics should come from things you'd
  really find on or near a notebook page (erasers, pens, highlighters, doodles,
  folds, smudges).
- **Pencil gray is the default. Color is special.** When something has color, it
  should mean something. Fire gets a warm fill. Colored pencil (red, blue, green,
  drawn as a colored outline with hatching) arrives in Launch's rocket puzzle,
  where the colors are the thing you read. More drawing tools (ballpoint pens,
  markers, highlighters) can bring color later.

## How levels teach

- **Teach by doing, not by telling.** Each level introduces **one new idea**,
  makes it safe to try, then asks you to use it.
- **Failing is gentle.** Early levels are nearly impossible to lose. When you do
  fail, you're back in action right away, with no "game over" screens.
- **One word, at the right moment** (see above) is the only instruction.

## Learning

Where it fits naturally, Margins teaches kindergarten ideas: reading simple words,
colors, big and little, counting, opposites, shapes. Learning should feel like
play, never like a quiz.

**Original work only.** We borrow the *spirit* of books we love (the bright,
simple, joyful words of *Go, Dog. Go!*) but never their characters, text, or
artwork. Make up our own dogs.

## Navigation: the comic page

Levels are chosen from a page that looks like the **newspaper comics section**:

- Each **row is a strip** with a title at the top, like the name of a cartoon.
- Each **panel in the row is a level**, and together the panels tell a little story.
- The stick figure walks along a line at the bottom of the page and **jumps up into
  a panel** to enter that level.

The first strip is **"Getting Started"**: basic tutorials that teach how to move
and do things, the way good games teach their controls. More advanced controls and
challenges can come in later strips.

When a panel is finished, it shows a little drawing of what happened, so the comic
page tells the story of what you've played.

The comic page is also how you pick a **mode**: the "Climb" strip's panel opens the
endless climbing game, and "Read" opens the reading game. New modes get their own strip
rather than a separate menu.

## Not yet (scope discipline)

Great ideas we're deliberately saving for later, so we don't build ahead of
ourselves:

- The stick figure gets a pencil and writes letters
- Mazes, and more puzzles beyond Launch's colored switches
- More enemies beyond Launch's UFO and alien
- Red and blue ballpoint pens, colored markers, highlighters
- Vertical levels (climbing up or down the page), not just side-to-side ones
- Obstacles and challenges beyond the tutorials, and more advanced controls
- Choose-your-own-adventure: story choices that branch to different panels or strips
- Installing to a phone or tablet home screen, and other ways to distribute it
- The original staircase level (climb the ruled lines to a coffee ring), retired when
  the comic page arrived; it's in git history and could come back as a panel
- The dog following the figure into later strips; counting stars in Getting Started
- Climb: more enemy types, moving or breaking platforms, shared online high scores

Add new "someday" ideas to this list instead of building them. Move something out
of this list only when we decide to work on it.

## For contributors (humans and agents)

1. Read this page first.
2. Run the early reader test on anything players will see.
3. Keep on-screen text to the starter vocabulary, one word at a time.
4. If you change the philosophy, update this page in the same commit, and say why
   in the commit message.
