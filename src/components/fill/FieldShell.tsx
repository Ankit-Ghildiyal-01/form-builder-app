import type { ReactNode } from 'react'
import { getDefinition } from '../../fields/registry'
import type { FieldConfig } from '../../types'
import './FieldShell.css'

interface FieldShellProps {
  field: FieldConfig
  required: boolean
  error: string | null
  /**
   * Doubles as the label's `htmlFor` and the id the field module uses for its
   * control, so the error element rendered here is the same one the module
   * points at with `aria-describedby`.
   */
  inputId: string
  children: ReactNode
}

/**
 * The caption, required marker and error message around every field.
 *
 * Field modules render only their control; this supplies everything else so
 * that all nine field types share one layout, one error treatment and one
 * accessibility contract.
 *
 * A module may opt out of the caption by declaring `ownsLabel`. The Section
 * Header does, because its label *is* the heading it draws.
 */
export function FieldShell({ field, required, error, inputId, children }: FieldShellProps) {
  const definition = getDefinition(field.type)

  return (
    <div className={`field-shell${error ? ' field-shell--invalid' : ''}`}>
      {!definition.ownsLabel && (
        <label className="field-shell__label" htmlFor={inputId}>
          <span className="field-shell__label-text">{field.label || 'Untitled field'}</span>
          {required && (
            <>
              <span className="field-shell__required" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </label>
      )}

      <div className="field-shell__control">{children}</div>

      {error && (
        <p className="field-shell__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
