import { describe, expect, it } from 'vitest'
import reference from '../../../scripts/fixtures/byte-style-palettes.json'
import { STICKER_PRESET_GROUPS } from '../config/presets'
import { colorToRgb } from './colorSpace'
import { colorInputValue, deriveByteStyleColors, resolveGradientStops } from './color'
import { colorToOklab } from './oklab'
import { randomStickerColors } from './randomPalette'

describe('resolveGradientStops', () => {
  it('passes two/three colors through unchanged', () => {
    expect(resolveGradientStops(['#111111', '#222222'])).toEqual(['#111111', '#222222'])
    expect(resolveGradientStops(['#111111', '#222222', '#333333'])).toEqual([
      '#111111',
      '#222222',
      '#333333',
    ])
  })
})

describe('CSS color input', () => {
  it.each([
    ['#9f6', '#99ff66'],
    ['#1234', '#11223344'],
    ['rgb(10, 20, 30)', '#0a141e'],
    ['RGB(100% 0% 50% / 50%)', '#ff008080'],
    ['hsl(120, 100%, 50%)', '#00ff00'],
    ['hsl(0.5turn 100% 50% / 25%)', '#00ffff40'],
    ['rgb(300 -20 128)', '#ff0080'],
    ['not-a-color', '#000000'],
  ])('normalizes %s to %s', (input, hex) => {
    expect(colorInputValue(input)).toBe(hex)
  })
})

const distance = (a: string, b: string) => {
  const x = colorToOklab(a), y = colorToOklab(b)
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

describe('deriveByteStyleColors', () => {
  it('approximates both reference gradients using two shared midpoint stops', () => {
    const errors: number[] = []
    for (const preset of STICKER_PRESET_GROUPS.字节范) {
      expect(preset.colors).toHaveLength(2)
      const palette = deriveByteStyleColors(preset.colors)
      const target = reference[preset.text as keyof typeof reference]
      const presetErrors: number[] = []
      for (const layer of ['foreground', 'outline'] as const) {
        for (let stop = 0; stop < 2; stop++) presetErrors.push(distance(palette[layer][stop], target[layer][stop]))
      }
      expect(Math.max(...presetErrors)).toBeLessThan(0.08)
      expect(presetErrors.reduce((sum, v) => sum + v, 0) / 4).toBeLessThan(0.045)
      errors.push(...presetErrors)
    }
    expect(errors.reduce((sum, v) => sum + v, 0) / errors.length).toBeLessThan(0.032)
  })

  it('keeps a visible lightness separation across each reference palette', () => {
    for (const preset of STICKER_PRESET_GROUPS.字节范) {
      const { foreground, outline } = deriveByteStyleColors(preset.colors)
      for (let stop = 0; stop < 2; stop++) {
        expect(colorToOklab(foreground[stop])[0] - colorToOklab(outline[stop])[0]).toBeGreaterThan(0.18)
      }
    }
  })

  it('reverses both derived gradients when input stops are reversed', () => {
    const colors = ['#ee8ebf', '#c65479']
    const forward = deriveByteStyleColors(colors)
    const reverse = deriveByteStyleColors([...colors].reverse())
    expect(reverse.foreground).toEqual([...forward.foreground].reverse())
    expect(reverse.outline).toEqual([...forward.outline].reverse())
  })

  it('supports single and three-stop input and keeps neutral colors neutral', () => {
    for (const colors of [['#000000'], ['#eeeeee'], ['#000000', '#888888', '#ffffff']]) {
      const palette = deriveByteStyleColors(colors)
      expect(palette.foreground).toHaveLength(colors.length)
      expect(palette.outline).toHaveLength(colors.length)
      for (const color of [...palette.foreground, ...palette.outline]) {
        const { r, g, b } = colorToRgb(color)
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(1 / 255)
      }
    }
  })
})

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

const hue = (color: string) => {
  const [, a, b] = colorToOklab(color)
  return Math.atan2(b, a) * 180 / Math.PI
}
const hueDistance = (a: string, b: string) => {
  const difference = Math.abs(hue(a) - hue(b)) % 360
  return Math.min(difference, 360 - difference)
}

describe('随机配色', () => {
  it('两种风味都支持指定色数和可重现的随机种子', () => {
    for (const flavor of ['snh', 'bs'] as const) {
      for (const count of [1, 2, 3] as const) {
        const options = { flavor, count }
        const colors = randomStickerColors('#148ded', options, seededRandom(73))
        expect(colors).toHaveLength(count)
        expect(colors).toEqual(randomStickerColors('#148ded', options, seededRandom(73)))
        for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('单色保留明显深浅跨度，中性输入不染色', () => {
    for (const color of ['#148ded', '#3587ee', '#000000', '#ffffff']) {
      const [dark, light] = resolveGradientStops([color])
      expect(colorToOklab(light)[0] - colorToOklab(dark)[0]).toBeGreaterThan(0.295)
    }
    for (const color of resolveGradientStops(['#888888'])) {
      const [, a, b] = colorToOklab(color)
      expect(Math.hypot(a, b)).toBeLessThan(0.001)
    }
  })

  it('双色能覆盖同色系、邻色与跨色相，三色能生成深色中段', () => {
    const random = seededRandom(184)
    const gaps: number[] = []
    let hasDeepMiddle = false
    for (let sample = 0; sample < 200; sample++) {
      const pair = randomStickerColors('#148ded', { count: 2 }, random)
      gaps.push(hueDistance(pair[0], pair[1]))
      const tones = randomStickerColors('#148ded', { count: 3 }, random).map(color => colorToOklab(color)[0])
      hasDeepMiddle ||= tones[1] < Math.min(tones[0], tones[2]) - 0.15
    }
    expect(gaps.some(gap => gap < 15)).toBe(true)
    expect(gaps.some(gap => gap > 20 && gap < 80)).toBe(true)
    expect(gaps.some(gap => gap > 130)).toBe(true)
    expect(hasDeepMiddle).toBe(true)
  })

  it('字节范随机色经过最终字面提亮后，也不会变成近白色', () => {
    const random = seededRandom(73)
    for (const count of [1, 2, 3] as const) {
      for (let sample = 0; sample < 300; sample++) {
        const colors = randomStickerColors('#148ded', { flavor: 'bs', count }, random)
        const { foreground, outline } = deriveByteStyleColors(resolveGradientStops(colors, 'bs'))
        for (const [index, color] of foreground.entries()) {
          const [l, a, b] = colorToOklab(color)
          expect(l).toBeLessThanOrEqual(0.921)
          expect(l <= 0.841 || Math.hypot(a, b) >= 0.044).toBe(true)
          expect(l - colorToOklab(outline[index])[0]).toBeGreaterThan(0.18)
        }
      }
    }
  })
})
