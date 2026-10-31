/** M0-AC7 seed: duplicated block on purpose (to be reverted). */
export function totala(values: number[]): number {
  let sum = 0;
  for (const value of values) {
    if (value > 0) sum += value * 2;
    else sum -= value / 2;
  }
  const average = values.length > 0 ? sum / values.length : 0;
  const rounded = Math.round(average * 100) / 100;
  return rounded > 1000 ? 1000 : rounded;
}
