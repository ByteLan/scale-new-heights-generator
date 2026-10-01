export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type TextRenderInput<T> = DeepPartial<T> | string

export function normalizeTextRenderInput<T>(
  input: TextRenderInput<T>,
  normalize: (value: unknown) => T,
): T {
  return normalize(typeof input === 'string' ? { text: input } : input)
}

export function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), ({ segment }) => segment)
  }

  return Array.from(text)
}
