interface PreviewBase {
  width: number
  height: number
  mime: string
  extension: string
}

export type PreviewResult =
  | (PreviewBase & { kind: 'bitmap'; bitmap: ImageBitmap })
  | (PreviewBase & { kind: 'blob'; blob: Blob })

export interface ImageFileResult {
  blob: Blob
  mime: string
  extension: string
}

export interface ImageWorkerResults {
  render: PreviewResult
  export: ImageFileResult
}

export interface ImageWorkerRequest<T> {
  type: keyof ImageWorkerResults
  id: number
  controls: T
}

export function disposePreview(preview: PreviewResult | null): void {
  if (preview?.kind === 'bitmap') preview.bitmap.close()
}

export type ImageWorkerResponse =
  | ({ type: 'render-result'; id: number } & PreviewResult)
  | ({ type: 'export-result'; id: number } & ImageFileResult)
  | { type: 'error'; id: number; message: string }

interface PendingRequest {
  id: number
  kind: keyof ImageWorkerResults
  abandoned: boolean
  preparing: boolean
  controller: AbortController
  send: (worker: Worker, id: number, signal: AbortSignal) => void | Promise<void>
  resolve: (value: PreviewResult | ImageFileResult) => void
  reject: (reason: Error) => void
}

export function createImageWorkerClient(createWorker: () => Worker) {
  let worker: Worker | null = null
  let nextId = 0
  let active: PendingRequest | null = null
  let queue: PendingRequest[] = []

  const pump = () => {
    if (active || queue.length === 0) return
    // 导出对应用户操作时的参数快照，不随编辑取消。
    const exportIndex = queue.findIndex((request) => request.kind === 'export')
    const request = queue.splice(Math.max(0, exportIndex), 1)[0]
    active = request
    try {
      if (!worker) {
        worker = createWorker()
        worker.onmessage = (event: MessageEvent<ImageWorkerResponse>) => {
          const data = event.data
          if (!active || data.id !== active.id) {
            if (data.type === 'render-result' && data.kind === 'bitmap') data.bitmap.close()
            return
          }
          const finished = active
          active = null
          if (finished.abandoned) {
            if (data.type === 'render-result' && data.kind === 'bitmap') data.bitmap.close()
          } else if (data.type === 'error') {
            finished.reject(new Error(data.message))
          } else {
            finished.resolve(responsePayload(data))
          }
          pump()
        }
        const failWorker = () => {
          worker?.terminate()
          worker = null
          active?.controller.abort()
          active?.reject(new Error('Image worker failed'))
          active = null
          for (const queued of queue) queued.reject(new Error('Image worker failed'))
          queue = []
        }
        worker.onerror = failWorker
        worker.onmessageerror = failWorker
      }
      const sending = request.send(worker, request.id, request.controller.signal)
      if (!sending) request.preparing = false
      void Promise.resolve(sending)
        .then(() => {
          request.preparing = false
        })
        .catch((error: unknown) => {
          if (active !== request) return
          active = null
          request.reject(error instanceof Error ? error : new Error(String(error)))
          pump()
        })
    } catch (error) {
      active = null
      request.reject(error instanceof Error ? error : new Error(String(error)))
      pump()
    }
  }

  const cancel = () => {
    if (active?.kind === 'render' && !active.abandoned) {
      active.abandoned = true
      active.reject(new Error('Cancelled'))
      if (active.preparing) {
        active.controller.abort()
        active = null
      }
    }
    queue = queue.filter((request) => {
      if (request.kind === 'export') return true
      request.reject(new Error('Cancelled'))
      return false
    })
    pump()
  }

  return {
    request<K extends keyof ImageWorkerResults>(
      kind: K,
      // 异步准备资源后，先检查取消信号，再发送请求和转移资源。
      send: PendingRequest['send'],
    ): Promise<ImageWorkerResults[K]> {
      if (kind === 'render') cancel()
      return new Promise<ImageWorkerResults[K]>((resolve, reject) => {
        queue.push({
          id: nextId++,
          kind,
          send,
          abandoned: false,
          preparing: true,
          controller: new AbortController(),
          resolve: resolve as (value: PreviewResult | ImageFileResult) => void,
          reject,
        })
        pump()
      })
    },
    cancel,
  }
}

/** 只缓存最近一次结果，同时复用进行中的渲染。 */
export function createLatestRenderCache<T>() {
  let latest: { key: string; value: Promise<T> } | undefined
  return (key: string, render: () => Promise<T>): Promise<T> => {
    if (latest?.key === key) return latest.value
    const entry = { key, value: Promise.resolve().then(render) }
    latest = entry
    void entry.value.catch(() => {
      if (latest === entry) latest = undefined
    })
    return entry.value
  }
}

function responsePayload(
  response: Exclude<ImageWorkerResponse, { type: 'error' }>,
): PreviewResult | ImageFileResult {
  if (response.type === 'render-result') return response
  return {
    blob: response.blob,
    mime: response.mime,
    extension: response.extension,
  }
}
