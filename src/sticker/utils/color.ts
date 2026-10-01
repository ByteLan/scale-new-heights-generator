import { colorToOklab, oklabToColor, type Oklab } from './oklab'
import { colorToHsl, colorToRgb, hslToRgb, rgbToHex } from './colorSpace'
import { BYTE_STYLE_CALIBRATION } from '../config/byteStyleCalibration'

function adjustHsl(base: string, adjustment: { lightness: number; saturation: number }): string {
  const color = colorToHsl(base)
  return rgbToHex(
    hslToRgb({
      ...color,
      l: color.l + adjustment.lightness,
      s: color.s + adjustment.saturation,
    }),
  )
}

// 同色相的深端：轻微降低饱和度，避免高饱和浅色变深后刺眼。
export function deriveDepthColor(base: string): string {
  return adjustHsl(base, { lightness: -0.12, saturation: -0.05 })
}

// 同色相的浅端：略增饱和度，避免提亮后发灰。
export function deriveHighlightColor(base: string): string {
  return adjustHsl(base, { lightness: 0.06, saturation: 0.03 })
}

// 单色补出深、浅两端；双色和三色保留用户设置。
export function resolveGradientStops(colors: string[]): string[] {
  if (colors.length <= 1) {
    const base = colors[0] ?? '#76baf4'
    return [deriveDepthColor(base), deriveHighlightColor(base)]
  }
  return colors
}

export function colorInputValue(color: string): string {
  return rgbToHex(colorToRgb(color))
}

// 通道级压暗：按 (1-amount) 缩放 RGB。用于 snh 边缘轮廓加深。
export function darken(color: string, amount: number): string {
  const { r, g, b } = colorToRgb(color)
  const scale = (channel: number) => {
    const byte = Math.round(channel * 255)
    return Math.max(0, Math.min(255, Math.round(byte * (1 - amount))))
  }
  return `rgb(${scale(r)}, ${scale(g)}, ${scale(b)})`
}

/** 以基准色为中点，在 Oklab 中拆出文字和轮廓的明度、色度差。
 * 邻色参与校准，使双色渐变两端保持协调，无需为每个预设维护独立规则。 */
export function deriveByteStyleColors(colors: string[]): {
  foreground: string[]
  outline: string[]
} {
  const stops = colors.map(colorToOklab)
  const foreground: string[] = []
  const outline: string[] = []
  for (const [index, color] of stops.entries()) {
    const previous = stops[index - 1]
    const next = stops[index + 1]
    const neighbor: Oklab =
      previous && next
        ? [(previous[0] + next[0]) / 2, (previous[1] + next[1]) / 2, (previous[2] + next[2]) / 2]
        : (previous ?? next ?? color)
    const features = [1, ...color, ...neighbor.map((value, channel) => value - color[channel])]
    const split = BYTE_STYLE_CALIBRATION.split.map((row) =>
      row.reduce((sum, value, channel) => sum + value * features[channel], 0),
    )
    // 保留可见的明度差，同时避免灰色输入染上彩色。
    const { minLightnessSplit, maxLightnessSplit, neutralChroma } = BYTE_STYLE_CALIBRATION
    const lightness = Math.max(minLightnessSplit, Math.min(maxLightnessSplit, split[0]))
    const chromaWeight = Math.min(1, Math.hypot(color[1], color[2]) / neutralChroma)
    const a = split[1] * chromaWeight
    const b = split[2] * chromaWeight
    foreground.push(oklabToColor([color[0] + lightness, color[1] + a, color[2] + b]))
    outline.push(oklabToColor([color[0] - lightness, color[1] - a, color[2] - b]))
  }
  return { foreground, outline }
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return Math.min(diff, 360 - diff)
}

// 直接随机色相；尽量避开与当前色过近，避免连续点击几乎没变化。
function pickAwayHue(base: string, random: () => number): number {
  const h = Math.round(colorToHsl(base).h ?? 0)
  let hue = random() * 360
  for (let attempt = 0; attempt < 3 && hueDistance(hue, h) <= 28; attempt += 1) {
    hue = random() * 360
  }
  return hue
}

function randomVividColor(base: string, random: () => number = Math.random): string {
  const hue = pickAwayHue(base, random)
  return rgbToHex(
    hslToRgb({
      mode: 'hsl',
      h: ((hue % 360) + 360) % 360,
      s: 0.72 + random() * 0.18,
      l: 0.56 + random() * 0.1,
    }),
  )
}

function randomColorCount(random: () => number): 1 | 2 | 3 {
  const roll = random()
  if (roll < 0.5) return 1
  if (roll < 0.9) return 2
  return 3
}

// 勇攀高峰：默认模式，随机 1~3 个鲜亮颜色；1 个最多，3 个最少。
export function randomVividColors(base: string, random: () => number = Math.random): string[] {
  const colors: string[] = []
  const count = randomColorCount(random)
  let seed = base

  for (let index = 0; index < count; index += 1) {
    const color = randomVividColor(seed, random)
    colors.push(color)
    seed = color
  }

  return colors
}

// 字节范：一对同色系基准色；渲染时再分别派生深轮廓和浅前景。
export function randomGradientPair(
  base: string,
  random: () => number = Math.random,
): [string, string] {
  const hue = pickAwayHue(base, random)
  const hueOffset = (random() < 0.5 ? -1 : 1) * (16 + random() * 18)
  const saturation = 0.96 + random() * 0.16

  const make = (offset: number, lightness: number) =>
    rgbToHex(
      hslToRgb({
        mode: 'hsl',
        h: (((hue + offset) % 360) + 360) % 360,
        s: saturation,
        l: lightness,
      }),
    )

  return [make(0, 0.56 + random() * 0.16), make(hueOffset, 0.56 + random() * 0.16)]
}
