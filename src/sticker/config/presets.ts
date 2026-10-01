import {
  defaultGradientAngle,
  DEFAULT_STICKER_CONTROLS,
  STICKER_DEFAULT_OUTLINE_WIDTH,
  type StickerFlavor,
} from './defaults'

interface StickerPresetSeed {
  text: string
  /** 渐变颜色停靠点，长度 1~3 */
  colors: string[]
  /** 仅用于极少数覆盖组默认值的场景；大多数预设不要显式写默认值 */
  flavor?: StickerFlavor
  gradientAngle?: number
  outlineStrokeWidth?: number
  icon?: string
  /** 按图标轮廓与参考图的接近程度决定是否随文字斜切 */
  iconTilt?: boolean
  edgeWidth?: number
  edgeOpacity?: number
  shadowOpacity?: number
}

export interface StickerPreset extends StickerPresetSeed {
  flavor: StickerFlavor
  gradientAngle: number
  outlineStrokeWidth: number
  icon: string
  iconTilt: boolean
  edgeWidth: number
  edgeOpacity: number
  shadowOpacity: number
}

type PresetDefaults = Pick<
  StickerPreset,
  | 'flavor'
  | 'gradientAngle'
  | 'outlineStrokeWidth'
  | 'icon'
  | 'iconTilt'
  | 'edgeWidth'
  | 'edgeOpacity'
  | 'shadowOpacity'
>

/** 贴纸预设的全局默认参数 */
const PRESET_DEFAULTS: PresetDefaults = {
  flavor: 'snh',
  gradientAngle: 180,
  outlineStrokeWidth: STICKER_DEFAULT_OUTLINE_WIDTH.snh,
  icon: '',
  iconTilt: true,
  edgeWidth: DEFAULT_STICKER_CONTROLS.envelope.edgeWidth,
  edgeOpacity: DEFAULT_STICKER_CONTROLS.envelope.edgeOpacity,
  shadowOpacity: DEFAULT_STICKER_CONTROLS.shadow.opacity,
}

/** 贴纸预设种子表 */
export const STICKER_PRESETS: Record<string, StickerPresetSeed[]> = {
  字节范: [
    { text: '始终创业', colors: ['#aec71c', '#53ad77'], icon: 'mdi:numeric-1-box' },
    { text: '多元兼容', colors: ['#ffa8c2', '#bf5cdb'], icon: 'tabler:planet' },
    { text: '坦诚清晰', colors: ['#ff9e3d', '#cd6b4c'], icon: 'ph:chat-dots-fill' },
    { text: '求真务实', colors: ['#14d0b9', '#d338bf'], icon: 'fa7-solid:magnifying-glass', iconTilt: false },
    { text: '敢为极致', colors: ['#ed8fc0', '#c55077'], icon: 'ph:star-four-fill', iconTilt: false },
    { text: '共同成长', colors: ['#63ab77', '#1595b0'], icon: 'ph:plant-fill' },
    { text: '领导力', colors: ['#fbb85c', '#c27208'], icon: 'game-icons:torch' },
    { text: '激发创造', colors: ['#2ea6e3', '#4c76af'], icon: 'fluent:lightbulb-filament-24-filled', iconTilt: false },
    { text: '丰富生活', colors: ['#38bbcd', '#3f89a3'], icon: 'fa7-solid:music', iconTilt: false },
  ],
  勇攀高峰: [
    { text: '勇攀高峰', colors: ['#e85621', '#19396f', '#adcfed'] },
    { text: '高峰不常有', colors: ['#148ded', '#afdaff'] },
    { text: '高度优先', colors: ['#e68f1b', '#8bbfff'] },
    { text: '重点突破', colors: ['#d63404', '#8bbfff'] },
    { text: '聚焦', colors: ['#123268', '#3587ee'] },
    { text: '创新推动', colors: ['#2c97e8', '#d5b52d'] },
  ],
  务实浪漫系列: [
    { text: '做了≠做好了', colors: ['#97d52b', '#36e450'], icon: 'fa7-solid:check', iconTilt: false },
    { text: '不断创新', colors: ['#00acf0', '#00d588'], icon: 'streamline:collaborations-idea-solid' },
    { text: '敢想敢干', colors: ['#0acbd5', '#197fe0'], icon: 'fa7-solid:hand-fist' },
    { text: '务实浪漫', colors: ['#8d36e7', '#5b7ff1'], icon: 'solar:star-fall-bold' },
    { text: '梦想实现中', colors: ['#3f8bf4', '#0056bd'], icon: 'fa7-solid:dove' },
    { text: '快速行动', colors: ['#fb24bb', '#fa173e'], icon: 'mdi:run-fast' },
    { text: '一起改变', colors: ['#ffae00', '#ea3151'], icon: 'fluent:people-24-filled', iconTilt: false },
    { text: 'We Are ByteDancers', colors: ['#00bfcc', '#007afb'], icon: 'uil:13-plus' },
  ],
  地震级创意: [
    { text: '承受因果', colors: ['#55aa00', '#ee9900', '#ff5544'] },
    { text: '震感强烈', colors: ['#9944bb', '#ffcc44'] },
    { text: '快速对对', colors: ['#5555ee', '#9933ff'] },
    { text: '语音对一下', colors: ['#11cc66', '#11aabb'], gradientAngle: 90 },
    { text: '怎么衡量\n变蠢7.4%', colors: ['#dd5555', '#9944ee'] },
    { text: '上桌吃饭', colors: ['#ffaa00', '#eecc00'] },
    { text: '顺时针扭', colors: ['#ffaa00', '#ffdd00'] },
    { text: '进豆包公司\n干豆包岗位\n用豆包工作\n享豆包人生', colors: ['#0088ff', '#99ccff'] },
    { text: '为AI而生\n有专属使命', colors: ['#5588dd', '#bb66ee'] },
  ],
}

export type StickerPresetGroup = keyof typeof STICKER_PRESETS

/** 贴纸预设分组级默认参数 */
const PRESET_GROUP_DEFAULTS: Record<string, Partial<PresetDefaults>> = {
  务实浪漫系列: {
    iconTilt: true,
    gradientAngle: 90,
    outlineStrokeWidth: 14,
    edgeWidth: 0,
    edgeOpacity: 0,
  },
  勇攀高峰: {
    gradientAngle: 180,
    outlineStrokeWidth: STICKER_DEFAULT_OUTLINE_WIDTH.snh,
  },
  字节范: {
    flavor: 'bs',
    iconTilt: true,
    outlineStrokeWidth: 10,
    gradientAngle: 90,
  },
}

/** 按分组归一化后的贴纸预设表 */
export const STICKER_PRESET_GROUPS = Object.fromEntries(
  Object.entries(STICKER_PRESETS).map(([group, presets]) => {
    const groupDefaults = PRESET_GROUP_DEFAULTS[group as StickerPresetGroup]
    const normalizedPresets = presets.map((preset) => {
      const icon = preset.icon ?? groupDefaults?.icon ?? PRESET_DEFAULTS.icon
      return {
        ...PRESET_DEFAULTS,
        gradientAngle: defaultGradientAngle(icon),
        ...groupDefaults,
        ...preset,
        icon,
      }
    })
    return [group, normalizedPresets]
  }),
) as Record<StickerPresetGroup, StickerPreset[]>

/** 扁平化后的贴纸预设列表 */
export const STICKER_PRESET_LIST: StickerPreset[] = Object.values(STICKER_PRESET_GROUPS).flat()
