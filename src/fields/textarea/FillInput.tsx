import { TextArea } from '../../components/ui/Controls'
import type { FillInputProps } from '../types'
import type { TextareaFieldConfig } from '../../types'
import '../shared.css'
import './styles.css'

export function TextareaFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<TextareaFieldConfig>) {
  const text = typeof value === 'string' ? value : ''

  return (
    <>
      <TextArea
        id={inputId}
        className="field-textarea"
        rows={field.rows}
        value={text}
        placeholder={field.placeholder}
        disabled={disabled}
        invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />

      {/*
        Deliberately no `maxLength` attribute: hard-blocking keystrokes would
        make the configured limit invisible. The counter shows the limit and
        validation reports it, which teaches the rule instead of hiding it.
      */}
      {field.maxLength !== null && (
        <div
          className={`field-counter${text.length > field.maxLength ? ' field-counter--over' : ''}`}
        >
          {text.length} / {field.maxLength}
        </div>
      )}
    </>
  )
}
