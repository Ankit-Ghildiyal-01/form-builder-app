import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell, Page } from '../components/layout/AppShell'
import { MissingRecord } from '../components/layout/MissingRecord'
import { usePrintExport } from '../components/print/usePrintExport'
import { Button, IconButton } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatDateTime, pluralize } from '../lib/format'
import { printModelForInstance } from '../lib/printModel'
import { deleteInstance, useInstancesForTemplate, useTemplate } from '../lib/store'
import { paths } from '../routes'
import type { FormInstance } from '../types'
import './InstancesPage.css'

interface InstancesPageProps {
  templateId: string
}

export function InstancesPage({ templateId }: InstancesPageProps) {
  const template = useTemplate(templateId)
  const instances = useInstancesForTemplate(templateId)
  const navigate = useNavigate()
  const { exportPdf, printPortal } = usePrintExport()
  const [pendingDelete, setPendingDelete] = useState<FormInstance | null>(null)

  if (!template) {
    return (
      <AppShell back={{ label: 'Templates', to: paths.templates }} title="Responses">
        <Page>
          <MissingRecord subject="form" />
        </Page>
      </AppShell>
    )
  }

  return (
    <AppShell
      back={{ label: 'Templates', to: paths.templates }}
      title={template.title}
      subtitle={pluralize(instances.length, 'response')}
      actions={
        <Button
          variant="primary"
          icon="plus"
          onClick={() => navigate(paths.fill(template.id))}
        >
          New response
        </Button>
      }
    >
      <Page>
        {instances.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No responses yet"
            description="Fill this form in to record your first response. Submitted responses are listed here, newest first."
            action={
              <Button
                variant="primary"
                icon="play"
                onClick={() => navigate(paths.fill(template.id))}
              >
                Fill this form
              </Button>
            }
          />
        ) : (
          <ul className="instance-list">
            {instances.map((instance, index) => {
              // The list is newest-first, but a response's number should be its
              // stable position in the submission order.
              const ordinal = instances.length - index

              return (
                <li className="instance-row" key={instance.id}>
                  <Link
                    to={paths.instance(instance.id)}
                    className="instance-row__overlay"
                    aria-label={`Open response ${ordinal}`}
                  />
                  <span className="instance-row__icon" aria-hidden="true">
                    <Icon name="inbox" size={16} />
                  </span>

                  <div className="instance-row__main">
                    <span className="instance-row__title">Response {ordinal}</span>
                    <span className="instance-row__meta">
                      {formatDateTime(instance.submittedAt)}
                      <span className="instance-row__dot" aria-hidden="true">
                        ·
                      </span>
                      {pluralize(instance.visibleFieldIds.length, 'field')}
                    </span>
                  </div>

                  <div className="instance-row__actions">
                    <Button
                      size="sm"
                      icon="download"
                      onClick={() => exportPdf(printModelForInstance(instance))}
                    >
                      PDF
                    </Button>
                    <IconButton
                      icon="trash"
                      label={`Delete response ${ordinal}`}
                      size="sm"
                      variant="danger"
                      onClick={() => setPendingDelete(instance)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete this response?"
          confirmLabel="Delete response"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete) deleteInstance(pendingDelete.id)
            setPendingDelete(null)
          }}
        >
          {pendingDelete && (
            <p className="confirm-copy">
              The response submitted on {formatDateTime(pendingDelete.submittedAt)} will be
              removed. This cannot be undone.
            </p>
          )}
        </ConfirmDialog>

        {printPortal}
      </Page>
    </AppShell>
  )
}
