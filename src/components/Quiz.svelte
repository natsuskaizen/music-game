<!-- The quiz screen (design §8.1): read the note on the staff (a grand staff for `both`) and answer with the active input.
     A miss gets one retry, then the answer is revealed and the quiz waits for Continue (design §8.4).
     The correct note sounds once the question is settled (design §14). Switching input keeps the question. -->
<script lang="ts">
  import { needsRingerHint } from '../audio/context';
  import { loadPiano, playPitch } from '../audio/piano';
  import { midiOf, pitchLabel } from '../core/pitch';
  import { notePool } from '../core/ranges';
  import {
    firstTryPercent,
    isSettled,
    reduce,
    startSession,
    toneAfter,
    type Answer,
    type Session,
  } from '../core/session';
  import type { Settings } from '../core/settings';
  import type { Theme } from '../core/theme';
  import { FEEDBACK } from './feedback';
  import { available, inputById } from '../inputs';
  import type { KeyMark } from '../inputs/types';
  import ActiveInput from './ActiveInput.svelte';
  import Staff from './Staff.svelte';

  let { theme, settings, onHome }: { theme: Theme; settings: Settings; onHome: () => void } = $props();

  const feedback = $derived(FEEDBACK[theme]);
  const ringerHint = needsRingerHint();
  void loadPiano(); // the Start tap that opened this screen lets iOS start audio
  const inputs = available();
  const begin = () =>
    startSession(
      notePool(settings.clef, settings.difficulty),
      settings.questionsPerSession || undefined,
      Math.random,
    );
  // The default input starts; the switcher changes it for this quiz only.
  const defaultInput = () => inputById(settings.input);
  let input = $state.raw(defaultInput());
  let quiz = $state(begin());
  let noteEl = $state<SVGGElement>();
  // Counts questions, so an animation that ends after the quiz moved on doesn't advance it again.
  let asked = 0;

  const target = $derived(midiOf(quiz.note.pitch));
  const name = $derived(pitchLabel(quiz.note.pitch));
  const showsAnswer = $derived(isSettled(quiz.phase));
  const marks = $derived(
    new Map<number, KeyMark>([
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
    quiz = next;
    if (noteEl) feedback.enter(noteEl);
  }

  function advance() {
    showQuestion(reduce(quiz, { type: 'next' }, Math.random));
  }

  async function onAnswer(answer: Answer) {
    const before = quiz;
    quiz = reduce(quiz, { type: 'answer', answer }, Math.random);
    const tone = toneAfter(before, quiz);
    if (tone !== undefined) playPitch(tone);
    if (quiz.phase === before.phase || !noteEl) return;
    if (quiz.phase !== 'right') {
      feedback.wrong(noteEl);
      return;
    }
    const answered = asked;
    await feedback.right(noteEl);
    // Play again during the animation has already moved on.
    if (asked === answered) advance();
  }
</script>

<section class="quiz" aria-label="Quiz">
  <div class="bar">
    <button type="button" class="home" onclick={onHome}>Home</button>
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
    <span>Streak <b>{quiz.streak}</b></span>
    <span>First try <b>{firstTryPercent(quiz)}%</b></span>
  </div>
  {#if ringerHint}<p class="hint">Turn the ringer on for sound.</p>{/if}
  <p class="msg {quiz.phase}" aria-live="polite">
    {#if quiz.phase === 'retry'}Not quite. One more try.
    {:else if quiz.phase === 'reveal'}It's {name}. Tap Continue.
    {:else if quiz.phase === 'right'}Yes, {name}!
    {:else}Find this note on the keyboard.{/if}
  </p>
  {#if quiz.phase === 'done'}
    <div class="results">
      <p class="msg right">
        Session done: {quiz.firstTry} of {quiz.total} right on the first try ({firstTryPercent(quiz)}%).
      </p>
      <button
        type="button"
        onclick={() => {
          showQuestion(begin());
        }}>Play again</button
      >
    </div>
  {:else}
    <Staff
      mode={settings.clef}
      note={quiz.note}
      mark={quiz.phase === 'right' ? 'right' : quiz.phase === 'ask' ? undefined : 'wrong'}
      revealed={quiz.phase === 'reveal'}
      bind:noteEl
    />
    <ActiveInput method={input} mode={settings.clef} {marks} emit={onAnswer} />
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
  .results button,
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
  .results {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding: 1rem 0;
  }
  .results button,
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
  .results button,
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
