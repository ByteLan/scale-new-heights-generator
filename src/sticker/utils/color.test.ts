import { describe, expect, it } from 'vitest'
import reference from '../../../scripts/fixtures/byte-style-palettes.json'
import { STICKER_PRESET_GROUPS } from '../config/presets'
import { colorToRgb } from './colorSpace'
import { colorInputValue, deriveByteStyleColors, resolveGradientStops } from './color'
import { colorToOklab } from './oklab'

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
