import { TextInput } from '../../components/ui/Controls'
import type { FillInputProps } from '../types'
import type { DateFieldConfig } from '../../types'

export function DateFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<DateFieldConfig>) {
  const text = typeof value === 'string' ? value : ''

  return (
    <TextInput
      id={inputId}
      /*
        `type="date"` is deliberate: it hands the whole calendar to the browser,
        so this module inherits a real date picker (correct locale formatting,
        keyboard arrow/typed entry, and screen-reader semantics) for zero
        dependencies and no focus-trap code. A hand-rolled popup calendar would
        be strictly worse on every one of those axes.
      */
      type="date"
      value={text}
      // `null` means "no bound configured", and an absent attribute is the only
      // way to express that: `min={undefined}` omits it, whereas `min={null}`
      // would serialise to `min=""` and be read back as the empty string.
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      disabled={disabled}
      invalid={Boolean(error)}
      aria-describedby={error ? `${inputId}-error` : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
