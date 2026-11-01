// Immutable list helpers for editor state.

export const newId = () => crypto.randomUUID();

export function replaceAt<T>(list: readonly T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function move<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** Item limits, mirroring the resume schema. */
export const LIMITS = {
  links: 10,
  experience: 30,
  highlights: 10,
  education: 15,
  skills: 60,
  projects: 30,
  technologies: 20,
  languages: 10,
  certificates: 30,
  customSections: 5,
  customItems: 20,
} as const;
