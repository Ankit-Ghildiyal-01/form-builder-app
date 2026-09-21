import { useMemo, useRef, useState } from 'react'
import { FillForm } from '../fill/FillForm'
import { FormAlert } from '../fill/FormAlert'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { resolveFieldStates } from '../../lib/conditions'
import { pluralize } from '../../lib/format'
import { createInitialValues } from '../../lib/values'
import { validateForm, type ValidationError } from '../../lib/validation'
import type { FieldConfig, FieldId, FieldValue } from '../../types'
import './PreviewModal.css'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  fields: FieldConfig[]
}

/**
 * The builder's live preview, mounting the real `FillForm` rather than a
 * simplified rendering, so what a builder tests here is what a filler gets.
 * The only difference is that nothing is stored.
 */
export function PreviewModal({ open, onClose, title, fields }: PreviewModalProps) {
  const displayTitle = title.trim() === '' ? 'Untitled form' : title

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preview"
      description={`What a filler sees for “${displayTitle}”. Nothing entered here is saved.`}
      size="lg"
    >
      {fields.length === 0 ? (
        <EmptyState
          icon="layers"
          title="Nothing to preview yet"
          description="Add a field to the form and it will appear here exactly as a filler would see it."
        />
      ) : (
        <PreviewBody fields={fields} onClose={onClose} />
      )}
    </Modal>
  )
}

interface PreviewBodyProps {
  fields: FieldConfig[]
  onClose: () => void
}

/**
 * The preview's interactive half, a separate component so its state dies with
 * the modal: `Modal` renders nothing while closed, so reopening mounts a fresh
 * body with blank values. The reset is structural rather than an effect that
 * wipes state afterwards: no render waterfall, nothing to forget when another
 * piece of state is added.
 *
 * Validation is a button, not an automatic check, so a half-filled preview does
 * not shout at you.
 */
function PreviewBody({ fields, onClose }: PreviewBodyProps) {
  const [values, setValues] = useState<Record<FieldId, FieldValue>>(() =>
    createInitialValues(fields),
  )
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [validated, setValidated] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const states = useMemo(() => resolveFieldStates({ fields, values }), [fields, values])

  const total = fields.length
  const visibleCount = fields.filter((field) => states.get(field.id)?.visible).length
  const requiredCount = fields.filter((field) => states.get(field.id)?.required).length
  const hiddenCount = total - visibleCount

  function handleChange(fieldId: FieldId, value: FieldValue) {
    setValues((current) => ({ ...current, [fieldId]: value }))
    setErrors((current) => current.filter((error) => error.fieldId !== fieldId))
  }

  function focusField(fieldId: FieldId) {
    const control = document.getElementById(`field-${fieldId}`)
    control?.focus()
    control?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  function runValidation() {
    setErrors(validateForm(fields, values, states))
    setValidated(true)
    // The result banner sits above the form, and a long form leaves the button
    // at the bottom of the scroll. Without this the outcome of pressing it can
    // be entirely off screen, which reads as the button doing nothing.
    previewRef.current
      ?.closest('.modal__body')
      ?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="preview" ref={previewRef}>
      <FormAlert errors={errors} onSelect={focusField} />

      {validated && errors.length === 0 && (
        <p className="preview__passed" role="status">
          <Icon name="check" size={15} />
          <span>Validation passed. Every visible required field has a value.</span>
        </p>
      )}

      <FillForm fields={fields} values={values} errors={errors} onChange={handleChange} />

      <div className="preview__bar">
        <p className="preview__stats">
          <span>
            <strong>{visibleCount}</strong> of {total} {pluralize(total, 'field')} visible
          </span>
          {requiredCount > 0 && (
            <span>
              <strong>{requiredCount}</strong> required
            </span>
          )}
          {hiddenCount > 0 && (
            <span className="preview__stat--hidden">
              <strong>{hiddenCount}</strong> hidden by logic
            </span>
          )}
        </p>
        <span className="preview__bar-actions">
          <Button size="sm" icon="check" onClick={runValidation}>
            Test validation
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </span>
      </div>
    </div>
  )
}
