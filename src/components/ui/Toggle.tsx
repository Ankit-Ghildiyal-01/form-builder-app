import { useId } from 'react'
import './Toggle.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Optional second line explaining the consequence of the switch. */
  hint?: string
  disabled?: boolean
}

/**
 * Switch control for boolean config. The native checkbox stays in the DOM
 * (visually replaced) so keyboard and assistive-tech behaviour is free.
 */
export function Toggle({ checked, onChange, label, hint, disabled = false }: ToggleProps) {
  const id = useId()

  return (
    <div className={`toggle${disabled ? ' toggle--disabled' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label className="toggle__label" htmlFor={id}>
        <span className="toggle__track" aria-hidden="true">
          <span className="toggle__thumb" />
        </span>
        <span className="toggle__text">
          <span className="toggle__title">{label}</span>
          {hint && <span className="toggle__hint">{hint}</span>}
        </span>
      </label>
    </div>
  )
}
