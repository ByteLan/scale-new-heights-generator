import { useEffect, useRef, useState } from 'react'
import { copyImageToClipboard } from '../utils/clipboard'
import { generatedFileName } from '../utils/fileName'
import type { Tool } from '../utils/tool'
import type { ImageFileResult } from '../worker/imageWorker'

export type CopiedTarget = 'image' | 'link'

interface ImageActionsOptions {
  tool: Tool
  text: string
  hasContent: boolean
  shareUrl: string
  exportImage: () => Promise<ImageFileResult>
  onError: (message: string) => void
}

export function useImageActions({
  tool,
  text,
  hasContent,
  shareUrl,
  exportImage,
  onError,
}: ImageActionsOptions) {
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState<CopiedTarget | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const flashCopied = (target: CopiedTarget) => {
    clearTimeout(copiedTimer.current)
    setCopied(target)
    copiedTimer.current = setTimeout(() => setCopied(null), 1500)
  }

  const handleExport = async () => {
    if (!hasContent) return
    setIsExporting(true)
    try {
      const result = await exportImage()
      const url = URL.createObjectURL(result.blob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = generatedFileName(tool, text, result.extension)
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : '导出失败。')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyImage = async () => {
    if (!hasContent) return
    try {
      const result = await exportImage()
      const copy = await copyImageToClipboard(result.blob, result.mime)
      if (copy.ok) {
        flashCopied('image')
      } else {
        onError(copy.message ?? '复制失败。')
      }
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : '复制失败。')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      flashCopied('link')
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : '复制链接失败。')
    }
  }

  return { isExporting, copied, handleExport, handleCopyImage, handleCopyLink }
}
