import type { StickerEditor } from '../../hooks/useStickerEditor'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { FieldLabel } from '../../../shared/components/FieldLabel'
import { DEFAULT_STICKER_CONTROLS, type StickerControls } from '../../config/defaults'

type StickerIconFieldProps = Pick<StickerEditor, 'updateControl'> & Pick<StickerControls, 'icon'>

export function StickerIconField({
  icon,
  updateControl,
}: StickerIconFieldProps) {
  return (
    <div className="field icon-field">
      <FieldLabel
        isDirty={icon !== DEFAULT_STICKER_CONTROLS.icon}
        onReset={() => updateControl('icon', DEFAULT_STICKER_CONTROLS.icon)}
      >
        前缀图标
      </FieldLabel>
      <div className="icon-input-wrap">
        <Input
          className="icon-input"
          type="text"
          value={icon}
          placeholder="例如 mdi:rocket"
          onChange={(e) => updateControl('icon', e.target.value)}
        />
        {icon.length > 0 && (
          <Button
            className="icon-clear"
            variant="ghost"
            size="icon"
            type="button"
            title="清空图标"
            onClick={() => updateControl('icon', '')}
          >
            ×
          </Button>
        )}
      </div>
      <a
        className="field-hint"
        href="https://yesicon.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        找图标
      </a>
    </div>
  )
}
