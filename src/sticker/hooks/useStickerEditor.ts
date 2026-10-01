import { deriveDepthColor, randomGradientPair, randomVividColors } from '../utils/color'
import { useToolEditor } from '../../shared/hooks/useToolEditor'
import {
  cancelPendingPreviews,
  exportStickerBlob,
  renderStickerPreview,
} from '../worker/stickerWorker'
import {
  defaultGradientAngle,
  type StickerControls,
  type StickerEnvelopeControls,
  STICKER_DEFAULT_OUTLINE_WIDTH,
  type StickerFlavor,
  type StickerPaddingControls,
} from '../config/defaults'
import { STICKER_PRESET_LIST, type StickerPreset } from '../config/presets'
import { controlsToSearch, searchToControls } from '../config/searchParams'

function hasStickerText(controls: StickerControls): boolean {
  return controls.text.length > 0
}

export function useStickerEditor() {
  const editor = useToolEditor({
    tool: 'sticker',
    fromSearch: searchToControls,
    toSearch: controlsToSearch,
    delayMs: 250,
    hasContent: hasStickerText,
    render: renderStickerPreview,
    cancel: cancelPendingPreviews,
    exportImage: exportStickerBlob,
  })
  const { setControls } = editor

  const updateEnvelope = <K extends keyof StickerEnvelopeControls>(
    key: K,
    value: StickerEnvelopeControls[K],
  ) => {
    setControls((c) => ({ ...c, envelope: { ...c.envelope, [key]: value } }))
  }

  const updateFlavor = (flavor: StickerFlavor) => {
    setControls((c) => ({
      ...c,
      flavor,
      envelope: {
        ...c.envelope,
        outlineStrokeWidth: STICKER_DEFAULT_OUTLINE_WIDTH[flavor],
      },
    }))
  }

  const updatePadding = <K extends keyof StickerPaddingControls>(
    key: K,
    value: StickerPaddingControls[K],
  ) => {
    setControls((c) => ({ ...c, padding: { ...c.padding, [key]: value } }))
  }

  const randomizeColors = () => {
    setControls((c) => ({
      ...c,
      envelope:
        c.flavor === 'bs'
          ? {
              ...c.envelope,
              colors: randomGradientPair(c.envelope.colors[0] ?? '#76baf4'),
              gradientAngle: defaultGradientAngle(c.icon),
            }
          : {
              ...c.envelope,
              colors: randomVividColors(c.envelope.colors[0] ?? '#76baf4'),
              gradientAngle: defaultGradientAngle(c.icon),
            },
    }))
  }

  const updateColorAt = (index: number, value: string) => {
    setControls((c) => {
      const colors = [...c.envelope.colors]
      colors[index] = value
      return { ...c, envelope: { ...c.envelope, colors } }
    })
  }

  const addColor = (at?: number) => {
    setControls((c) => {
      if (c.envelope.colors.length >= 3) return c
      const colors = [...c.envelope.colors]
      const index = at ?? colors.length
      // 新增色以相邻色块派生的深色作为初值，避免凭空插入突兀颜色。
      const seed = colors[index - 1] ?? colors[index] ?? '#76baf4'
      colors.splice(index, 0, deriveDepthColor(seed))
      return { ...c, envelope: { ...c.envelope, colors } }
    })
  }

  const removeColor = (index: number) => {
    setControls((c) => {
      if (c.envelope.colors.length <= 1) return c
      const colors = c.envelope.colors.filter((_, i) => i !== index)
      return { ...c, envelope: { ...c.envelope, colors } }
    })
  }

  const applyPreset = (preset: StickerPreset) => {
    setControls((c) => ({
      ...c,
      text: preset.text,
      flavor: preset.flavor,
      icon: preset.icon,
      iconTilt: preset.iconTilt,
      shadow: { ...c.shadow, opacity: preset.shadowOpacity },
      envelope: {
        ...c.envelope,
        colors: preset.colors,
        gradientAngle: preset.gradientAngle,
        outlineStrokeWidth: preset.outlineStrokeWidth,
        edgeWidth: preset.edgeWidth,
        edgeOpacity: preset.edgeOpacity,
      },
    }))
  }

  const applyPresetText = (value: string) => {
    const preset = STICKER_PRESET_LIST.find((p) => p.text === value)
    if (preset) applyPreset(preset)
  }

  return {
    ...editor,
    updateFlavor,
    updateEnvelope,
    updatePadding,
    randomizeColors,
    updateColorAt,
    addColor,
    removeColor,
    applyPresetText,
  }
}

export type StickerEditor = ReturnType<typeof useStickerEditor>
