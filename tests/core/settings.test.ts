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
