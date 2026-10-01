import { computeSquaredDistanceTransform } from './distanceTransform'
import { getContext } from '../../shared/render/canvas'

/** 填充封闭字腔，并补齐内侧抗锯齿区域，避免合成渐变时留下白缝。 */
export function fillEnclosedRegionsCanvas(canvas: OffscreenCanvas): void {
  const { width, height } = canvas
  const ctx = getContext(canvas)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const total = width * height

  // 从四条边向内遍历，标记与外部连通的背景像素。
  const exterior = new Uint8Array(total)
  const stack = new Int32Array(total)
  let stackTop = -1

  const enqueue = (i: number) => {
    if (data[i * 4 + 3] <= 16 && exterior[i] === 0) {
      exterior[i] = 1
      stack[++stackTop] = i
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (stackTop >= 0) {
    const i = stack[stackTop--]
    const x = i % width
    const y = (i - x) / width
    if (x > 0) enqueue(i - 1)
    if (x < width - 1) enqueue(i + 1)
    if (y > 0) enqueue(i - width)
    if (y < height - 1) enqueue(i + width)
  }

  // 将封闭区域中的透明像素填为不透明白色。
  let modified = false
  const filled = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    if (data[i * 4 + 3] <= 16 && exterior[i] === 0) {
      const off = i * 4
      data[off] = 255
      data[off + 1] = 255
      data[off + 2] = 255
      data[off + 3] = 255
      filled[i] = 1
      modified = true
    }
  }

  if (modified) {
    // 从已填像素补齐内侧抗锯齿带，遇到不透明笔画就停止，保留外侧边缘。
    stackTop = -1
    for (let i = 0; i < total; i += 1) {
      if (filled[i]) stack[++stackTop] = i
    }
    const promote = (j: number) => {
      const a = data[j * 4 + 3]
      if (a > 16 && a < 255 && filled[j] === 0) {
        data[j * 4 + 3] = 255
        filled[j] = 1
        stack[++stackTop] = j
      }
    }
    while (stackTop >= 0) {
      const i = stack[stackTop--]
      const x = i % width
      const y = (i - x) / width
      if (x > 0) promote(i - 1)
      if (x < width - 1) promote(i + 1)
      if (y > 0) promote(i - width)
      if (y < height - 1) promote(i + width)
    }
    ctx.putImageData(imageData, 0, 0)
  }
}

/** 按四邻域距离向内收缩；两次扫描计算距离，画布边缘不视为透明背景。 */
export function erodeCanvasInward(canvas: OffscreenCanvas, radius: number): void {
  if (radius <= 0) return
  const { width, height } = canvas
  const ctx = getContext(canvas)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const total = width * height

  const dist = new Uint16Array(total)
  const intRadius = Math.ceil(radius)
  // Uint16 最大值代表未遇到背景，累加距离时饱和到该值。
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      const i = row + x
      if (data[i * 4 + 3] <= 16) continue
      const left = x > 0 ? dist[i - 1] : 65535
      const top = y > 0 ? dist[i - width] : 65535
      dist[i] = Math.min(65535, Math.min(left, top) + 1)
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width
    for (let x = width - 1; x >= 0; x--) {
      const i = row + x
      if (dist[i] === 0) continue
      const right = x + 1 < width ? dist[i + 1] : 65535
      const bottom = y + 1 < height ? dist[i + width] : 65535
      dist[i] = Math.min(dist[i], Math.min(right, bottom) + 1)
    }
  }

  let modified = false
  for (let i = 0; i < total; i++) {
    if (dist[i] <= intRadius && data[i * 4 + 3] > 16) {
      data[i * 4 + 3] = 0
      modified = true
    }
  }
  if (modified) {
    ctx.putImageData(imageData, 0, 0)
  }
}

export function dilateCanvasOutwardRound(
  canvas: OffscreenCanvas,
  radius: number,
  alphaThreshold = 16,
  feather = 1,
): void {
  if (radius <= 0) return
  const { width, height } = canvas
  const ctx = getContext(canvas)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const total = width * height
  const mask = new Uint8ClampedArray(total)

  for (let index = 0; index < total; index += 1) {
    mask[index] = data[index * 4 + 3] > alphaThreshold ? 255 : 0
  }

  const distances = computeSquaredDistanceTransform({ width, height, data: mask })
  const featherEnd = radius + feather

  for (let index = 0; index < total; index += 1) {
    const distance = Math.sqrt(distances[index])
    if (distance > featherEnd) continue

    const offset = index * 4
    const alpha = distance <= radius ? 255 : Math.round(((featherEnd - distance) / feather) * 255)
    data[offset] = 255
    data[offset + 1] = 255
    data[offset + 2] = 255
    data[offset + 3] = Math.max(data[offset + 3], alpha)
  }

  ctx.putImageData(imageData, 0, 0)
}
