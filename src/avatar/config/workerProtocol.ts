import type { ImageWorkerRequest } from '../../shared/worker/imageWorker'
import type { AvatarControls } from './defaults'

export type AvatarWorkerRequest = ImageWorkerRequest<AvatarControls>
