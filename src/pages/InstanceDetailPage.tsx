import { AppShell, Page } from '../components/layout/AppShell'
import { MissingRecord } from '../components/layout/MissingRecord'
import { usePrintExport } from '../components/print/usePrintExport'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { formatDateTime } from '../lib/format'
import { printModelForInstance } from '../lib/printModel'
import { useInstance } from '../lib/store'
import { paths } from '../routes'
import './InstanceDetailPage.css'

interface InstanceDetailPageProps {
  instanceId: string
}

/**
 * A saved response, read-only.
 *
 * Rows come from the same `buildPrintModel` the PDF uses, so the screen cannot
 * disagree with the export: option labels, units and date formatting all come
 * from one code path.
 */
export function InstanceDetailPage({ instanceId }: InstanceDetailPageProps) {
  const instance = useInstance(instanceId)
  const { exportPdf, printPortal } = usePrintExport()

  if (!instance) {
    return (
      <AppShell back={{ label: 'Templates', to: paths.templates }} title="Response">
        <Page>
          <MissingRecord
            subject="response"
            description="It may have been deleted, or the link may be out of date."
          />
        </Page>
      </AppShell>
    )
  }

  const model = printModelForInstance(instance)

  return (
    <AppShell
      back={{ label: 'Responses', to: paths.instances(instance.templateId) }}
      title={`Response · ${instance.templateTitle}`}
      subtitle={`Submitted ${formatDateTime(instance.submittedAt)}`}
      actions={
        <Button variant="primary" icon="download" onClick={() => exportPdf(model)}>
          Download PDF
        </Button>
      }
    >
      <Page>
        <article className="response-view">
          <header className="response-view__header">
            <p className="response-view__eyebrow">Saved response</p>
            <h2 className="response-view__title">{instance.templateTitle}</h2>
            <p className="response-view__meta">
              <Icon name="clock" size={14} />
              <span>{formatDateTime(instance.submittedAt)}</span>
            </p>
          </header>

          <dl className="response-view__body">
            {model.rows.map((row) =>
              row.kind === 'section' ? (
                <div className="response-view__section" key={row.id}>
                  <h3 className="response-view__section-title">{row.label}</h3>
                </div>
              ) : (
                <div className="response-view__row" key={row.id}>
                  <dt className="response-view__label">{row.label}</dt>
                  <dd
                    className={`response-view__value${
                      row.multiline ? ' response-view__value--block' : ''
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ),
            )}
          </dl>

          {model.notes.length > 0 && (
            <div className="response-view__notes">
              {model.notes.map((note) => (
                <p key={note}>
                  <Icon name="info" size={14} />
                  <span>{note}</span>
                </p>
              ))}
            </div>
          )}

          <footer className="response-view__footer">
            <span>
              This is a frozen record. Editing the template will not change it.
            </span>
            <Button size="sm" icon="download" onClick={() => exportPdf(model)}>
              Download PDF
            </Button>
          </footer>
        </article>

        {printPortal}
      </Page>
    </AppShell>
  )
}
