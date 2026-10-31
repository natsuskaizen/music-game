// Saved settings (design §9): small, read synchronously at startup, kept in localStorage.
// `migrateSettings` makes any stored value safe, so an app update or a hand-edited value never breaks the app.
import type { Difficulty } from './ranges';
import type { ClefMode } from './staff-layout';

export const CLEFS: ClefMode[] = ['treble', 'bass', 'both'];
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
/** Questions per session; 0 is endless (design §14). */
export const SESSION_LENGTHS = [10, 20, 50, 0];

/** What the person chose on Home and in Settings. `v` is the format version for later migrations. */
export interface Settings {
  v: 1;
  clef: ClefMode;
  difficulty: Difficulty;
  /** Id of the default answer input (design §3.4). */
  input: string;
  questionsPerSession: number;
}

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  clef: 'treble',
  difficulty: 'medium',
  input: 'piano',
  questionsPerSession: 20,
};

const KEY = 'settings';

// The stored value if it is one of `allowed`, else the default.
function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

/** Turns anything read from storage into valid settings: known fields are checked, the rest take defaults. */
export function migrateSettings(raw: unknown): Settings {
  const stored = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_SETTINGS;
  return {
    v: 1,
    clef: oneOf(stored.clef, CLEFS, d.clef),
    difficulty: oneOf(stored.difficulty, DIFFICULTIES, d.difficulty),
    input: typeof stored.input === 'string' ? stored.input : d.input,
    questionsPerSession: oneOf(stored.questionsPerSession, SESSION_LENGTHS, d.questionsPerSession),
  };
}

/** The saved settings, or the defaults when nothing is saved or storage is unreadable (e.g. private mode). */
export function loadSettings(storage: Pick<Storage, 'getItem'>): Settings {
  try {
    return migrateSettings(JSON.parse(storage.getItem(KEY) ?? 'null'));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saves settings for the next launch. A full or blocked storage is ignored: the app still works unsaved. */
export function saveSettings(storage: Pick<Storage, 'setItem'>, settings: Settings): void {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Settings then last only for this visit.
  }
}
