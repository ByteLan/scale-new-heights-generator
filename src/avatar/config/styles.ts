export interface AvatarColorStop {
  srgb: string
}

interface AvatarStyleAppearance {
  label: string
  stops: [AvatarColorStop, AvatarColorStop]
  solid: string
  gradientAngle?: number
}

function defineStyles<K extends string>(styles: Record<K, AvatarStyleAppearance>) {
  return Object.fromEntries(
    Object.entries<AvatarStyleAppearance>(styles).map(([id, style]) => [id, { id, ...style }]),
  ) as Record<K, AvatarStyleAppearance & { id: K }>
}

/** 头像样式预设表 */
export const AVATAR_STYLES = defineStyles({
  aurora: {
    label: '蓝色',
    stops: [
      { srgb: '#4180FF' },
      { srgb: '#6297FC' },
    ],
    solid: '#3174F6',
  },
  deepBlue: {
    label: '深蓝',
    stops: [
      { srgb: '#427CFE' },
      { srgb: '#2865EF' },
    ],
    solid: '#2E6EF3',
  },
  violet: {
    label: '紫色',
    stops: [
      { srgb: '#935AF5' },
      { srgb: '#7C32FF' },
    ],
    solid: '#7C42F2',
    gradientAngle: 180,
  },
  mint: {
    label: '薄荷',
    stops: [
      { srgb: '#0FDBBE' },
      { srgb: '#0BBFA6' },
    ],
    solid: '#149E90',
    gradientAngle: 180,
  },
  gray: {
    label: '灰色',
    stops: [
      { srgb: '#A8AFBA' },
      { srgb: '#6B7280' },
    ],
    solid: '#6B7280',
    gradientAngle: 180,
  },
  magenta: {
    label: '粉紫',
    stops: [
      { srgb: '#BF40C3' },
      { srgb: '#E69DE5' },
    ],
    solid: '#B93DBD',
  },
  olive: {
    label: '绿黄',
    stops: [
      { srgb: '#2A8930' },
      { srgb: '#A2C10C' },
    ],
    solid: '#2F8D35',
  },
  purplePink: {
    label: '紫粉',
    stops: [
      { srgb: '#9054F1' },
      { srgb: '#E69CE7' },
    ],
    solid: '#8A4CE8',
  },
  sunset: {
    label: '红橙',
    stops: [
      { srgb: '#F44F47' },
      { srgb: '#FF9C4D' },
    ],
    solid: '#F2534C',
  },
  ocean: {
    label: '蓝绿',
    stops: [
      { srgb: '#356FF4' },
      { srgb: '#5FD269' },
    ],
    solid: '#139AC2',
  },
  grape: {
    label: '靛青',
    stops: [
      { srgb: '#5F66F4' },
      { srgb: '#29ABE7' },
    ],
    solid: '#5E63EE',
  },
  lime: {
    label: '绿青',
    stops: [
      { srgb: '#298A35' },
      { srgb: '#2BB0E8' },
    ],
    solid: '#218F35',
  },
  orange: {
    label: '暖橙',
    stops: [
      { srgb: '#FEA033' },
      { srgb: '#EE8109' },
    ],
    solid: '#F57B0C',
  },
  rose: {
    label: '红粉',
    stops: [
      { srgb: '#E43029' },
      { srgb: '#F59ACD' },
    ],
    solid: '#D63898',
  },
})

export type AvatarStyle = keyof typeof AVATAR_STYLES

export interface AvatarStylePreset extends AvatarStyleAppearance {
  id: AvatarStyle
}

/** 头像样式预设列表 */
export const AVATAR_STYLE_LIST = Object.values(AVATAR_STYLES)
