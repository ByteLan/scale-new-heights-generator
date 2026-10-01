import { encodeGainMap, sRGBToLinear, writeJpegGainMap, type HdrifyImage } from 'hdrify'
import { ENABLED_FLASH_STOPS } from '../config/hdr'
import { getContext } from '../render/canvas'

export interface UltraHdrJpegOptions {
  flashStops?: number
  quality?: number
}

/** Ultra HDR JPEG 的 MIME 类型 */
export const ULTRA_HDR_JPEG_MIME = 'image/jpeg'
/** Ultra HDR JPEG 的下载扩展名 */
export const ULTRA_HDR_JPEG_EXTENSION = 'jpg'
/** 开始对近不透明像素施加 HDR 增益的 alpha 阈值 */
const HDR_BOOST_ALPHA_START = 0.65
/** 完全施加 HDR 增益的 alpha 阈值 */
const HDR_BOOST_ALPHA_END = 0.95

export function encodeUltraHdrJpegBytes(
  canvas: OffscreenCanvas,
  options: UltraHdrJpegOptions = {},
): Uint8Array<ArrayBuffer> {
  const flashStops = resolveFlashStops(options.flashStops)
  const headroom = 2 ** flashStops
  const image = canvasToHdrImage(canvas, { headroom })
  const encoding = encodeGainMap(image, {
    maxContentBoost: headroom,
    minContentBoost: 1,
    toneMapping: 'neutral',
  })
  return new Uint8Array(
    writeJpegGainMap(encoding, {
      quality: options.quality ?? 94,
      format: 'ultrahdr',
    }),
  )
}

export function encodeUltraHdrJpegFromCanvas(
  canvas: OffscreenCanvas,
  options: UltraHdrJpegOptions = {},
): Blob {
  return new Blob([encodeUltraHdrJpegBytes(canvas, options)], { type: ULTRA_HDR_JPEG_MIME })
}

function canvasToHdrImage(
  canvas: OffscreenCanvas,
  options: {
    headroom: number
  },
): HdrifyImage {
  const { width, height } = canvas
  const source = getContext(canvas).getImageData(0, 0, width, height).data
  const data = new Float32Array(width * height * 4)

  for (let index = 0; index < source.length; index += 4) {
    const alpha = source[index + 3] / 255
    const sr = (source[index] / 255) * alpha + (1 - alpha)
    const sg = (source[index + 1] / 255) * alpha + (1 - alpha)
    const sb = (source[index + 2] / 255) * alpha + (1 - alpha)
    const lr = sRGBToLinear(sr)
    const lg = sRGBToLinear(sg)
    const lb = sRGBToLinear(sb)
    const boost = 1 + contentBoostMask(alpha) * (options.headroom - 1)

    data[index] = lr * boost
    data[index + 1] = lg * boost
    data[index + 2] = lb * boost
    data[index + 3] = 1
  }

  return {
    width,
    height,
    data,
    linearColorSpace: 'linear-rec709',
  }
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function contentBoostMask(alpha: number): number {
  // JPEG 的透明区域合成到白底，只增强近不透明内容，避免抗锯齿边缘泛白。
  return smoothstep(HDR_BOOST_ALPHA_START, HDR_BOOST_ALPHA_END, alpha)
}

function resolveFlashStops(stops: number | undefined): number {
  if (stops === undefined || !Number.isFinite(stops)) return ENABLED_FLASH_STOPS
  return stops
}
