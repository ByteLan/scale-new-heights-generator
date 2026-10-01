export interface CanvasRuntime {
  createCanvas: (width: number, height: number) => OffscreenCanvas
  toPngBytes?: (canvas: OffscreenCanvas) => Promise<Uint8Array> | Uint8Array
  /** 已自行注册字体的 runtime 可以省略。 */
  registerFont?: (filePath: string, family: string) => boolean
  /** 用于跳过重复的回退字体注册。 */
  hasFont?: (family: string) => boolean
  /** 需要 Iconify 图标时才使用，浏览器由主线程加载。 */
  loadImage?: (source: Uint8Array | string) => Promise<ImageBitmap> | ImageBitmap
}

const browserRuntime: CanvasRuntime = {
  createCanvas: (width, height) =>
    new OffscreenCanvas(
      Math.max(1, Math.ceil(width)),
      Math.max(1, Math.ceil(height)),
    ),
}

let activeRuntime: CanvasRuntime = browserRuntime

export function setCanvasRuntime(runtime: CanvasRuntime): () => void {
  const previousRuntime = activeRuntime
  activeRuntime = runtime
  return () => {
    activeRuntime = previousRuntime
  }
}

export function createRuntimeCanvas(width: number, height: number): OffscreenCanvas {
  return activeRuntime.createCanvas(
    Math.max(1, Math.ceil(width)),
    Math.max(1, Math.ceil(height)),
  )
}

export async function runtimeCanvasToPngBytes(
  canvas: OffscreenCanvas,
): Promise<Uint8Array> {
  if (activeRuntime.toPngBytes) {
    return activeRuntime.toPngBytes(canvas)
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return new Uint8Array(await blob.arrayBuffer())
}
