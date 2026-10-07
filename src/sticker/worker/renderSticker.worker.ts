import { renderSticker } from '../render/sticker'
import type { WorkerRequest } from '../config/workerProtocol'
import { installStickerFontSources } from '../render/font'
import { createLatestRenderCache, type ImageWorkerResponse } from '../../shared/worker/imageWorker'
import { postImageWorkerResult } from '../../shared/worker/imageWorkerResult'

const cachedRender = createLatestRenderCache<Awaited<ReturnType<typeof renderSticker>>>()

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, id, controls, icon, fonts } = e.data

  try {
    installStickerFontSources(controls.flavor, fonts)
    const key = JSON.stringify([controls, icon ? icon.colored : null])
    const result = await cachedRender(key, () =>
      renderSticker(controls, icon),
    )
    await postImageWorkerResult(id, type, result, controls.flash, controls.flashStops)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '渲染失败。'
    const response: ImageWorkerResponse = { type: 'error', id, message }
    postMessage(response)
  } finally {
    icon?.bitmap.close()
  }
}
