import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { SearchRecord } from '../config/searchParams'
import { saveToolSearch, searchRecordKey, toolUrl, type Tool } from '../utils/tool'
import type { ImageFileResult } from '../worker/imageWorker'
import { useImageActions } from './useImageActions'
import { useRenderedPreview, type UseRenderedPreviewOptions } from './useRenderedPreview'

interface ToolControls {
  text: string
  flash: boolean
}

interface UseToolEditorOptions<T extends ToolControls> extends Omit<UseRenderedPreviewOptions<T>, 'controls'> {
  tool: Tool
  fromSearch: (search: SearchRecord) => T
  toSearch: (controls: T) => SearchRecord
  exportImage: (controls: T) => Promise<ImageFileResult>
}

/** 共用编辑状态、预览、URL 与本地缓存同步；具体控件操作留在工具内。 */
export function useToolEditor<T extends ToolControls>({
  tool, fromSearch, toSearch, delayMs, hasContent, render, cancel, exportImage,
}: UseToolEditorOptions<T>) {
  const search = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const isSimpleMode = search.m === 'simple'
  const currentSearchKey = useMemo(() => searchRecordKey(search), [search])
  const lastWrittenSearchKey = useRef(currentSearchKey)
  const [controls, setControls] = useState(() => fromSearch(search))
  const { renderControls, setRenderControls, preview, previewError, setPreviewError, isRendering } =
    useRenderedPreview({ controls, delayMs, hasContent, render, cancel })

  useEffect(() => {
    saveToolSearch(tool, toSearch(controls))
  }, [tool, toSearch, controls])

  // 浏览器前进、后退或外部链接变化时恢复控件与预览。
  useEffect(() => {
    if (currentSearchKey === lastWrittenSearchKey.current) return
    const nextControls = fromSearch(search)
    setControls(nextControls)
    setRenderControls(nextControls)
    lastWrittenSearchKey.current = currentSearchKey
  }, [currentSearchKey, search, fromSearch, setRenderControls])

  // 预览防抖后再写回 URL，避免连续调整控件刷出历史记录。
  useEffect(() => {
    const nextSearch = toSearch(renderControls)
    if (isSimpleMode) nextSearch.m = 'simple'
    lastWrittenSearchKey.current = searchRecordKey(nextSearch)
    void navigate({ to: '.', search: () => nextSearch, replace: true })
  }, [renderControls, isSimpleMode, toSearch, navigate])

  const hasText = hasContent(controls)
  const controlSearch = toSearch(controls)
  const shareUrl = toolUrl(tool, controlSearch, true)
  const actions = useImageActions({
    tool,
    text: controls.text,
    hasContent: hasText,
    shareUrl,
    exportImage: () => exportImage(controls),
    onError: setPreviewError,
  })

  const updateControl = <K extends keyof T>(key: K, value: T[K]) => {
    setControls((current) => ({ ...current, [key]: value }))
  }

  return {
    controls, setControls, updateControl,
    preview, previewError, isRendering,
    hasText, isSimpleMode, shareUrl,
    editorUrl: toolUrl(tool, controlSearch),
    exportLabel: controls.flash ? '导出 HDR 图' : '导出 PNG',
    ...actions,
  }
}
