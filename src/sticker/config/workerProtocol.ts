import type { ImageWorkerRequest } from '../../shared/worker/imageWorker'
import type { RenderIcon } from '../render/types'
import type { StickerControls } from './defaults'
import type { FontFaceSource } from '../render/fontFace'

export interface WorkerRequest extends ImageWorkerRequest<StickerControls> {
  icon: RenderIcon | null
  fonts?: FontFaceSource[]
  interFont?: FontFaceSource
}
