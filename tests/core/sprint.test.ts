import { describe, expect, test } from 'vitest';
import { DIFFICULTIES } from '../../src/core/settings';
import { pause, remaining, resume, SPRINT_SECONDS, startSprint } from '../../src/core/sprint';

describe('sprint length', () => {
  test('M6-AC1 matches the difficulty: easy 60 s, medium 50 s, hard 40 s', () => {
    expect(DIFFICULTIES.map((d) => remaining(startSprint(d, 0), 0))).toEqual([60000, 50000, 40000]);
    expect(SPRINT_SECONDS).toEqual({ easy: 60, medium: 50, hard: 40 });
  });
});

describe('sprint clock', () => {
  test('M6-AC1 counts down with the clock and stops at 0', () => {
    const clock = startSprint('hard', 1000);
    expect(remaining(clock, 11000)).toBe(30000);
    expect(remaining(clock, 999999)).toBe(0);
  });

  test('M6-AC3 pauses on visibilitychange: time while hidden is not counted', () => {
    const paused = pause(startSprint('medium', 0), 10000);
    expect(remaining(paused, 10000)).toBe(40000);
    expect(remaining(paused, 90000)).toBe(40000);
    const resumed = resume(paused, 90000);
    expect(remaining(resumed, 95000)).toBe(35000);
  });

  test('M6-AC3 pausing twice or resuming twice changes nothing', () => {
    const paused = pause(startSprint('easy', 0), 5000);
    expect(pause(paused, 9000)).toBe(paused);
    const running = resume(paused, 20000);
    expect(resume(running, 30000)).toBe(running);
  });
});
