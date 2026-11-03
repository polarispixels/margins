# Margins Reading Framework

Nov 2, 2026 · Polaris Pixels

A reading game for kindergarten and first grade that quietly assesses the child as he plays and picks the next puzzle so he stays challenged but not overwhelmed.

## Goal and principles

The goal is a game the child wants to play that measurably moves his reading forward, starting at his current level (around Go, Dog. Go!). Every design choice follows these rules:

1. Decode, don't guess. Puzzles are built so the only reliable way to win is to read the whole word, not to guess from the first letter or a picture.
2. Every answer is data. The game silently records what he got right, wrong, and how long it took, per word and per skill.
3. Stay in the sweet spot. Aim for roughly 80 to 90 percent success. Higher means it's too easy; lower means frustration.
4. Reward effort, not just correctness. Trying, finishing a round, and improving all earn something.
5. Short sessions. About 5 to 10 minutes, ending on a success.
6. Follow the school's sequence. Load the same phonics order and sight word list his class uses so the game reinforces school.

## Skill ladder

Skills unlock in this order, a common kindergarten to first grade sequence. A Go, Dog. Go! level reader likely starts around levels 2 and 3. Swap in his school's exact sequence once you have it.

| Level | Skill | Example words |
| --- | --- | --- |
| 1 | Letter sounds | Tap the letter that makes the /m/ sound |
| 2 | CVC words, short a and o | cat, dog, hot, map |
| 3 | CVC words, all short vowels | pig, hen, sun, bed |
| 4 | Early sight words | the, go, is, a, see, said |
| 5 | Blends | stop, frog, crab, nest |
| 6 | Digraphs | ship, chick, fish, the |
| 7 | Long vowels with silent e | cake, bike, home, cute |
| 8 | Two-syllable words | rabbit, sunset, tractor, chicken |
| 9 | Short sentences | The pig is in the mud. |

Each word in the content library is tagged with its level and skill, plus a picture and a theme (farm, beach, and so on), so any biome can pull words at the right level.

## Puzzle types

Variety keeps it fresh, and each type tests a different side of the same word. The engine rotates them.

| Puzzle | How it works | Tests | Difficulty knobs |
| --- | --- | --- | --- |
| Word to picture | Word shown (COW), pick the matching picture from 3 to 5 | Decoding | Number of choices, how similar the distractor words are |
| Picture to word | Picture shown, pick the matching word | Decoding and spelling awareness | Same as above |
| Letter collect | Collect scattered letters in order to spell the pictured word (platformer version) | Spelling | Word length, extra decoy letters |
| Sound it out | Hear a word, pick it from written choices | Sound to print | Similar-sounding choices |
| Missing letter | C\_W, pick the missing letter | Vowel and consonant sounds | Middle vs first vs last letter |
| Rhyme time | Pick the word that rhymes with CAT | Phonemic awareness | Number of choices |
| Sentence match | Read a short sentence, pick the matching scene | Comprehension | Sentence length, similar scenes |

The distractor rule is the core of the system. Choices get harder in three steps: different words (cow, fish, tree), then shared letters (cow, cat, car), then one sound apart (cat, hat, bat, cap). The third step forces full decoding.

## Adaptive engine

The engine keeps a mastery score for every word and every skill, and picks each next puzzle to keep the child near 85 percent success.

Placement. The first session is a short warm-up that feels like a normal round. It starts at level 2 and steps up after correct answers and down after misses until it finds where he lands, then starts him just below that so day one feels like winning.

Mastery tracking. Each word has a score from 0 to 100. A correct answer raises it, a miss lowers it, and a fast correct answer raises it more than a slow one, since speed signals fluency. A word counts as mastered after several correct answers on different days and in at least two puzzle types. A skill is mastered when most of its words are.

Picking the next puzzle. Each round mixes three kinds of words:

1. Mostly words he's still learning, at his current level.
2. Some review words he mastered earlier, due for a spaced check.
3. One or two stretch words from the next level up.

Difficulty dial. The engine watches his rolling success rate over the last 10 to 20 answers. Above about 90 percent, it adds harder distractors, more choices, or new words. Below about 75 percent, it eases back. Two or three misses in a row triggers an easy win right away, so he never spirals.

Spaced review. Mastered words come back after growing gaps (1 day, 3 days, a week, two weeks). A miss on a review word drops it back into active learning.

Fading support. New words start with a tap-to-hear button. As a word's score rises, the hint is hidden, then removed. Using a hint counts as a partial correct, not a miss.

Miss patterns. The engine also notes which wrong answer he picked. Choosing HAT for CAT points to a first-sound issue; choosing CUT points to vowels. Those patterns steer which skills get more practice.

## Rewards and motivation

The child should never feel tested. The scoring is invisible; what he sees is a game.

- A wrong answer gets a gentle wiggle and a second try, never a buzzer or a lost life.
- Stars for finishing a round, regardless of score.
- A word he finally gets after missing it earns a bigger celebration than an easy one.
- Mastered words go into a sticker book of pencil drawings he can flip through.
- Leveling up unlocks a new biome (farm, then beach, then jungle), so progress feels like exploring.
- Sessions end on a correct answer, with a short "come back tomorrow" moment.

## Parent view

A screen behind a simple parent gate (hold a button for 3 seconds, or a math question) shows:

- Current level and skills mastered.
- Words mastered, words in progress, and trouble words.
- Miss patterns in plain language, like "mixing up short e and short i."
- Minutes played and accuracy by week, to see the trend.
- A short list of words to practice offline, for reading together at bedtime.

## Where AI fits

The adaptive engine itself should be plain rules and scores, not an AI model. It needs to be predictable, explainable, and work offline, and the rules above are well understood. AI earns its place around the engine:

| Use | How |
| --- | --- |
| Building the content library | Claude generates tagged word lists, distractor sets, decodable sentences, and pencil-style drawing code for each biome, reviewed by you before going in |
| Weekly progress summary | Claude reads the week's anonymous play data and writes a plain-English note: what improved, what's stuck, what to practice together |
| Matching the school | Paste in his class's sight word list or phonics sequence and Claude maps it onto the skill ladder |
| Voice | Text-to-speech for tap-to-hear, generated once per word and saved as audio |
| Tuning the engine | After a few weeks, Claude reviews the data to check whether the 85 percent target and mastery rules are working for the child |

This keeps the child-facing game simple and safe, and puts AI where it saves you the most work. It's also a clean story when you talk about AI in education: AI builds and improves the tool, and a transparent system teaches the child.

## Privacy and data

All play data stays on the device by default, stored in the browser, with an export button for backup. No accounts, names, or ads. If the tool ever goes beyond your family, US children's privacy law (COPPA) applies to collecting data from kids under 13, so a cloud version or public release needs a privacy review first.

## Build phases

1. Core loop. Word to picture puzzle with 3 choices, farm theme, about 30 CVC words, tap-to-hear, per-word scores saved in the browser. Play it with the child and watch.
2. Adaptive engine. Placement warm-up, the difficulty dial, the three-step distractor rule, spaced review, fading hints.
3. Variety and rewards. Add picture to word, missing letter, and rhyme time; stars and the sticker book.
4. Parent view. Progress screen, miss patterns, practice list, data export.
5. More levels and biomes. Sight words, blends, and digraphs; beach and jungle themes; school word list loaded in.
6. Inside Margins. Letter collect as a platformer level, so reading becomes part of the bigger game.
7. AI layer. Weekly summary and content generation tooling.

Phases 1 and 2 are the real test. If the child enjoys the core loop and the engine keeps him in the sweet spot, everything after is adding content.

## Open questions

- [ ] Which sight word list and phonics sequence does the child's class use? Ask his teacher.
- [ ] Is this a separate app or a mode inside Margins? Separate is simpler to start and keeps the data clean.
- [ ] Whose voice for tap-to-hear: text-to-speech, or recordings of a parent?
- [ ] Will a sibling use it too? If so, add simple profiles so each child has their own progress.
- [ ] Should his teacher see the parent view, and would she want to suggest words?
