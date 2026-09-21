/**
 * Shared form controls.
 *
 * `NumberInput` keeps the raw text in local state: parsing on every keystroke
 * makes it impossible to type `-`, `1.` or to clear the field, because those all
 * parse to `NaN` or `0` and get written straight back into `value`. Only valid
 * input propagates, and the text re-syncs when the value changes from outside.
 */

import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from './Icon'
import './Controls.css'

/* ---- Text input ---------------------------------------------------------- */

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function TextInput({ invalid = false, className, ...rest }: TextInputProps) {
  return (
    <input
      className={['control', invalid ? 'control--invalid' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
}

/* ---- Textarea ------------------------------------------------------------ */

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function TextArea({ invalid = false, className, ...rest }: TextAreaProps) {
  return (
    <textarea
      className={['control', 'control--textarea', invalid ? 'control--invalid' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
}

/* ---- Select -------------------------------------------------------------- */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid = false, className, children, ...rest }: SelectProps) {
  return (
    <span className="select-wrap">
      <select
        className={['control', 'control--select', invalid ? 'control--invalid' : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </select>
      <span className="select-wrap__chevron" aria-hidden="true">
        <Icon name="chevron-down" size={15} />
      </span>
    </span>
  )
}

/* ---- Number input -------------------------------------------------------- */

interface NumberInputProps {
  value: number | null
  onChange: (value: number | null) => void
  id?: string
  placeholder?: string
  min?: number
  max?: number
  /** Round to a whole number and clamp to min/max when the field loses focus. */
  integer?: boolean
  disabled?: boolean
  invalid?: boolean
  onBlur?: () => void
  'aria-describedby'?: string
}

function toText(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(value)
}

export function NumberInput({
  value,
  onChange,
  id,
  placeholder,
  min,
  max,
  integer = false,
  disabled = false,
  invalid = false,
  onBlur,
  ...aria
}: NumberInputProps) {
  const [text, setText] = useState(() => toText(value))
  const lastValue = useRef<number | null>(value)

  // Adopt external changes without clobbering in-progress typing.
  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value
      setText(toText(value))
    }
  }, [value])

  function handleChange(next: string) {
    setText(next)

    if (next.trim() === '') {
      lastValue.current = null
      onChange(null)
      return
    }

    const parsed = Number(next)
    // Ignore transient non-numbers ("-", "1.", "1e") so typing stays possible.
    if (Number.isNaN(parsed)) return
    if (integer && !Number.isInteger(parsed)) return

    lastValue.current = parsed
    onChange(parsed)
  }

  function handleBlur() {
    const trimmed = text.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)

    if (parsed === null || Number.isNaN(parsed)) {
      setText(toText(value))
    } else {
      let normalized = integer ? Math.round(parsed) : parsed
      if (min !== undefined && normalized < min) normalized = min
      if (max !== undefined && normalized > max) normalized = max
      if (normalized !== value) {
        lastValue.current = normalized
        onChange(normalized)
      }
      setText(toText(normalized))
    }

    onBlur?.()
  }

  return (
    <input
      id={id}
      // `text` rather than `number`: the browser's own number input fights
      // partial values and hides characters like a lone minus sign.
      type="text"
      inputMode="decimal"
      className={`control${invalid ? ' control--invalid' : ''}`}
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
      {...aria}
    />
  )
}

/* ---- Segmented control --------------------------------------------------- */

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Accessible group name; these are visually unlabelled. */
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`segmented__item${active ? ' segmented__item--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---- Layout helpers ------------------------------------------------------ */

interface FormRowProps {
  label: string
  children: ReactNode
  hint?: ReactNode
  /** Links the label to its control. */
  htmlFor?: string
  /** Renders a control and its inline validation message as a group. */
  error?: string | null
}

export function FormRow({ label, children, hint, htmlFor, error }: FormRowProps) {
  return (
    <div className={`form-row${error ? ' form-row--invalid' : ''}`}>
      <label className="form-row__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="form-row__hint">{hint}</p>}
      {error && <p className="form-row__error">{error}</p>}
    </div>
  )
}

/** Two side-by-side controls that read as a single "Range" row. */
export function FormRowPair({ children }: { children: ReactNode }) {
  return <div className="form-row__pair">{children}</div>
}
