import {
  createSearchReader,
  createSearchWriter,
  formatSearchNumber,
  validateStringSearch,
  type SearchRecord,
} from '../../shared/config/searchParams'
import {
  DEFAULT_STICKER_CONTROLS,
  normalizeStickerControls,
  STICKER_DEFAULT_OUTLINE_WIDTH,
  STICKER_DEFAULT_MERGE_GRADIENT,
  type StickerControls,
} from './defaults'

// 控件的扁平短键 query 表示。只输出与默认值不同的项，让可分享的 URL 保持紧凑。
export type StickerSearch = SearchRecord

export function controlsToSearch(controls: StickerControls): StickerSearch {
  const defaults = DEFAULT_STICKER_CONTROLS
  const { search, put } = createSearchWriter()

  const putColor = (key: string, value: string, fallback: string) => {
    put(key, value.replace('#', ''), fallback.replace('#', ''))
  }
  // 渐变颜色数组：连字符拼接去掉 # 的 HEX（如 `abcdef-112233`）。
  const putColors = (key: string, value: string[], fallback: string[]) => {
    const encode = (list: string[]) => list.map((c) => c.replace('#', '')).join('-')
    const encoded = encode(value)
    put(key, encoded, encode(fallback))
  }

  put('t', controls.text, defaults.text)
  put('fl', controls.flavor, defaults.flavor)
  put('ic', controls.icon, defaults.icon)
  put('fs', controls.fontSize, defaults.fontSize)
  put('ls', controls.letterSpacing, defaults.letterSpacing)
  put('lh', controls.lineHeight, defaults.lineHeight)
  put('ao', controls.alternatingOffset, defaults.alternatingOffset)
  put('pk', controls.peak, defaults.peak)
  put('tl', controls.tilt, defaults.tilt)
  put('it', controls.iconTilt, defaults.iconTilt)
  put('mg', controls.mergeGradient, STICKER_DEFAULT_MERGE_GRADIENT[controls.flavor])
  put('aa', controls.antialiasScale, defaults.antialiasScale)
  if (controls.flash && controls.flashStops > 0) search.fx = formatSearchNumber(controls.flashStops)

  put('sx', controls.shadow.offsetX, defaults.shadow.offsetX)
  put('sy', controls.shadow.offsetY, defaults.shadow.offsetY)
  put('sb', controls.shadow.blur, defaults.shadow.blur)
  putColor('sc', controls.shadow.color, defaults.shadow.color)
  put('so', controls.shadow.opacity, defaults.shadow.opacity)

  put('os', controls.envelope.outlineStrokeWidth, STICKER_DEFAULT_OUTLINE_WIDTH[controls.flavor])
  put('ew', controls.envelope.edgeWidth, defaults.envelope.edgeWidth)
  putColors('gc', controls.envelope.colors, defaults.envelope.colors)
  put('ga', controls.envelope.gradientAngle, defaults.envelope.gradientAngle)
  put('eo', controls.envelope.edgeOpacity, defaults.envelope.edgeOpacity)

  put('px', controls.padding.x, defaults.padding.x)
  put('py', controls.padding.y, defaults.padding.y)

  return search
}

export function searchToControls(search: StickerSearch): StickerControls {
  const { get, number, boolean } = createSearchReader(search)

  const flashStops = number('fx')

  return normalizeStickerControls({
    text: get('t'),
    flavor: get('fl'),
    icon: get('ic'),
    fontSize: number('fs'),
    letterSpacing: number('ls'),
    lineHeight: number('lh'),
    alternatingOffset: number('ao'),
    peak: boolean('pk'),
    tilt: boolean('tl'),
    iconTilt: boolean('it'),
    mergeGradient: boolean('mg'),
    antialiasScale: number('aa'),
    flash: flashStops !== undefined && flashStops > 0,
    flashStops,
    shadow: {
      offsetX: number('sx'),
      offsetY: number('sy'),
      blur: number('sb'),
      color: decodeColor(get('sc')),
      opacity: number('so'),
    },
    envelope: {
      outlineStrokeWidth: number('os'),
      edgeWidth: number('ew'),
      colors: decodeColors(get('gc')),
      gradientAngle: number('ga'),
      edgeOpacity: number('eo'),
    },
    padding: {
      x: number('px'),
      y: number('py'),
    },
  })
}

export { validateStringSearch as validateStickerSearch }

function decodeColor(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  return `#${value}`
}

// 解析连字符拼接的渐变颜色 HEX 列表；空则返回 undefined 让 normalize 回退默认。
function decodeColors(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined
  const colors = value
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `#${part}`)
  return colors.length > 0 ? colors : undefined
}
