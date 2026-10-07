import { Buffer } from 'node:buffer'
import {
  runtimeCanvasToPngBytes,
  setCanvasRuntime,
  type CanvasRuntime,
} from '../shared/render/runtime'
import { createNapiCanvasRuntime } from '../shared/render/node'
import type { TextRenderInput } from '../shared/render/input'
import type { AvatarControls } from './config/defaults'
import { renderAvatar } from './render/avatar'

export type AvatarRenderInput = TextRenderInput<AvatarControls>

export type AvatarGeneratorRuntime = CanvasRuntime

let defaultGeneratorPromise: Promise<AvatarGenerator> | null = null

export { createNapiCanvasRuntime } from '../shared/render/node'

async function defaultGenerator(): Promise<AvatarGenerator> {
  defaultGeneratorPromise ??= createNapiCanvasRuntime().then(
    (runtime) => new AvatarGenerator(runtime),
  )
  return defaultGeneratorPromise
}

export async function renderAvatarToPngBytes(input: AvatarRenderInput): Promise<Uint8Array> {
  return await (await defaultGenerator()).renderPngBytes(input)
}

export async function renderAvatarToBuffer(input: AvatarRenderInput): Promise<Buffer> {
  return await (await defaultGenerator()).renderBuffer(input)
}

export class AvatarGenerator {
  readonly runtime: AvatarGeneratorRuntime

  constructor(runtime: AvatarGeneratorRuntime) {
    this.runtime = runtime
    setCanvasRuntime(runtime)
  }

  async renderPngBytes(input: AvatarRenderInput): Promise<Uint8Array> {
    const result = await renderAvatar(input)
    return await runtimeCanvasToPngBytes(result.canvas)
  }

  async renderBuffer(input: AvatarRenderInput): Promise<Buffer> {
    const bytes = await this.renderPngBytes(input)
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }
}
