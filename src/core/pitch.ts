export function trebleMidi(letter: string, octave: number): number {
  const steps: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return (octave + 1) * 12 + (steps[letter] ?? 0);
}

export function bassMidi(letter: string, octave: number): number {
  const steps: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return (octave + 1) * 12 + (steps[letter] ?? 0);
}
