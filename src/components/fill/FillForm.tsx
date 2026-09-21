import { useMemo } from 'react'
import { getDefinition } from '../../fields/registry'
import { resolveFieldStates } from '../../lib/conditions'
import { withCalculations } from '../../lib/values'
import type { ValidationError } from '../../lib/validation'
import type { FieldConfig, FieldId, FieldValue } from '../../types'
import { EmptyState } from '../ui/EmptyState'
import { FieldShell } from './FieldShell'
import './FillForm.css'

interface FillFormProps {
  fields: FieldConfig[]
  values: Record<FieldId, FieldValue>
  errors: ValidationError[]
  disabled?: boolean
  onChange: (fieldId: FieldId, value: FieldValue) => void
}

/**
 * The one and only field renderer, mounted by Fill Mode and the builder's
 * preview alike, so a preview can never drift from the real thing.
 *
 * Visibility is resolved here, once, from the whole value map rather than per
 * field: conditions can point at other conditional fields, so the resolution has
 * to see the entire graph at the same time.
 */
export function FillForm({ fields, values, errors, disabled = false, onChange }: FillFormProps) {
  const states = useMemo(() => resolveFieldStates({ fields, values }), [fields, values])

  // Calculations are folded into the value map so every field module, including
  // the calculation's own renderer, receives a plain, ready-to-display value.
  const resolvedValues = useMemo(
    () => withCalculations(fields, values, states),
    [fields, values, states],
  )

  const errorByField = useMemo(() => {
    const map = new Map<FieldId, string>()
    for (const error of errors) map.set(error.fieldId, error.message)
    return map
  }, [errors])

  const visibleFields = fields.filter((field) => states.get(field.id)?.visible)

  if (visibleFields.length === 0) {
    return (
      <EmptyState
        icon="eye-off"
        title="Nothing to show"
        description="Every field in this form is currently hidden by its conditional logic."
      />
    )
  }

  return (
    <div className="fill-form">
      {visibleFields.map((field) => {
        const inputId = `field-${field.id}`
        const error = errorByField.get(field.id) ?? null

        // Resolved per render rather than inside a wrapper component: the input
        // has to be a stable component type or React would remount the control
        // on every keystroke and drop focus.
        const Input = getDefinition(field.type).FillInput

        return (
          <FieldShell
            key={field.id}
            field={field}
            required={states.get(field.id)?.required ?? false}
            error={error}
            inputId={inputId}
          >
            <Input
              field={field}
              value={resolvedValues[field.id] ?? null}
              error={error}
              inputId={inputId}
              disabled={disabled}
              onChange={(value) => onChange(field.id, value)}
            />
          </FieldShell>
        )
      })}
    </div>
  )
}
