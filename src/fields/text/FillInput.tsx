import { AffixedInput } from '../../components/ui/AffixedInput'
import { TextInput } from '../../components/ui/Controls'
import type { FillInputProps } from '../types'
import type { TextFieldConfig } from '../../types'
import '../shared.css'

export function TextFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<TextFieldConfig>) {
  const text = typeof value === 'string' ? value : ''
  const hasAffix = field.prefix !== '' || field.suffix !== ''

  const control = (
    <TextInput
      id={inputId}
      value={text}
      placeholder={field.placeholder}
      disabled={disabled}
      invalid={Boolean(error)}
      aria-describedby={error ? `${inputId}-error` : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  )

  return (
    <>
      {hasAffix ? (
        <AffixedInput
          prefix={field.prefix}
          suffix={field.suffix}
          disabled={disabled}
          invalid={Boolean(error)}
        >
          {control}
        </AffixedInput>
      ) : (
        control
      )}

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
