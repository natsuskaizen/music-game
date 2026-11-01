// Saved settings (design §9): small, read synchronously at startup, kept in localStorage.
// `migrateSettings` makes any stored value safe, so an app update or a hand-edited value never breaks the app.
import { KEY_SIGNATURES, type KeyChoice } from './key-signature';
import { DEFAULT_MIC_LEVEL, MIC_LEVELS } from './listen';
import type { Difficulty } from './ranges';
import { DEFAULT_SOUND, VOLUMES, type SoundSettings } from './sound';
import type { ClefMode } from './staff-layout';
import { THEME_IDS, type Theme } from './theme';

export const CLEFS: ClefMode[] = ['treble', 'bass', 'both'];
/** One note at a time, or a run of notes read in order (design §8.2). */
export type QuizMode = 'single' | 'sequence';
export const MODES: QuizMode[] = ['single', 'sequence'];
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
/** Questions per session; 0 is endless (design §14). */
export const SESSION_LENGTHS = [10, 20, 50, 0];

/** What the person chose on Home and in Settings. `v` is the format version for later migrations. */
export interface Settings {
  v: 1;
  clef: ClefMode;
  mode: QuizMode;
  difficulty: Difficulty;
  /** Id of the default answer input (design §3.4). */
  input: string;
  questionsPerSession: number;
  sound: SoundSettings;
  /** How loud a note must be for the mic to hear it, one of `MIC_LEVELS`. */
  micLevel: number;
  /** Race the clock: one countdown for the whole session (design §14). Off by default. */
  timer: boolean;
  /** Look and feel (design §14). */
  theme: Theme;
  /** Ask sharps, flats and naturals written against the key (M9). Off by default, so play is as before. */
  accidentals: boolean;
  /** Key signature: a fixed one (0 is none) or a random one per session (M9). */
  key: KeyChoice;
  /** Write each sharp or flat beside its note instead of in a key signature (M10-10). Off by default. */
  accidentalsOnNote: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  clef: 'treble',
  mode: 'single',
  difficulty: 'medium',
  input: 'piano',
  questionsPerSession: 20,
  sound: DEFAULT_SOUND,
  micLevel: DEFAULT_MIC_LEVEL,
  timer: false,
  theme: 'paper',
  accidentals: false,
  key: 0,
  accidentalsOnNote: false,
};

const KEY_CHOICES: KeyChoice[] = [...KEY_SIGNATURES, 'random'];

const KEY = 'settings';

// The stored boolean, else the default.
function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function migrateSound(raw: unknown): SoundSettings {
  const stored = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_SOUND;
  return {
    on: flag(stored.on, d.on),
    onShow: flag(stored.onShow, d.onShow),
    onWrong: flag(stored.onWrong, d.onWrong),
    volume: oneOf(stored.volume, VOLUMES, d.volume),
    ignoreSilentSwitch: flag(stored.ignoreSilentSwitch, d.ignoreSilentSwitch),
  };
}

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
    mode: oneOf(stored.mode, MODES, d.mode),
    difficulty: oneOf(stored.difficulty, DIFFICULTIES, d.difficulty),
    input: typeof stored.input === 'string' ? stored.input : d.input,
    questionsPerSession: oneOf(stored.questionsPerSession, SESSION_LENGTHS, d.questionsPerSession),
    sound: migrateSound(stored.sound),
    micLevel: oneOf(stored.micLevel, MIC_LEVELS, d.micLevel),
    timer: flag(stored.timer, d.timer),
    theme: oneOf(stored.theme, THEME_IDS, d.theme),
    accidentals: flag(stored.accidentals, d.accidentals),
    key: oneOf(stored.key, KEY_CHOICES, d.key),
    accidentalsOnNote: flag(stored.accidentalsOnNote, d.accidentalsOnNote),
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
