export function isCjkGrapheme(grapheme: string): boolean {
  return /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(grapheme)
}

export function isCommonHanGrapheme(grapheme: string): boolean {
  return /^[\u3007\u4E00-\u9FFF]$/u.test(grapheme)
}

export function isWesternWordGrapheme(grapheme: string): boolean {
  return /\p{Script=Latin}|\p{Number}/u.test(grapheme)
}

export function isWordSymbolGrapheme(grapheme: string): boolean {
  return /['’._:+/@#&%-]/u.test(grapheme)
}
