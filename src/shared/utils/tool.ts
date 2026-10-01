/** 工具路由与本地缓存键映射 */
const TOOL = {
  sticker: {
    path: '/',
    storageKey: 'scale-new-heights:sticker-search',
  },
  avatar: {
    path: '/avatar',
    storageKey: 'scale-new-heights:avatar-search',
  },
} as const

export type Tool = keyof typeof TOOL

export function toolUrl(tool: Tool, search: Record<string, string>, simpleMode = false): string {
  const params = new URLSearchParams(search)
  if (simpleMode) params.set('m', 'simple')
  const query = params.toString()
  return `${location.origin}${location.pathname}#${TOOL[tool].path}${query ? `?${query}` : ''}`
}

export function saveToolSearch(tool: Tool, search: Record<string, string>): void {
  try {
    globalThis.localStorage?.setItem(TOOL[tool].storageKey, JSON.stringify(search))
  } catch {
    // 本地缓存不可用时，仍可从 URL 恢复状态。
  }
}

export function loadToolSearch(tool: Tool): Record<string, string> {
  try {
    const raw = globalThis.localStorage?.getItem(TOOL[tool].storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed !== 'object' || parsed === null) return {}

    const search: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') search[key] = value
    }
    return search
  } catch {
    return {}
  }
}

export function searchRecordKey(search: Record<string, string>): string {
  return new URLSearchParams(
    Object.entries(search).sort(([left], [right]) => left.localeCompare(right)),
  ).toString()
}
