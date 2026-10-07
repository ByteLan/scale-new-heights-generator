import type { StickerEditor } from '../../hooks/useStickerEditor'
import { Fragment, useState, type CSSProperties } from 'react'
import { Icon } from '@iconify/react'
import { AngleKnob } from '../../../shared/components/AngleKnob'
import { Button } from '../../../shared/ui/button'
import { Select } from '../../../shared/ui/select'
import {
  defaultGradientAngle,
  STICKER_FLAVORS,
  STICKER_DEFAULT_MERGE_GRADIENT,
} from '../../config/defaults'
import {
  STICKER_PRESET_GROUPS,
  STICKER_PRESET_LIST,
  type StickerPreset,
} from '../../config/presets'
import { colorInputValue } from '../../utils/color'
import { ensureStickerUiFontLoaded, stickerUiFontFamily } from '../../worker/fontStylesheet'

async function loadPresetFonts(): Promise<void> {
  await Promise.all(STICKER_FLAVORS.map(async (flavor) => {
    const text = STICKER_PRESET_LIST.filter(preset => preset.flavor === flavor).map(preset => preset.text).join('')
    await ensureStickerUiFontLoaded(flavor, text)
  }))
}

type StickerPresetToolbarProps = Pick<
  StickerEditor,
  'controls' | 'updateEnvelope' | 'randomizeColors' | 'updateColorAt' | 'addColor'
  | 'removeColor' | 'applyPresetText'
>

export function StickerPresetToolbar({
  controls,
  updateEnvelope,
  randomizeColors,
  updateColorAt,
  addColor,
  removeColor,
  applyPresetText,
}: StickerPresetToolbarProps) {
  const [selectedPresetText, setSelectedPresetText] = useState('')
  const activePreset = STICKER_PRESET_LIST.find((p) => p.text === selectedPresetText)
  const presetDirty =
    activePreset !== undefined &&
    (controls.flavor !== activePreset.flavor ||
      controls.icon !== activePreset.icon ||
      controls.iconTilt !== activePreset.iconTilt ||
      controls.mergeGradient !== STICKER_DEFAULT_MERGE_GRADIENT[activePreset.flavor] ||
      controls.envelope.gradientAngle !== activePreset.gradientAngle ||
      controls.envelope.outlineStrokeWidth !== activePreset.outlineStrokeWidth ||
      controls.envelope.colors.join(',') !== activePreset.colors.join(','))

  return (
    <div className="toolbar-row">
      <div className="preset-cell">
        <Select
          className="preset-select"
          contentClassName="preset-select-content"
          viewportClassName="preset-select-viewport"
          value={selectedPresetText}
          placeholder="选择预设文案…"
          onOpenChange={(open) => {
            if (open) void loadPresetFonts().catch(() => undefined)
          }}
          groups={Object.entries(STICKER_PRESET_GROUPS).map(([group, presets]) => ({
            label: group,
            options: presets.map((preset) => ({
              value: preset.text,
              label: <PresetOption preset={preset} />,
            })),
          }))}
          onValueChange={(value) => {
            setSelectedPresetText(value)
            applyPresetText(value)
          }}
        />
        {presetDirty && (
          <Button
            className="preset-reset"
            variant="secondary"
            size="sm"
            type="button"
            title="重置为预设初始参数"
            onClick={() => applyPresetText(activePreset.text)}
          >
            重置
          </Button>
        )}
      </div>

      <div className="color-pair">
        {controls.envelope.colors.map((color, index) => (
          <Fragment key={index}>
            {controls.envelope.colors.length < 3 && (
              <button
                className="swatch-insert"
                type="button"
                aria-label="在此处插入颜色"
                title="在此处插入颜色"
                onClick={() => addColor(index)}
              >
                <Icon icon="tabler:circle-dashed-plus" />
              </button>
            )}
            <div className="color-swatch" style={{ backgroundColor: color }}>
              <input
                type="color"
                value={colorInputValue(color)}
                onChange={(e) => updateColorAt(index, e.target.value)}
              />
              {controls.envelope.colors.length > 1 && (
                <Button
                  className="swatch-remove"
                  variant="secondary"
                  size="icon"
                  type="button"
                  title="移除该颜色"
                  onClick={() => removeColor(index)}
                >
                  ×
                </Button>
              )}
            </div>
          </Fragment>
        ))}
        {controls.envelope.colors.length < 3 && (
          <button
            className="swatch-insert"
            type="button"
            aria-label="在末尾添加颜色"
            title="在末尾添加颜色"
            onClick={() => addColor(controls.envelope.colors.length)}
          >
            <Icon icon="tabler:circle-dashed-plus" />
          </button>
        )}
      </div>

      <Button
        className="icon-btn"
        variant="secondary"
        size="icon"
        type="button"
        title="随机单色、双色或三色配色"
        onClick={randomizeColors}
      >
        🎲
      </Button>
      <AngleKnob
        value={controls.envelope.gradientAngle}
        defaultValue={activePreset ? activePreset.gradientAngle : defaultGradientAngle(controls.icon)}
        onChange={(value) => updateEnvelope('gradientAngle', value)}
      />
    </div>
  )
}

function PresetOption({
  preset,
}: {
  preset: StickerPreset
}) {
  return (
    <span
      className={`preset-option${preset.icon ? '' : ' preset-option-text-only'}`}
      style={{
        '--preset-gradient': `linear-gradient(${preset.gradientAngle}deg, ${preset.colors.join(', ')})`,
      } as CSSProperties}
    >
      {preset.icon ? (
        <Icon
          className="preset-option-icon"
          icon={preset.icon}
          mode="mask"
        />
      ) : null}
      <span
        className={`preset-option-text preset-option-text-${preset.flavor}`}
        style={{
          fontFamily: stickerUiFontFamily(preset.flavor),
        }}
      >{preset.text}</span>
    </span>
  )
}
