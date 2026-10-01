import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { dilateCanvasOutwardRound, erodeCanvasInward, fillEnclosedRegionsCanvas } from './paint'

describe('dilateCanvasOutwardRound', () => {
  it('保留圆形距离和描边外侧的抗锯齿过渡', () => {
    const canvas = createCanvas(5, 5)
    const context = canvas.getContext('2d')
    context.fillRect(2, 2, 1, 1)

    dilateCanvasOutwardRound(canvas as unknown as OffscreenCanvas, 1)
    const alpha = context.getImageData(0, 0, 5, 5).data
    expect(alpha[(2 * 5 + 1) * 4 + 3]).toBe(255)
    expect(alpha[(1 * 5 + 1) * 4 + 3]).toBe(Math.round((2 - Math.SQRT2) * 255))
    expect(alpha[2 * 5 * 4 + 3]).toBe(0)
  })

  it('不会填满宽于两侧描边的间隙', () => {
    const canvas = createCanvas(9, 1)
    const context = canvas.getContext('2d')
    context.fillRect(0, 0, 3, 1)
    context.fillRect(6, 0, 3, 1)

    dilateCanvasOutwardRound(canvas as unknown as OffscreenCanvas, 1)
    expect(context.getImageData(4, 0, 1, 1).data[3]).toBe(0)
  })
})

describe('fillEnclosedRegionsCanvas', () => {
  it('填充封闭字腔和内侧抗锯齿带，保留外侧半透明边缘', () => {
    const canvas = createCanvas(7, 7)
    const context = canvas.getContext('2d')
    context.fillRect(1, 1, 5, 5)
    context.clearRect(2, 2, 3, 3)
    context.fillStyle = 'rgba(255, 255, 255, 0.5)'
    context.fillRect(2, 2, 3, 3)
    context.clearRect(3, 3, 1, 1)
    context.fillRect(0, 1, 1, 5)
    const outerAlpha = context.getImageData(0, 3, 1, 1).data[3]

    fillEnclosedRegionsCanvas(canvas as unknown as OffscreenCanvas)
    expect(context.getImageData(3, 3, 1, 1).data[3]).toBe(255)
    expect(context.getImageData(2, 3, 1, 1).data[3]).toBe(255)
    expect(context.getImageData(0, 3, 1, 1).data[3]).toBe(outerAlpha)
    expect(context.getImageData(0, 0, 1, 1).data[3]).toBe(0)
  })

  it('保留与画布边缘连通的开口', () => {
    const canvas = createCanvas(7, 7)
    const context = canvas.getContext('2d')
    context.fillRect(1, 1, 5, 5)
    context.clearRect(2, 2, 3, 3)
    context.clearRect(5, 3, 1, 1)

    fillEnclosedRegionsCanvas(canvas as unknown as OffscreenCanvas)
    expect(context.getImageData(3, 3, 1, 1).data[3]).toBe(0)
    expect(context.getImageData(5, 3, 1, 1).data[3]).toBe(0)
  })
})

// 逐像素穷举距离作为独立参照，覆盖透明阈值和抗锯齿像素。
describe('erodeCanvasInward', () => {
  it('matches four-connected erosion without treating canvas edges as background', () => {
    let seed = 73
    for (const [width, height] of [
      [1, 1],
      [1, 13],
      [17, 1],
      [9, 11],
    ]) {
      for (const mode of ['opaque', 'transparent', 'mixed']) {
        const source = new Uint8ClampedArray(width * height * 4)
        for (let i = 0; i < width * height; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
          source.set(
            [
              91,
              123,
              207,
              mode === 'opaque'
                ? 255
                : mode === 'transparent'
                  ? 0
                  : [0, 16, 17, 128, 255][seed % 5],
            ],
            i * 4,
          )
        }
        for (const radius of [0, 0.1, 1, 2.5, 20]) {
          const canvas = createCanvas(width, height)
          const ctx = canvas.getContext('2d')
          const image = ctx.createImageData(width, height)
          image.data.set(source)
          ctx.putImageData(image, 0, 0)
          const before = ctx.getImageData(0, 0, width, height)
          const expected = new Uint8ClampedArray(before.data)
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4 + 3
              if (before.data[i] <= 16 || radius <= 0) continue
              let distance = Infinity
              for (let yy = 0; yy < height; yy++) {
                for (let xx = 0; xx < width; xx++) {
                  if (before.data[(yy * width + xx) * 4 + 3] <= 16) {
                    distance = Math.min(distance, Math.abs(x - xx) + Math.abs(y - yy))
                  }
                }
              }
              if (distance <= Math.ceil(radius)) expected[i] = 0
            }
          }
          erodeCanvasInward(canvas as unknown as OffscreenCanvas, radius)
          const actual = ctx.getImageData(0, 0, width, height).data
          // Canvas premultiplication discards RGB under zero alpha.
          expect(Array.from(actual).filter((_, i) => i % 4 === 3)).toEqual(
            Array.from(expected).filter((_, i) => i % 4 === 3),
          )
        }
      }
    }
  })
})
