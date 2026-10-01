import { searchRecordKey } from '../../shared/utils/tool'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STICKER_CONTROLS } from './defaults'
import {
  controlsToSearch,
  searchToControls,
  validateStickerSearch,
} from './searchParams'

describe('searchParams', () => {
  it('omits values equal to the defaults', () => {
    expect(controlsToSearch(DEFAULT_STICKER_CONTROLS)).toEqual({})
  })

  it('emits short keys only for changed values', () => {
    const search = controlsToSearch({
      ...DEFAULT_STICKER_CONTROLS,
      text: '测试',
      flavor: 'bs',
      antialiasScale: 5,
      envelope: { ...DEFAULT_STICKER_CONTROLS.envelope, colors: ['#abcdef'] },
    })

    expect(search).toEqual({
      t: '测试',
      fl: 'bs',
      mg: '0',
      aa: '5',
      os: '20',
      gc: 'abcdef',
    })
  })

  it('round-trips a customized control set', () => {
    const controls = {
      ...DEFAULT_STICKER_CONTROLS,
      text: '高峰\n不常有',
      flavor: 'bs' as const,
      mergeGradient: true,
      icon: 'mdi:rocket',
      fontSize: 260,
      lineHeight: 1.4,
      antialiasScale: 5,
      flash: true,
      flashStops: 1,
      peak: false,
      iconTilt: false,
      envelope: {
        ...DEFAULT_STICKER_CONTROLS.envelope,
        colors: ['#112233', '#445566', '#778899'],
        gradientAngle: 90,
      },
      padding: { x: 40, y: 60 },
    }

    const restored = searchToControls(controlsToSearch(controls))
    expect(restored).toEqual(controls)
  })

  it('falls back to defaults for missing keys', () => {
    expect(searchToControls({})).toEqual(DEFAULT_STICKER_CONTROLS)
  })

  it('按风味选择默认区域，分享链接可覆盖合并渐变', () => {
    expect(searchToControls({}).mergeGradient).toBe(false)
    expect(searchToControls({ fl: 'bs' }).mergeGradient).toBe(true)
    expect(searchToControls({ fl: 'bs', mg: '0' }).mergeGradient).toBe(false)
    expect(searchToControls({ mg: '1' }).mergeGradient).toBe(true)
    expect(controlsToSearch({ ...DEFAULT_STICKER_CONTROLS, mergeGradient: true }).mg).toBe('1')
    const bs = searchToControls({ fl: 'bs' })
    expect(controlsToSearch(bs).mg).toBeUndefined()
    expect(controlsToSearch({ ...bs, mergeGradient: false }).mg).toBe('0')
  })

  it('coerces numbers to strings during validation', () => {
    expect(validateStickerSearch({ fs: 200, t: '嗨', bad: null })).toEqual({
      fs: '200',
      t: '嗨',
    })
  })

  it('URL 同步区分文案内的分隔符，参数顺序不影响状态', () => {
    expect(searchRecordKey({ t: '测试&gc=ff0000', ic: 'fa7-solid:check' }))
      .not.toBe(searchRecordKey({ t: '测试', gc: 'ff0000', ic: 'fa7-solid:check' }))
    expect(searchRecordKey({ t: '测试=?&', gc: 'aabbcc' }))
      .toBe(searchRecordKey({ gc: 'aabbcc', t: '测试=?&' }))
  })
})
