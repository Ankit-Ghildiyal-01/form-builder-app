import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell, Page } from '../components/layout/AppShell'
import { MissingRecord } from '../components/layout/MissingRecord'
import { FillForm } from '../components/fill/FillForm'
import { FormAlert } from '../components/fill/FormAlert'
import { usePrintExport } from '../components/print/usePrintExport'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { resolveFieldStates, visibleValues } from '../lib/conditions'
import { formatDateTime, pluralize } from '../lib/format'
import { createId } from '../lib/id'
import { printModelForInstance } from '../lib/printModel'
import { saveInstance, useInstanceCounts, useTemplate } from '../lib/store'
import { validateForm, type ValidationError } from '../lib/validation'
import { createInitialValues, withCalculations } from '../lib/values'
import { paths } from '../routes'
import type { FieldId, FieldValue, FormInstance } from '../types'
import './FillPage.css'

interface FillPageProps {
  templateId: string
}

export function FillPage({ templateId }: FillPageProps) {
  const template = useTemplate(templateId)
  const counts = useInstanceCounts()
  const navigate = useNavigate()
  const { exportPdf, printPortal } = usePrintExport()

  const [values, setValues] = useState<Record<FieldId, FieldValue>>(() =>
    template ? createInitialValues(template.fields) : {},
  )
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitted, setSubmitted] = useState<FormInstance | null>(null)

  if (!template) {
    return (
      <AppShell back={{ label: 'Templates', to: paths.templates }} title="Response">
        <Page>
          <MissingRecord subject="form" />
        </Page>
      </AppShell>
    )
  }

  const responseCount = counts.get(template.id) ?? 0

  function handleChange(fieldId: FieldId, value: FieldValue) {
    setValues((current) => ({ ...current, [fieldId]: value }))
    // Clear a field's error as soon as its value changes; leaving stale errors
    // on screen while the user is actively fixing them reads as broken.
    setErrors((current) =>
      current.some((error) => error.fieldId === fieldId)
        ? current.filter((error) => error.fieldId !== fieldId)
        : current,
    )
  }

  function focusField(fieldId: FieldId) {
    const control = document.getElementById(`field-${fieldId}`)
    control?.focus()
    control?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!template) return

    // Visibility is re-resolved at submit time: conditional logic may have
    // hidden a field that the user had already filled in, and a hidden field
    // must neither be validated nor be stored.
    const states = resolveFieldStates({ fields: template.fields, values })
    const validationErrors = validateForm(template.fields, values, states)

    setErrors(validationErrors)

    if (validationErrors.length > 0) {
      focusField(validationErrors[0].fieldId)
      return
    }

    const resolved = withCalculations(template.fields, values, states)
    const instance: FormInstance = {
      id: createId(),
      templateId: template.id,
      templateTitle: template.title,
      // Snapshot, not a reference: editing the template later must not rewrite
      // what this response says.
      fields: template.fields,
      values: visibleValues(template.fields, resolved, states),
      visibleFieldIds: template.fields
        .filter((field) => states.get(field.id)?.visible)
        .map((field) => field.id),
      submittedAt: new Date().toISOString(),
    }

    saveInstance(instance)
    setSubmitted(instance)
  }

  function fillAnother() {
    if (!template) return
    setValues(createInitialValues(template.fields))
    setErrors([])
    setSubmitted(null)
  }

  const emptyForm = template.fields.length === 0

  return (
    <AppShell
      back={{ label: 'Templates', to: paths.templates }}
      title={template.title}
      subtitle={submitted ? 'Response submitted' : 'New response'}
      actions={
        !emptyForm && (
          <Link to={paths.instances(template.id)} className="fill-page__responses">
            <Icon name="inbox" size={15} />
            <span>{pluralize(responseCount, 'response')}</span>
          </Link>
        )
      }
    >
      <Page>
        {emptyForm ? (
          <EmptyState
            icon="layers"
            title="This form has no fields yet"
            description="Add some fields in the builder before filling it in."
            action={
              <Button
                variant="primary"
                icon="pencil"
                onClick={() => navigate(paths.builder(template.id))}
              >
                Open builder
              </Button>
            }
          />
        ) : submitted ? (
          <div className="submitted">
            <span className="submitted__icon" aria-hidden="true">
              <Icon name="check" size={22} />
            </span>
            <h2 className="submitted__title">Response submitted</h2>
            <p className="submitted__description">
              Saved {formatDateTime(submitted.submittedAt)}. This browser holds the only copy.
              Download the PDF to keep a record of it.
            </p>
            <div className="submitted__actions">
              <Button
                variant="primary"
                icon="download"
                onClick={() => exportPdf(printModelForInstance(submitted))}
              >
                Download PDF
              </Button>
              <Button
                icon="list"
                onClick={() => navigate(paths.instance(submitted.id))}
              >
                View response
              </Button>
              <Button icon="copy" onClick={fillAnother}>
                Fill another
              </Button>
            </div>
          </div>
        ) : (
          <form className="fill-page" onSubmit={handleSubmit} noValidate>
            {template.description && (
              <p className="fill-page__description">{template.description}</p>
            )}

            <FormAlert errors={errors} onSelect={focusField} />

            <FillForm
              fields={template.fields}
              values={values}
              errors={errors}
              onChange={handleChange}
            />

            <div className="fill-page__actions">
              <Button variant="primary" size="md" type="submit" icon="check">
                Submit response
              </Button>
              <span className="fill-page__hint">
                Stored in this browser only. Nothing is uploaded.
              </span>
            </div>
          </form>
        )}

        {printPortal}
      </Page>
    </AppShell>
  )
}
