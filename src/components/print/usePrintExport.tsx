import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PrintModel } from '../../lib/printModel'
import { PrintDocument } from './PrintDocument'

interface PrintExport {
  /** Hand the document the browser should turn into a PDF. */
  exportPdf: (model: PrintModel) => void
  /** Mount inside the component that owns the export button. */
  printPortal: ReactNode
}

/**
 * Drives the browser-native PDF export: put the document in `#print-root`, let
 * the browser lay it out, then open the print dialog, where "Save as PDF" makes
 * the file. No PDF library and no popup window, so pop-up blockers cannot get in
 * the way.
 *
 * The delay before `window.print()` is load-bearing: the dialog snapshots the
 * page synchronously, and firing in the same frame as the first paint can
 * capture it mid-layout. Tearing down on `afterprint` alone is not enough, so it
 * also happens straight after the call, for browsers that never fire it.
 */
export function usePrintExport(): PrintExport {
  const [model, setModel] = useState<PrintModel | null>(null)

  /*
    The print stylesheet swaps the app for the document and keys that swap off
    this class. Unconditionally, a user pressing Ctrl+P on the templates list
    would get a blank sheet: `#root` hidden with `#print-root` empty. Declared
    before the effect that opens the dialog, so the class is already on the
    document when `window.print()` reads the page.
  */
  useEffect(() => {
    const rootElement = document.documentElement
    rootElement.classList.toggle('print-export', model !== null)
    return () => rootElement.classList.remove('print-export')
  }, [model])

  useEffect(() => {
    if (!model) return

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      setModel(null)
    }

    window.addEventListener('afterprint', finish)

    // 60ms is enough for layout and font metrics to settle in practice while
    // staying below the threshold where the click feels unresponsive.
    const timer = window.setTimeout(() => {
      window.print()
      // Browsers that block until the dialog closes land here immediately.
      window.setTimeout(finish, 0)
    }, 60)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', finish)
    }
  }, [model])

  const printRoot = typeof document === 'undefined' ? null : document.getElementById('print-root')

  return {
    exportPdf: setModel,
    printPortal: model && printRoot ? createPortal(<PrintDocument model={model} />, printRoot) : null,
  }
}
