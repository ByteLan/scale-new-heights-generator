import { parseNumber } from './normalize'

export type SearchRecord = Record<string, string>

/** 两个工具共用短键查询参数；空值交给各自的控件归一化处理。 */
export function createSearchReader(search: SearchRecord) {
  const get = (key: string): string | undefined => {
    const value = search[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

  return {
    get,
    number: (key: string) => parseNumber(get(key)),
    boolean: (key: string) => {
      const value = get(key)
      return value === undefined ? undefined : value === '1' || value === 'true'
    },
  }
}

/** 只输出偏离默认值的参数，布尔值用 0/1 保持分享链接紧凑。 */
export function createSearchWriter() {
  const search: SearchRecord = {}
  const put = (key: string, value: string | number | boolean, fallback: string | number | boolean) => {
    if (value !== fallback) search[key] = String(typeof value === 'boolean' ? Number(value) : value)
  }
  return { search, put }
}

export function validateStringSearch(search: Record<string, unknown>, keys?: ReadonlySet<string>): SearchRecord {
  const result: SearchRecord = {}
  for (const [key, value] of Object.entries(search)) {
    if (keys && !keys.has(key)) continue
    if (typeof value === 'string' || typeof value === 'number') result[key] = String(value)
  }
  return result
}

export function formatSearchNumber(value: number): string {
  return String(Number(value.toFixed(2)))
}
