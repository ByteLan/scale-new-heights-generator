import type { StickerControls } from '../config/defaults'
import { loadIconBitmap } from '../utils/iconLoader'
import { loadStickerFontSources } from './fontStylesheet'
import {
  createImageWorkerClient,
  type ImageWorkerResults,
} from '../../shared/worker/imageWorker'

const client = createImageWorkerClient(
  () => new Worker(new URL('./renderSticker.worker.ts', import.meta.url), { type: 'module' }),
)

export function renderStickerPreview(controls: StickerControls) {
  return requestStickerImage(controls, 'render')
}

export function exportStickerBlob(controls: StickerControls) {
  return requestStickerImage(controls, 'export')
}

function requestStickerImage<K extends keyof ImageWorkerResults>(
  controls: StickerControls,
  type: K,
) {
  return client.request(type, async (worker, id, signal) => {
    const [icon, fonts] = await Promise.all([
      // duotone 图标注入贴纸主色，其余图标忽略该参数。
      loadIconBitmap(controls.icon, controls.envelope.colors[0] ?? '#ffffff'),
      loadStickerFontSources(controls.flavor),
    ])
    if (signal.aborted) {
      icon?.bitmap.close()
      return
    }
    worker.postMessage(
      { type, id, controls, icon, fonts },
      { transfer: icon ? [icon.bitmap] : [] },
    )
  })
}

export function cancelPendingPreviews(): void {
  client.cancel()
}
