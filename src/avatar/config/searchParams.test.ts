import { describe, expect, it } from 'vitest'
import {
  controlsToSearch,
  searchToControls,
  validateAvatarSearch,
} from './searchParams'

describe('avatar search params', () => {
  it('round-trips flat string controls', () => {
    const controls = searchToControls({
      t: '前端群',
      st: 'sunset',
      md: 'outline',
      s: '768',
      r: '-8',
      ga: '45',
      fz: '1.12',
      fw: '700',
      lh: '1.24',
      fx: '1',
    })

    expect(controls).toMatchObject({
      text: '前端群',
      style: 'sunset',
      mode: 'outline',
      size: 768,
      rotation: -8,
      gradientAngle: 45,
      fontScale: 1.12,
      fontWeight: 700,
      lineHeight: 1.24,
      flash: true,
      flashStops: 1,
    })
    expect(controlsToSearch(controls)).toEqual({
      t: '前端群',
      st: 'sunset',
      md: 'outline',
      s: '768',
      r: '-8',
      ga: '45',
      fz: '1.12',
      fw: '700',
      lh: '1.24',
      fx: '1',
    })
  })

  it('共享参数读取仍过滤非法值，并保留头像边界与短键限制', () => {
    const controls = searchToControls({
      t: '', st: 'constructor', s: 'Infinity', fz: '0.01', fw: '1200', lh: 'bad', r: '-900', fx: '-1',
    })
    expect(controls).toMatchObject({
      text: '离职', style: 'aurora', size: 512, fontScale: 0.85, fontWeight: 800,
      lineHeight: 1.1, rotation: -180, flash: false, flashStops: 0,
    })
    expect(validateAvatarSearch({ t: '测试', s: 768, ic: 'fa7-solid:check', fx: null, lh: [] }))
      .toEqual({ t: '测试', s: '768' })
  })
})
