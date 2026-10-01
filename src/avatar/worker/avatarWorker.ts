import type { AvatarControls } from '../config/defaults'
import {
  createImageWorkerClient,
} from '../../shared/worker/imageWorker'

const client = createImageWorkerClient(
  () => new Worker(new URL('./renderAvatar.worker.ts', import.meta.url), { type: 'module' }),
)

export function renderAvatarPreview(controls: AvatarControls) {
  return client.request('render', (worker, id) => {
    worker.postMessage({ type: 'render', id, controls })
  })
}

export function exportAvatarBlob(controls: AvatarControls) {
  return client.request('export', (worker, id) => {
    worker.postMessage({ type: 'export', id, controls })
  })
}

export function cancelPendingAvatarPreviews(): void {
  client.cancel()
}
