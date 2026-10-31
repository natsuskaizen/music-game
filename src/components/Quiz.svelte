<!-- The quiz screen (design §8.1): read the note on the staff (a grand staff for `both`) and answer with the active input.
     A miss gets one retry, then the answer is revealed and the quiz waits for Continue; with a listening input,
     playing the revealed note is Continue too (design §8.4).
     Sequence mode (settings.mode, not review) reads a run of notes through the cursor: a right note moves on by itself,
     and the same Continue rules apply per note, so a listening input can play on through misses (design §8.4).
     Sound follows the sound settings (`noteToPlay`, design §14). Switching input keeps the question. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { needsRingerHint, setIgnoreSilentSwitch } from '../audio/context';
  import { loadPiano, playPitch } from '../audio/piano';
  import { midiOf, pitchLabel } from '../core/pitch';
  import { notePool } from '../core/ranges';
  import { sequenceNotes, startRun, stepRun, type SequenceRun } from '../core/cursor';
  import { makeSequence, type Measure } from '../core/sequence';
  import {
    answerContinues,
    firstTryPercent,
    isSettled,
    reduce,
    settledAttempt,
    startSession,
    withPool,
    type Answer,
    type Session,
    type SessionEvent,
  } from '../core/session';
  import type { Settings } from '../core/settings';
  import { learnedPicker, weightsFor } from '../core/selector';
  import { summarize } from '../core/results';
  import { noteToPlay } from '../core/sound';
  import { applyAttempt, newStat, weakNotes, type Attempt, type NoteStat } from '../core/stats';
  import type { Theme } from '../core/theme';
  import { celebrates } from '../core/streak';
  import { FEEDBACK } from './feedback';
  import { available, inputById } from '../inputs';
  import { loadStats, recordAttempt, requestPersistence } from '../storage/db';
  import type { KeyMark } from '../inputs/types';
  import ActiveInput from './ActiveInput.svelte';
  import Results from './Results.svelte';
  import SprintBar from './SprintBar.svelte';
  import Staff from './Staff.svelte';

  let {
    theme,
    settings,
    onHome,
    review,
  }: {
    theme: Theme;
    settings: Settings;
    onHome: () => void;
    /** Review weak notes (design §7.4): the stats Home loaded, so the first pool is known. Absent for a normal quiz. */
    review?: ReadonlyMap<string, NoteStat>;
  } = $props();

  const feedback = $derived(FEEDBACK[theme]);
  let streakEl = $state<HTMLElement>();
  const ringerHint = needsRingerHint();
  void loadPiano(); // the Start tap that opened this screen lets iOS start audio
  const inputs = available();
  // What the quiz knows about each note; it fills from storage and grows with every answer, and the picker reads it live.
  // `review` is fixed for the life of the screen, so reading it once is right.
  // svelte-ignore state_referenced_locally
  const stats = new SvelteMap<string, NoteStat>(review);
  const pick = learnedPicker(() => ({
    stats,
    cfg: weightsFor(settings.difficulty),
    now: Date.now(),
    random: Math.random,
  }));
  const fullPool = () => notePool(settings.clef, settings.difficulty);
  // Review draws only weak notes and runs until none remain; a normal quiz runs for the chosen question count.
  // Sequence mode: the measures on the staff, the run walking them, and how each settled note went.
  // svelte-ignore state_referenced_locally
  const sequenced = !review && settings.mode === 'sequence';
  let measures = $state.raw<Measure[]>([]);
  let run = $state.raw<SequenceRun>();
  let outcomes = $state.raw<('right' | 'wrong')[]>([]);
  function beginSequence() {
    measures = makeSequence(fullPool(), settings.difficulty, { picker: pick, random: Math.random });
    outcomes = [];
    run = startRun(sequenceNotes(measures));
    return run.session;
  }
  const begin = () =>
    review
      ? startSession(weakNotes(fullPool(), stats), undefined, pick)
      : sequenced
        ? beginSequence()
        : startSession(fullPool(), settings.questionsPerSession || undefined, pick);
  // One event through the cursor in sequence mode, else straight through the session.
  function step(event: SessionEvent): Session {
    if (!run) return reduce(quiz, event, pick);
    run = stepRun(run, event);
    return run.session;
  }
  // The default input starts; the switcher changes it for this quiz only.
  const defaultInput = () => inputById(settings.input);
  let input = $state.raw(defaultInput());
  // A listening input hears the room: the app stays quiet (design §4.3) and playing the revealed note continues.
  const listening = $derived('listens' in input && input.listens === true);
  let quiz = $state(begin());
  const sound = (before: Session | undefined, after: Session) => {
    const midi = noteToPlay(before, after, settings.sound);
    // Playing a note while listening would answer itself.
    if (midi !== undefined && !listening) playPitch(midi, settings.sound.volume);
  };
  onMount(() => {
    setIgnoreSilentSwitch(settings.sound.ignoreSilentSwitch);
    sound(undefined, quiz);
    // Storage is a bonus: if it is unavailable (private mode, quota) the quiz still works, without memory.
    void requestPersistence().catch(() => undefined);
    loadStats()
      .then((stored) => {
        for (const [key, stat] of stored) if (!stats.has(key)) stats.set(key, stat);
      })
      .catch(() => undefined);
  });
  let noteEl = $state<SVGGElement>();
  // Counts questions, so an animation that ends after the quiz moved on doesn't advance it again.
  let asked = 0;
  // Every settled question of this session, for the results.
  let attempts = $state.raw<Attempt[]>([]);
  // When the current question appeared, to time the answer.
  let shownAt = Date.now();

  function record(before: Session, after: Session, answer: Answer) {
    const ts = Date.now();
    const attempt = settledAttempt(before, after, { ts, input: input.id, ms: ts - shownAt, answer });
    if (!attempt) return;
    attempts = [...attempts, attempt];
    stats.set(attempt.key, applyAttempt(stats.get(attempt.key) ?? newStat(attempt.key), attempt));
    recordAttempt(attempt).catch(() => undefined);
    // A note that is no longer weak drops out of the review pool, and the session ends when the pool is empty.
    if (review) quiz = withPool(quiz, weakNotes(fullPool(), stats));
  }

  // Settled notes in order, then the one in play once it has settled.
  const sequenceMarks = $derived([
    ...outcomes,
    ...(quiz.phase === 'right' ? (['right'] as const) : quiz.phase === 'reveal' ? (['wrong'] as const) : []),
  ]);
  const target = $derived(midiOf(quiz.note.pitch));
  const name = $derived(pitchLabel(quiz.note.pitch));
  const showsAnswer = $derived(isSettled(quiz.phase));
  // The note a listening input hears right now; an answer's own mark wins over it.
  let heard = $state<number>();
  const marks = $derived(
    new Map<number, KeyMark>([
      ...(heard === undefined ? [] : [[heard, 'heard'] as const]),
      ...quiz.misses.map((a) => [a.midi, 'wrong'] as const),
      ...(showsAnswer ? [[target, 'right'] as const] : []),
    ]),
  );

  // The first note; later ones enter from advance(). The note group persists, so animating it right away is safe.
  $effect(() => {
    if (noteEl) feedback.enter(noteEl);
  });

  function showQuestion(next: Session) {
    asked++;
    shownAt = Date.now();
    sound(quiz, next);
    quiz = next;
    if (noteEl) feedback.enter(noteEl);
  }

  function advance() {
    if (quiz.phase === 'done') return; // the sprint ended while a right answer was still animating
    if (run && isSettled(quiz.phase)) outcomes = [...outcomes, quiz.phase === 'right' ? 'right' : 'wrong'];
    showQuestion(step({ type: 'next' }));
  }

  // Feedback for a changed phase: a sequence has no single note to animate, so a right note moves on at once.
  async function respond() {
    if (run) {
      if (quiz.phase === 'right') advance();
      return;
    }
    if (!noteEl) return;
    if (quiz.phase !== 'right') {
      feedback.wrong(noteEl);
      return;
    }
    const answered = asked;
    await feedback.right(noteEl);
    // Play again during the animation has already moved on.
    if (asked === answered) advance();
  }

  async function onAnswer(answer: Answer) {
    if (listening && answerContinues(quiz, answer)) {
      advance();
      return;
    }
    const before = quiz;
    quiz = step({ type: 'answer', answer });
    record(before, quiz, answer);
    sound(before, quiz);
    if (streakEl && celebrates(before.streak, quiz.streak)) feedback.celebrate(streakEl);
    if (quiz.phase !== before.phase) await respond();
  }
</script>

<section class="quiz" aria-label="Quiz">
  <div class="bar">
    {#if quiz.phase !== 'done'}<button type="button" class="home" onclick={onHome}>Home</button>{/if}
    {#if inputs.length > 1}
      <select
        aria-label="Input"
        value={input.id}
        onchange={(e) => {
          input = inputById(e.currentTarget.value);
        }}
      >
        {#each inputs as option (option.id)}<option value={option.id}>{option.label}</option>{/each}
      </select>
    {/if}
    <span>Streak <b bind:this={streakEl}>{quiz.streak}</b></span>
    <span>First try <b>{firstTryPercent(quiz)}%</b></span>
  </div>
  {#if settings.timer && !review && quiz.phase !== 'done'}
    <SprintBar
      difficulty={settings.difficulty}
      onTimeUp={() => {
        quiz = step({ type: 'timeUp' });
      }}
    />
  {/if}
  {#if ringerHint}<p class="hint">Turn the ringer on for sound.</p>{/if}
  <p class="msg {quiz.phase}" aria-live="polite">
    {#if quiz.phase === 'retry'}Not quite. One more try.
    {:else if quiz.phase === 'reveal'}It's {name}. {listening ? 'Play it or tap Continue.' : 'Tap Continue.'}
    {:else if quiz.phase === 'right'}Yes, {name}!
    {:else}{listening ? 'Play this note.' : 'Find this note on the keyboard.'}{/if}
  </p>
  {#if quiz.phase === 'done'}
    <Results
      results={summarize(attempts)}
      review={review !== undefined}
      onAgain={() => {
        attempts = [];
        showQuestion(begin());
      }}
      {onHome}
    />
  {:else}
    {#if run}
      <Staff mode={settings.clef} sequence={measures} marks={sequenceMarks} current={run.index} />
    {:else}
      <Staff
        mode={settings.clef}
        note={quiz.note}
        mark={quiz.phase === 'right' ? 'right' : quiz.phase === 'ask' ? undefined : 'wrong'}
        revealed={quiz.phase === 'reveal'}
        {heard}
        bind:noteEl
      />
    {/if}
    <ActiveInput
      method={input}
      mode={settings.clef}
      {marks}
      minLevel={settings.micLevel}
      emit={onAnswer}
      onHeard={(midi: number | undefined) => {
        heard = midi;
      }}
    />
    <div class="continue">
      {#if quiz.phase === 'reveal'}<button type="button" onclick={advance}>Continue</button>{/if}
    </div>
  {/if}
</section>

<style>
  .quiz {
    display: grid;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    box-shadow: var(--surface-shadow);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
    color: var(--muted);
  }
  .home {
    margin-right: auto;
  }
  select,
  .home,
  .continue button {
    font: 700 0.95rem var(--font);
    text-transform: capitalize;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
  }
  select {
    padding: 0.35rem 0.6rem;
    background: none;
    color: var(--text);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    font-size: 1rem;
    text-transform: none;
  }
  .home {
    padding: 0.35rem 0.9rem;
    background: none;
    color: var(--muted);
  }
  .continue button {
    background: var(--accent);
    color: var(--on-accent);
  }
  b {
    color: var(--text);
  }
  .hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .msg {
    margin: 0;
    font-weight: 700;
  }
  .msg.retry,
  .msg.reveal {
    color: var(--wrong);
  }
  .msg.right {
    color: var(--right);
  }
  .continue {
    min-height: 3rem;
    display: flex;
    justify-content: center;
  }
  .continue button {
    padding: 0.75rem 2rem;
    border-radius: var(--surface-radius);
  }
  :global(.spark) {
    fill: var(--right);
  }
  :global(.spark.alt) {
    fill: var(--accent);
  }
</style>
