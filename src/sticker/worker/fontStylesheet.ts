import type { StickerFlavor } from '../config/defaults'
import { ensureStickerFontLoaded, stickerFontDescriptor } from '../render/font'
import { withFontLoadTimeout, type FontFaceSource } from '../render/fontFace'

interface FontStylesheet {
  url: string
  family: string
}

const FONT_STYLESHEETS: Record<StickerFlavor, FontStylesheet> = {
  snh: {
    url: 'https://fonts.bytedance.com/dfd/api/v1/css?family=DOUYINSANSBOLD-GB&display=swap',
    family: 'DOUYINSANSBOLD-GB',
  },
  bs: {
    url: 'https://cn-font.claude-code-best.win/packages/ysbth/dist/优设标题黑/result.css',
    family: 'YouSheBiaoTiHei',
  },
}

const stylesheetPromises = new Map<string, Promise<FontFaceSource[] | undefined>>()

/** 页面保留 CDN CSS；用 CSSOM 读取同一份来源，供 Worker 独立注册字体。 */
export function loadStickerFontSources(flavor: StickerFlavor): Promise<FontFaceSource[] | undefined> {
  const stylesheet = FONT_STYLESHEETS[flavor]
  let promise = stylesheetPromises.get(stylesheet.url)
  if (!promise) {
    promise = readFontStylesheet(stylesheet).catch(() => undefined)
    stylesheetPromises.set(stylesheet.url, promise)
  }
  return promise
}

/** 编辑区和预设菜单优先使用 CDN 字体，本地整库作为回退。 */
export function stickerUiFontFamily(flavor: StickerFlavor): string {
  return `"${FONT_STYLESHEETS[flavor].family}", "${stickerFontDescriptor(flavor).localFamily}", sans-serif`
}

export async function ensureStickerUiFontLoaded(flavor: StickerFlavor, text: string): Promise<void> {
  const sources = await loadStickerFontSources(flavor)
  if (sources) {
    const spec = `bold 16px "${FONT_STYLESHEETS[flavor].family}"`
    try {
      await withFontLoadTimeout(document.fonts.load(spec, text))
      if (document.fonts.check(spec, text)) return
    } catch {
      // CDN 字体失败或超时后才加载本地整库，不重复注册远程字体。
    }
  }
  await ensureStickerFontLoaded(flavor, text)
}

async function readFontStylesheet({ url, family }: FontStylesheet): Promise<FontFaceSource[]> {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.crossOrigin = 'anonymous'
  link.href = url
  const loading = new Promise<void>((resolve, reject) => {
    link.onload = () => resolve()
    link.onerror = () => reject(new Error('Font stylesheet unavailable'))
  })
  document.head.append(link)
  try {
    await withFontLoadTimeout(loading)
    const faces: FontFaceSource[] = []
    for (const rule of link.sheet?.cssRules ?? []) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const faceFamily = rule.style.getPropertyValue('font-family').replace(/^['"]|['"]$/g, '')
      if (faceFamily !== family) continue
      if (rule.style.getPropertyValue('font-style') === 'italic') continue
      // CSSOM parses the declarations; only URL resolution is needed here.
      const source = rule.style.getPropertyValue('src').replace(/url\(["']?([^"')]+)["']?\)/g,
        (_, path: string) => `url("${new URL(path, url).href}")`)
      if (source) faces.push({ source, unicodeRange: rule.style.getPropertyValue('unicode-range') || 'U+0-10FFFF' })
    }
    if (!faces.length) throw new Error('No matching font faces in stylesheet')
    return faces
  } finally {
    if (!link.sheet) link.remove()
  }
}
