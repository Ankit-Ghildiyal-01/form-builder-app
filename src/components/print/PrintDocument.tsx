import { formatDateTime } from '../../lib/format'
import type { PrintModel } from '../../lib/printModel'
import './PrintDocument.css'

interface PrintDocumentProps {
  model: PrintModel
}

/**
 * The document that becomes the PDF.
 *
 * It renders into `#print-root`, outside the React root, so the print stylesheet
 * can hide the whole app with one rule and hand the browser a clean page,
 * the browser's own "Save as PDF" does the generation.
 *
 * Colours are hard-coded black on white rather than taken from the theme, so an
 * export looks the same whoever made it, dark mode or not.
 */
export function PrintDocument({ model }: PrintDocumentProps) {
  const exportedAt = formatDateTime(new Date().toISOString())

  return (
    <article className="print-doc">
      <header className="print-doc__header">
        <p className="print-doc__eyebrow">Form submission</p>
        <h1 className="print-doc__title">{model.title}</h1>
        <p className="print-doc__meta">Submitted {formatDateTime(model.submittedAt)}</p>
      </header>

      <dl className="print-doc__body">
        {model.rows.map((row) =>
          row.kind === 'section' ? (
            <div className="print-doc__section" key={row.id}>
              <h2 className={`print-doc__section-title print-doc__section-title--${row.size}`}>
                {row.label}
              </h2>
            </div>
          ) : (
            <div className="print-doc__row" key={row.id}>
              <dt className="print-doc__label">{row.label}</dt>
              <dd className={`print-doc__value${row.multiline ? ' print-doc__value--block' : ''}`}>
                {row.value}
              </dd>
            </div>
          ),
        )}
      </dl>

      {model.notes.length > 0 && (
        <section className="print-doc__notes">
          {model.notes.map((note) => (
            <p className="print-doc__note" key={note}>
              {note}
            </p>
          ))}
        </section>
      )}

      <footer className="print-doc__footer">
        <span>Exported from Form Builder</span>
        <span>{exportedAt}</span>
      </footer>
    </article>
  )
}
