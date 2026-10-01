import type { StickerEditor } from '../hooks/useStickerEditor'
import { useLayoutEffect, useRef } from 'react'
import { Textarea } from '../../shared/ui/input'
import { StickerAdvancedControls } from './control-panel/StickerAdvancedControls'
import { StickerIconField } from './control-panel/StickerIconField'
import { StickerPresetToolbar } from './control-panel/StickerPresetToolbar'
import { StickerStyleField } from './control-panel/StickerStyleField'

type StickerControlsPanelProps = Pick<
  StickerEditor,
  'controls' | 'updateControl' | 'updateFlavor' | 'updateEnvelope' | 'updatePadding'
  | 'randomizeColors' | 'updateColorAt' | 'addColor' | 'removeColor' | 'applyPresetText'
>

export function StickerControlsPanel({
  controls,
  updateControl,
  updateFlavor,
  updateEnvelope,
  updatePadding,
  randomizeColors,
  updateColorAt,
  addColor,
  removeColor,
  applyPresetText,
}: StickerControlsPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [controls.text])

  return (
    <section className="panel panel-controls">
      <StickerPresetToolbar
        controls={controls}
        updateEnvelope={updateEnvelope}
        randomizeColors={randomizeColors}
        updateColorAt={updateColorAt}
        addColor={addColor}
        removeColor={removeColor}
        applyPresetText={applyPresetText}
      />

      <Textarea
        ref={textareaRef}
        className="text-input"
        value={controls.text}
        placeholder="输入文本，回车换行"
        rows={2}
        onChange={(e) => updateControl('text', e.target.value)}
      />

      <StickerStyleField
        flavor={controls.flavor}
        updateFlavor={updateFlavor}
      />

      <StickerIconField
        icon={controls.icon}
        updateControl={updateControl}
      />

      <StickerAdvancedControls
        controls={controls}
        updateControl={updateControl}
        updateEnvelope={updateEnvelope}
        updatePadding={updatePadding}
      />
    </section>
  )
}
