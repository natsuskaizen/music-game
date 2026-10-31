<!-- M1 demo quiz: read the note, tap its key. A miss gets one retry, then the answer is revealed and the quiz waits for Continue (design §8.4).
     The correct note sounds once the question is settled (design §14). -->
<script lang="ts">
  import { needsRingerHint, playTone } from '../audio/tone';
  import { KEY_RANGES } from '../core/keyboard';
  import { midiOf, pitchLabel } from '../core/pitch';
  import { answerKey, firstTryPercent, nextQuestion, startQuiz, toneAfter } from '../core/quiz';
  import type { ClefMode } from '../core/staff-layout';
  import type { Theme } from '../core/theme';
  import { FEEDBACK } from './feedback';
  import Piano from './Piano.svelte';
  import Staff from './Staff.svelte';

  let { theme }: { theme: Theme } = $props();

  const CLEFS: ClefMode[] = ['treble', 'bass', 'both'];
  const feedback = $derived(FEEDBACK[theme]);
  const ringerHint = needsRingerHint();

  let mode = $state<ClefMode>('treble');
  let quiz = $state(startQuiz('treble', Math.random));
  let noteEl = $state<SVGGElement>();
  // Counts questions, so an animation that ends after the quiz moved on doesn't advance it again.
  let asked = 0;

  const target = $derived(midiOf(quiz.note.pitch));
  const name = $derived(pitchLabel(quiz.note.pitch));
  const showsAnswer = $derived(quiz.phase === 'right' || quiz.phase === 'reveal');
  const marks = $derived(
    new Map<number, 'right' | 'wrong'>([
      ...quiz.wrongKeys.map((m) => [m, 'wrong'] as const),
      ...(showsAnswer ? [[target, 'right'] as const] : []),
    ]),
  );

  // The first note; later ones enter from advance(). The note group persists, so animating it right away is safe.
  $effect(() => {
    if (noteEl) feedback.enter(noteEl);
  });

  function advance() {
    asked++;
    quiz = nextQuestion(quiz, mode, Math.random);
    if (noteEl) feedback.enter(noteEl);
  }

  function setMode(next: ClefMode) {
    mode = next;
    advance();
  }

  async function press(midi: number) {
    const before = quiz;
    quiz = answerKey(quiz, midi);
    const tone = toneAfter(before, quiz);
    if (tone !== undefined) playTone(tone);
    if (quiz.phase === before.phase || !noteEl) return;
    if (quiz.phase !== 'right') {
      feedback.wrong(noteEl);
      return;
    }
    const answered = asked;
    await feedback.right(noteEl);
    // A clef change during the animation has already moved on.
    if (asked === answered) advance();
  }
</script>

<section class="quiz" aria-label="Quiz">
  <div class="bar">
    <div class="seg" role="radiogroup" aria-label="Clef">
      {#each CLEFS as clef (clef)}
        <button
          type="button"
          role="radio"
          aria-checked={mode === clef}
          onclick={() => {
            setMode(clef);
          }}>{clef}</button
        >
      {/each}
    </div>
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
  <Staff
    {mode}
    note={quiz.note}
    mark={quiz.phase === 'right' ? 'right' : quiz.phase === 'ask' ? undefined : 'wrong'}
    revealed={quiz.phase === 'reveal'}
    bind:noteEl
  />
  <Piano range={KEY_RANGES[mode]} {marks} onpress={press} />
  <div class="continue">
    {#if quiz.phase === 'reveal'}<button type="button" onclick={advance}>Continue</button>{/if}
  </div>
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
  .seg {
    display: inline-flex;
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    overflow: hidden;
    margin-right: auto;
  }
  .seg button,
  .continue button {
    font: 700 0.95rem var(--font);
    text-transform: capitalize;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
  }
  .seg button {
    padding: 0.35rem 0.9rem;
    background: none;
    color: var(--muted);
  }
  .seg button[aria-checked='true'],
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
