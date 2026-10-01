import { STICKER_PRESET_LIST } from '../config/presets'
import type { StickerFlavor } from '../config/defaults'
import { deriveByteStyleColors, resolveGradientStops } from './color'
import { colorToOklab, oklabToColor } from './oklab'

export interface RandomStickerColorsOptions {
  flavor?: StickerFlavor
  /** 不指定时随机选择 1–3 色；两种风味共用同一生成流程 */
  count?: 1 | 2 | 3
}

// 模式来自已有预设，保留端点的相对明度、色度和色相差，不独立抽取不相关的颜色。
const PATTERNS = STICKER_PRESET_LIST.map(preset => ({
  flavor: preset.flavor,
  stops: preset.colors.map(colorToOklab),
}))
const RANDOM_PALETTE = {
  singleProbability: 0.5,
  pairCumulativeProbability: 0.9,
  minHueChange: 28,
  hueAttempts: 3,
  lightnessJitter: 0.025,
  chromaJitter: 0.10,
  byteMinLightness: 0.50,
  byteMaxLightness: 0.80,
  byteMaxForegroundLightness: 0.92,
  bytePaleForegroundLightness: 0.84,
  byteMinForegroundChroma: 0.045,
  byteToneStep: 0.02,
  byteToneAttempts: 12,
} as const

const hue = (a: number, b: number) => Math.atan2(b, a)

function randomCount(random: () => number): 1 | 2 | 3 {
  const roll = random()
  if (roll < RANDOM_PALETTE.singleProbability) return 1
  return roll < RANDOM_PALETTE.pairCumulativeProbability ? 2 : 3
}

function pickHue(base: string, random: () => number): number {
  const [, a, b] = colorToOklab(base)
  const previous = hue(a, b)
  let next = random() * Math.PI * 2
  for (let attempt = 0; attempt < RANDOM_PALETTE.hueAttempts; attempt++) {
    const distance = Math.abs(Math.atan2(Math.sin(next - previous), Math.cos(next - previous)))
    if (distance * 180 / Math.PI > RANDOM_PALETTE.minHueChange) break
    next = random() * Math.PI * 2
  }
  return next
}

// 检查最终字面，而不是只限制输入 HSL。整体降低基准明度，保留渐变两端的关系。
function fitByteForeground(colors: string[]): string[] {
  let fitted = colors
  for (let attempt = 0; attempt < RANDOM_PALETTE.byteToneAttempts; attempt++) {
    const { foreground } = deriveByteStyleColors(resolveGradientStops(fitted, 'bs'))
    const tones = foreground.map(colorToOklab)
    if (tones.every(([l, a, b]) =>
      l <= RANDOM_PALETTE.byteMaxForegroundLightness &&
      (l <= RANDOM_PALETTE.bytePaleForegroundLightness ||
        Math.hypot(a, b) >= RANDOM_PALETTE.byteMinForegroundChroma),
    )) return fitted
    fitted = fitted.map(color => {
      const [l, a, b] = colorToOklab(color)
      return oklabToColor([l - RANDOM_PALETTE.byteToneStep, a, b])
    })
  }
  return fitted
}

export function randomStickerColors(
  base: string,
  { flavor = 'snh', count: requestedCount }: RandomStickerColorsOptions = {},
  random: () => number = Math.random,
): string[] {
  const count = requestedCount ?? randomCount(random)
  // 字节范暂无三色预设，沿用三色色相关系，再约束到它的基准明度范围。
  const patterns = PATTERNS.filter(pattern =>
    pattern.stops.length === (count === 1 ? 2 : count) &&
    pattern.flavor === (flavor === 'bs' && count === 3 ? 'snh' : flavor),
  )
  const pattern = patterns[Math.floor(random() * patterns.length)]
  const rotation = pickHue(base, random) - hue(pattern.stops[0][1], pattern.stops[0][2])
  const lightnessOffset = (random() * 2 - 1) * RANDOM_PALETTE.lightnessJitter
  const chromaScale = 1 + (random() * 2 - 1) * RANDOM_PALETTE.chromaJitter
  const stops = count === 1 ? [pattern.stops[0]] : pattern.stops
  const colors = stops.map(([l, a, b]) => {
    const lightness = flavor === 'bs'
      ? Math.max(RANDOM_PALETTE.byteMinLightness, Math.min(RANDOM_PALETTE.byteMaxLightness, l + lightnessOffset))
      : l + lightnessOffset
    const chroma = Math.hypot(a, b) * chromaScale
    const angle = hue(a, b) + rotation
    return oklabToColor([lightness, chroma * Math.cos(angle), chroma * Math.sin(angle)])
  })
  return flavor === 'bs' ? fitByteForeground(colors) : colors
}

// 保留已有调用方式；网页和新的 SDK 调用统一使用 randomStickerColors。
export function randomVividColors(base: string, random: () => number = Math.random): string[] {
  return randomStickerColors(base, { flavor: 'snh' }, random)
}
