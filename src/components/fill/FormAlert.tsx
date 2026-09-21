import { Icon } from '../ui/Icon'
import { pluralize } from '../../lib/format'
import type { ValidationError } from '../../lib/validation'
import './FormAlert.css'

interface FormAlertProps {
  errors: ValidationError[]
  /** Jump to the offending field. */
  onSelect: (fieldId: string) => void
}

/**
 * Summary of every validation failure, shown after a failed submit.
 *
 * Inline errors alone are easy to miss on a long form: the user submits, sees
 * nothing change because the problem is below the fold, and assumes the button
 * is broken. Each entry focuses its field.
 */
export function FormAlert({ errors, onSelect }: FormAlertProps) {
  if (errors.length === 0) return null

  return (
    <div className="form-alert" role="alert">
      <span className="form-alert__icon" aria-hidden="true">
        <Icon name="alert" size={16} />
      </span>
      <div className="form-alert__body">
        <p className="form-alert__title">
          {pluralize(errors.length, 'field needs', 'fields need')} attention
        </p>
        <ul className="form-alert__list">
          {errors.map((error) => (
            <li key={error.fieldId}>
              <button
                type="button"
                className="form-alert__link"
                onClick={() => onSelect(error.fieldId)}
              >
                {error.message}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
