import type { FillInputProps } from '../types'
import type { MultiSelectFieldConfig } from '../../types'
import '../shared.css'
import './styles.css'

export function MultiSelectFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<MultiSelectFieldConfig>) {
  /*
    The stored value is a list of option ids. Anything else (a value written by
    an older build, a template whose options were replaced) is read as "nothing
    selected" rather than thrown on, so a stale record still renders.
  */
  const selectedIds = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
  const selected = new Set(selectedIds)

  const max = field.maxSelections
  const atMax = max !== null && selectedIds.length >= max

  // Ticking builds a new array; the value handed in is never mutated in place.
  function toggle(id: string) {
    onChange(
      selected.has(id) ? selectedIds.filter((entry) => entry !== id) : [...selectedIds, id],
    )
  }

  if (field.options.length === 0) {
    return (
      <p className="multiselect-empty" aria-describedby={error ? `${inputId}-error` : undefined}>
        No options configured
      </p>
    )
  }

  /*
    The maximum is enforced here as well as in validation: once it is reached
    the *unselected* boxes lock, so the limit is visible while choosing instead
    of arriving as a message after the fact. Boxes that are already ticked stay
    enabled: a checkbox that refused to be unticked would strand the respondent
    on the limit with no way back down.
  */
  const locked = field.options.map(
    (option) => !selected.has(option.id) && atMax && !disabled,
  )
  const lockedHint =
    max === null ? undefined : `Limit of ${max} reached. Untick one to choose another.`

  /*
    The shell's `<label htmlFor>` points at `inputId`. It goes on the first
    *enabled* box: once the maximum locks everything unticked, the first box is
    often one of them, and a label aimed at a disabled input focuses nothing.
  */
  const anchorIndex = Math.max(locked.indexOf(false), 0)

  return (
    <>
      <div
        className="field-options"
        role="group"
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={Boolean(error)}
      >
        {field.options.map((option, index) => {
          const isSelected = selected.has(option.id)
          const isLocked = locked[index]

          return (
            <label
              key={option.id}
              className={[
                'field-option',
                isSelected ? 'field-option--selected' : '',
                isLocked ? 'field-option--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={isLocked ? lockedHint : undefined}
            >
              <input
                id={index === anchorIndex ? inputId : undefined}
                type="checkbox"
                className="field-option__control"
                checked={isSelected}
                disabled={disabled || isLocked}
                onChange={() => toggle(option.id)}
              />
              <span className="field-option__text">
                <span className="field-option__label">{option.label}</span>
              </span>
            </label>
          )
        })}
      </div>

      {/*
        The count doubles as the explanation for the locked boxes above, so it
        only turns into a limit notice once the maximum is actually reached.
      */}
      <div className={`field-limit${atMax ? ' field-limit--reached' : ''}`}>
        {max === null
          ? `${selectedIds.length} selected`
          : `${selectedIds.length} of ${max} selected`}
      </div>
    </>
  )
}
