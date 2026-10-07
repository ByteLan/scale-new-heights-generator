export interface FontFaceSource {
  source: string
  unicodeRange: string
}

/** Bound CDN waits so an unreachable font service can fall back locally. */
export const FONT_CDN_TIMEOUT_MS = 5_000

export async function withFontLoadTimeout<T>(loading: Promise<T>, timeoutMs = FONT_CDN_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Font CDN timed out')), timeoutMs)
  })
  try {
    return await Promise.race([loading, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

export function getFontFaceSet(): FontFaceSet | undefined {
  return typeof document !== 'undefined'
    ? document.fonts
    : (globalThis as unknown as { fonts?: FontFaceSet }).fonts
}
