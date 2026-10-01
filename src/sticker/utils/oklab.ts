import { convertRgbToOklab, convertOklabToRgb, serializeHex } from 'culori/fn'
import { colorToRgb, clampUnit } from './colorSpace'

export type Oklab = readonly [lightness: number, a: number, b: number]

// 允许 sRGB 边界的浮点误差；16 次二分的精度已超过最终 8 位 RGB 输出。
const GAMUT_TOLERANCE = 1e-7
const GAMUT_SEARCH_STEPS = 16

export function colorToOklab(color: string): Oklab {
  const converted = convertRgbToOklab(colorToRgb(color))
  return [converted.l, converted.a, converted.b]
}

function rgb([l, a, b]: Oklab): readonly number[] {
  const converted = convertOklabToRgb({ l, a, b })
  return [converted.r, converted.g, converted.b]
}

/** 保持明度和色相，通过缩减色度映射到 sRGB 色域。 */
export function oklabToColor([lightness, a, b]: Oklab): string {
  const L = clampUnit(lightness)
  const inGamut = (channels: readonly number[]) =>
    channels.every((v) => v >= -GAMUT_TOLERANCE && v <= 1 + GAMUT_TOLERANCE)
  let channels = rgb([L, a, b])
  if (!inGamut(channels)) {
    let lower = 0
    let upper = 1
    for (let step = 0; step < GAMUT_SEARCH_STEPS; step++) {
      const scale = (lower + upper) / 2
      if (inGamut(rgb([L, a * scale, b * scale]))) lower = scale
      else upper = scale
    }
    channels = rgb([L, a * lower, b * lower])
  }
  return serializeHex({ mode: 'rgb', r: channels[0], g: channels[1], b: channels[2] })
}
