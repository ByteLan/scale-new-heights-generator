import type { Canvas } from '@napi-rs/canvas'
import type { CanvasRuntime } from './runtime'

type NapiCanvasRuntime = Required<CanvasRuntime>

let runtimePromise: Promise<NapiCanvasRuntime> | null = null

async function importNapiCanvas() {
  try {
    return await import('@napi-rs/canvas')
  } catch (cause) {
    throw new Error(
      'Node 无头渲染需要安装可选依赖 @napi-rs/canvas；也可向 StickerGenerator 或 AvatarGenerator 传入自定义 canvas runtime。',
      { cause },
    )
  }
}

/** 两个生成器共用 Node 画布后端，浏览器入口不引用此模块。 */
export function createNapiCanvasRuntime(): Promise<NapiCanvasRuntime> {
  runtimePromise ??= importNapiCanvas().then((canvas) => ({
    createCanvas: (width, height) => canvas.createCanvas(width, height) as unknown as OffscreenCanvas,
    toPngBytes: (runtimeCanvas) => {
      const buffer = (runtimeCanvas as unknown as Canvas).toBuffer(
        'image/png',
      )
      return new Uint8Array(buffer)
    },
    registerFont: (filePath, family) =>
      Boolean(canvas.GlobalFonts.registerFromPath(filePath, family)),
    hasFont: (family) => canvas.GlobalFonts.has(family),
    loadImage: async (source) => (await canvas.loadImage(source)) as unknown as ImageBitmap,
  }))
  return runtimePromise
}
