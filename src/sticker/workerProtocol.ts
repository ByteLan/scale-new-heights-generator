import type { StickerControls } from './defaults'

export interface WorkerRenderOptions {
  exportScale?: number
}

export type WorkerRequest =
  | { type: 'render'; id: number; controls: StickerControls; iconBitmap: ImageBitmap | null; exportScale?: number }
  | { type: 'export'; id: number; controls: StickerControls; iconBitmap: ImageBitmap | null; exportScale?: number }

export type WorkerResponse =
  | { type: 'render-result'; id: number; bitmap: ImageBitmap; width: number; height: number }
  | { type: 'export-result'; id: number; blob: Blob }
  | { type: 'error'; id: number; message: string }
