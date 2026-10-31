// The input registry (design §3.4): inputs add themselves once, and the quiz and Settings look them up by id.
import type { InputMethod } from './types';

const inputs = new Map<string, InputMethod>();

/** Adds an input. Ids are stored in settings, so registering one twice is a bug, not an update. */
export function register(input: InputMethod): void {
  if (inputs.has(input.id)) throw new Error(`Input "${input.id}" is already registered`);
  inputs.set(input.id, input);
}

/** Every input that works on this device, in registration order. */
export function available(): InputMethod[] {
  return [...inputs.values()].filter((input) => input.isAvailable());
}

/** The input with this id, or the first available one when it's missing or unavailable (e.g. an old setting). */
export function inputById(id: string): InputMethod {
  const input = inputs.get(id);
  if (input?.isAvailable()) return input;
  const fallback = available()[0];
  if (!fallback) throw new Error('No answer input is available');
  return fallback;
}
