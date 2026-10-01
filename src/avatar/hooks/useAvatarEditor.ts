import { controlsToSearch, searchToControls } from '../config/searchParams'
import type { AvatarControls } from '../config/defaults'
import {
  cancelPendingAvatarPreviews,
  exportAvatarBlob,
  renderAvatarPreview,
} from '../worker/avatarWorker'
import { useToolEditor } from '../../shared/hooks/useToolEditor'

export function useAvatarEditor() {
  return useToolEditor({
    tool: 'avatar',
    fromSearch: searchToControls,
    toSearch: controlsToSearch,
    delayMs: 180,
    hasContent: hasAvatarContent,
    render: renderAvatarPreview,
    cancel: cancelPendingAvatarPreviews,
    exportImage: exportAvatarBlob,
  })
}

function hasAvatarText(text: string): boolean {
  return text.replace(/\r\n|\r|\n/g, '').length > 0
}

function hasAvatarContent(controls: AvatarControls): boolean {
  return hasAvatarText(controls.text)
}

export type AvatarEditor = ReturnType<typeof useAvatarEditor>
