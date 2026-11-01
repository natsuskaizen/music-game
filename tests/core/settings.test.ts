import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, migrateSettings, saveSettings } from '../../src/core/settings';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe('migrateSettings', () => {
  test('M2-AC6 anything that is not an object gives the defaults', () => {
    for (const raw of [null, undefined, 'x', 7, []]) expect(migrateSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });

  test('M2-AC6 valid fields are kept and missing ones take defaults', () => {
    expect(migrateSettings({ clef: 'bass', questionsPerSession: 0 })).toEqual({
      ...DEFAULT_SETTINGS,
      clef: 'bass',
      questionsPerSession: 0,
    });
  });

  test('M5-AC2 the quiz mode is validated and defaults to single', () => {
    expect(migrateSettings({ mode: 'sequence' }).mode).toBe('sequence');
    expect(migrateSettings({ mode: 'duet' }).mode).toBe('single');
  });

  test('M2-AC6 invalid values fall back to the default for that field', () => {
    const migrated = migrateSettings({ clef: 'alto', difficulty: 'hard', input: 5, questionsPerSession: 7 });
    expect(migrated).toEqual({ ...DEFAULT_SETTINGS, difficulty: 'hard' });
  });
});

describe('migrateSettings sound', () => {
  test('M3-AC2 sound fields are validated one by one', () => {
    const sound = { on: false, onShow: 'yes', onWrong: true, volume: 0.5, ignoreSilentSwitch: false };
    expect(migrateSettings({ sound }).sound).toEqual({
      ...DEFAULT_SETTINGS.sound,
      on: false,
      onWrong: true,
      ignoreSilentSwitch: false,
    });
    expect(migrateSettings({ sound: { volume: 1 } }).sound.volume).toBe(1);
    expect(migrateSettings({ sound: 3 }).sound).toEqual(DEFAULT_SETTINGS.sound);
  });
});

describe('loadSettings / saveSettings', () => {
  test('M2-AC6 saved settings load back', () => {
    const storage = memory();
    const settings = { ...DEFAULT_SETTINGS, difficulty: 'easy' as const, input: 'mic' };
    saveSettings(storage, settings);
    expect(loadSettings(storage)).toEqual(settings);
  });

  test('M2-AC6 empty, corrupt or unreadable storage gives the defaults', () => {
    expect(loadSettings(memory())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings({ getItem: () => '{not json' })).toEqual(DEFAULT_SETTINGS);
    expect(
      loadSettings({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  test('M2-AC6 a storage that refuses writes does not break saving', () => {
    const full = {
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => {
      saveSettings(full, DEFAULT_SETTINGS);
    }).not.toThrow();
  });
});

describe('migrateSettings micLevel', () => {
  test('M3-AC10 the mic loudness defaults to the middle level and keeps a known level', () => {
    expect(DEFAULT_SETTINGS.micLevel).toBe(0.3);
    expect(migrateSettings({ micLevel: 0.45 }).micLevel).toBe(0.45);
    expect(migrateSettings({ micLevel: 0.9 }).micLevel).toBe(0.3);
  });
});

describe('migrateSettings timer', () => {
  test('M6-AC1 the timer is off by default and keeps a stored choice', () => {
    expect(DEFAULT_SETTINGS.timer).toBe(false);
    expect(migrateSettings({ timer: true }).timer).toBe(true);
    expect(migrateSettings({ timer: 'yes' }).timer).toBe(false);
  });
});

describe('migrateSettings theme', () => {
  test('M8-AC1 the theme is Paper & ink by default and keeps a stored choice', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('paper');
    expect(migrateSettings({ theme: 'arcade' }).theme).toBe('arcade');
    expect(migrateSettings({ theme: 'neon' }).theme).toBe('paper');
  });
});

describe('migrateSettings accidentals and key', () => {
  test('M9-AC3 accidentals are off and the key is C major by default, so old settings play as before', () => {
    const old = migrateSettings({ clef: 'bass', difficulty: 'hard' });
    expect([old.accidentals, old.key]).toEqual([false, 0]);
  });

  test('M9-AC4 a stored key from 7 flats to 7 sharps or random is kept; anything else is C major', () => {
    expect(migrateSettings({ accidentals: true, key: -7 })).toMatchObject({ accidentals: true, key: -7 });
    expect(migrateSettings({ key: 'random' }).key).toBe('random');
    expect(migrateSettings({ key: 8 }).key).toBe(0);
    expect(migrateSettings({ key: '2' }).key).toBe(0);
  });
});

test('M10-AC10 accidentals on the note are off by default and only a stored boolean is kept', () => {
  expect(migrateSettings({}).accidentalsOnNote).toBe(false);
  expect(migrateSettings({ accidentalsOnNote: true }).accidentalsOnNote).toBe(true);
  expect(migrateSettings({ accidentalsOnNote: 'yes', key: 2 })).toMatchObject({
    accidentalsOnNote: false,
    key: 2,
  });
});
