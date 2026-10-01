import { getContext } from '../../shared/render/canvas'
import type { GradientExtent } from './types'

export function createGradient(
  context: OffscreenCanvasRenderingContext2D,
  angleDeg: number,
  stops: string[],
  extent: GradientExtent,
): CanvasGradient {
  const angle = ((angleDeg - 90) * Math.PI) / 180
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const gradient = context.createLinearGradient(
    dx * extent.startProjection,
    dy * extent.startProjection,
    dx * extent.endProjection,
    dy * extent.endProjection,
  )

  const list = stops.length > 0 ? stops : ['#000000']
  if (list.length === 1) {
    gradient.addColorStop(0, list[0])
    gradient.addColorStop(1, list[0])
  } else {
    list.forEach((color, index) => {
      gradient.addColorStop(index / (list.length - 1), color)
    })
  }
  return gradient
}

/** 按可见像素中心的投影确定渐变两端，使端点颜色完整显示。 */
export function gradientExtentFromCanvas(
  canvas: OffscreenCanvas,
  angleDeg: number,
): GradientExtent {
  const { width, height } = canvas
  const ctx = getContext(canvas)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  const angle = ((angleDeg - 90) * Math.PI) / 180
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let startProjection = Number.POSITIVE_INFINITY
  let endProjection = Number.NEGATIVE_INFINITY

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      const projection = (x + 0.5) * dx + (y + 0.5) * dy
      startProjection = Math.min(startProjection, projection)
      endProjection = Math.max(endProjection, projection)
    }
  }

  if (!Number.isFinite(startProjection) || endProjection <= startProjection) {
    const fallbackEnd = Math.abs(dx) * Math.max(1, width) + Math.abs(dy) * Math.max(1, height)
    return { startProjection: 0, endProjection: fallbackEnd }
  }

  return { startProjection, endProjection }
}
