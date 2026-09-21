import type { InputHTMLAttributes } from 'react'
import { Select } from '../../components/ui/Controls'
import type { FillInputProps } from '../types'
import type { SelectFieldConfig, SelectOption } from '../../types'
import '../shared.css'
import './styles.css'

export function SelectFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<SelectFieldConfig>) {
  /*
    One answer, one shape: all three displays store a single option id, with
    `null` for unanswered. Reading it once here stops the branches from drifting
    apart in what they save; only the chrome below is allowed to differ.
  */
  const selectedId = typeof value === 'string' && value !== '' ? value : null
  const describedBy = error ? `${inputId}-error` : undefined

  if (field.options.length === 0) {
    return (
      <p className="select-empty" aria-describedby={describedBy}>
        No options configured
      </p>
    )
  }

  /** The props every option control shares, whichever display renders it. */
  function controlProps(
    option: SelectOption,
    index: number,
  ): InputHTMLAttributes<HTMLInputElement> & { type: 'radio' } {
    return {
      // The shell's `<label htmlFor>` aims at `inputId`, so the first option
      // carries that id and the rest need none.
      id: index === 0 ? inputId : undefined,
      type: 'radio',
      // Anchored to `inputId`, not a fixed string: the builder preview and the
      // fill form can render the same field at once, and one shared name would
      // make them a single radio group stealing each other's selection.
      name: inputId,
      value: option.id,
      checked: option.id === selectedId,
      disabled,
      onChange: () => onChange(option.id),
    }
  }

  if (field.display === 'dropdown') {
    return (
      <Select
        id={inputId}
        value={selectedId ?? ''}
        disabled={disabled}
        invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        // Choosing the placeholder is how you get back to unanswered.
        onChange={(event) =>
          onChange(event.target.value === '' ? null : event.target.value)
        }
      >
        <option value="">Select an option</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }

  if (field.display === 'tiles') {
    return (
      <div
        className="field-tiles"
        role="group"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        {field.options.map((option, index) => {
          const isSelected = option.id === selectedId

          return (
            <label
              key={option.id}
              className={`field-tile${isSelected ? ' field-tile--selected' : ''}${
                disabled ? ' field-tile--disabled' : ''
              }`}
            >
              {/* The radio is visually hidden, not replaced: a `div` with an
                  onClick would look identical and lose tab focus, arrow-key
                  travel, Space to choose and the announced radio role. */}
              <input className="field-tile__input" {...controlProps(option, index)} />
              <span className="field-tile__label">{option.label}</span>
            </label>
          )
        })}
      </div>
    )
  }

  // `radio`: the default, and the fallback for a display value written by a
  // build that knew modes this one does not.
  return (
    <div
      className="field-options"
      role="group"
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
    >
      {field.options.map((option, index) => {
        const isSelected = option.id === selectedId

        return (
          <label
            key={option.id}
            className={`field-option${isSelected ? ' field-option--selected' : ''}${
              disabled ? ' field-option--disabled' : ''
            }`}
          >
            <input className="field-option__control" {...controlProps(option, index)} />
            <span className="field-option__text">
              <span className="field-option__label">{option.label}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
