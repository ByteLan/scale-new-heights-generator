import {
  createSearchReader,
  createSearchWriter,
  formatSearchNumber,
  validateStringSearch,
  type SearchRecord,
} from '../../shared/config/searchParams'
import { DEFAULT_AVATAR_CONTROLS, normalizeAvatarControls, type AvatarControls } from './defaults'

export type AvatarSearch = SearchRecord

/** 头像 URL query 支持的短键集合 */
const AVATAR_SEARCH_KEYS = new Set(['t', 'st', 'md', 's', 'r', 'ga', 'fz', 'fw', 'lh', 'fx'])

export function controlsToSearch(controls: AvatarControls): AvatarSearch {
  const defaults = DEFAULT_AVATAR_CONTROLS
  const { search, put } = createSearchWriter()

  put('t', controls.text, defaults.text)
  put('st', controls.style, defaults.style)
  put('md', controls.mode, defaults.mode)
  put('s', controls.size, defaults.size)
  put('r', controls.rotation, defaults.rotation)
  put('ga', controls.gradientAngle, defaults.gradientAngle)
  put('fz', controls.fontScale, defaults.fontScale)
  put('fw', controls.fontWeight, defaults.fontWeight)
  put('lh', controls.lineHeight, defaults.lineHeight)
  if (controls.flash && controls.flashStops > 0) search.fx = formatSearchNumber(controls.flashStops)
  return search
}

export function searchToControls(search: AvatarSearch): AvatarControls {
  const { get, number } = createSearchReader(search)

  const flashStops = number('fx')

  return normalizeAvatarControls({
    text: get('t'),
    style: get('st'),
    mode: get('md'),
    size: number('s'),
    rotation: number('r'),
    gradientAngle: number('ga'),
    fontScale: number('fz'),
    fontWeight: number('fw'),
    lineHeight: number('lh'),
    flash: flashStops !== undefined && flashStops > 0,
    flashStops,
  })
}

export function validateAvatarSearch(search: Record<string, unknown>): AvatarSearch {
  return validateStringSearch(search, AVATAR_SEARCH_KEYS)
}
