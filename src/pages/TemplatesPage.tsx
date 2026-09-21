import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '../components/layout/AppShell'
import { Button, IconButton } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatRelative, pluralize } from '../lib/format'
import { deleteTemplate, saveTemplate, useInstanceCounts, useTemplates } from '../lib/store'
import { paths } from '../routes'
import type { FormTemplate } from '../types'
import './TemplatesPage.css'

export function TemplatesPage() {
  const templates = useTemplates()
  const counts = useInstanceCounts()
  const navigate = useNavigate()
  const [pendingDelete, setPendingDelete] = useState<FormTemplate | null>(null)

  /**
   * A template row is only written to storage when the builder saves. Starting
   * a new form therefore creates nothing, so abandoning the builder leaves no
   * empty husks behind to clean up.
   */
  function startNewResponse(template: FormTemplate) {
    // Make sure the latest edits are on disk before a response is captured
    // against this version of the form.
    saveTemplate(template)
    navigate(paths.fill(template.id))
  }

  function confirmDelete() {
    if (pendingDelete) deleteTemplate(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <Page wide>
      <div className="page-heading">
        <div>
          <h2 className="page-heading__title">Templates</h2>
          <p className="page-heading__description">
            Design a form once, then fill it in as many times as you need.
          </p>
        </div>
        {templates.length !== 0 && <Button
          variant="primary"
          icon="plus"
          onClick={() => navigate(paths.newTemplate)}
        >
          New template
        </Button>}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon="grid"
          title="No templates yet"
          description="Create your first form, then add fields from the palette : text, numbers, dates, single and multi select, file uploads, section headers and calculated values."
          action={
            <Button variant="primary" icon="plus" onClick={() => navigate(paths.newTemplate)}>
              New template
            </Button>
          }
        />
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <article className="template-card" key={template.id}>
              {/* A full-card link keeps "click anywhere" behaviour while leaving
                  the card's real buttons independently focusable above it. */}
              <Link
                to={paths.builder(template.id)}
                className="template-card__overlay"
                aria-label={`Edit ${template.title}`}
              />
              <div className="template-card__content">
                <h3 className="template-card__title">{template.title}</h3>
                <p className="template-card__description">
                  {template.description || 'No description'}
                </p>
                <dl className="template-card__meta">
                  <div className="template-card__metric">
                    <dt>Fields</dt>
                    <dd>{template.fields.length}</dd>
                  </div>
                  <div className="template-card__metric">
                    <dt>Responses</dt>
                    <dd>{counts.get(template.id) ?? 0}</dd>
                  </div>
                  <div className="template-card__metric">
                    <dt>Modified</dt>
                    <dd>{formatRelative(template.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              <footer className="template-card__footer">
                <Button size="sm" icon="play" onClick={() => startNewResponse(template)}>
                  New response
                </Button>
                <Link
                  to={paths.instances(template.id)}
                  className="template-card__link"
                >
                  <Icon name="inbox" size={15} />
                  <span>Responses</span>
                </Link>
                <IconButton
                  icon="trash"
                  label={`Delete ${template.title}`}
                  size="sm"
                  variant="danger"
                  onClick={() => setPendingDelete(template)}
                />
              </footer>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this template?"
        confirmLabel="Delete template"
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      >
        {pendingDelete && (
          <p className="confirm-copy">
            <strong>{pendingDelete.title}</strong> will be deleted, along with{' '}
            {pluralize(counts.get(pendingDelete.id) ?? 0, 'saved response')}. This cannot be
            undone.
          </p>
        )}
      </ConfirmDialog>
    </Page>
  )
}
