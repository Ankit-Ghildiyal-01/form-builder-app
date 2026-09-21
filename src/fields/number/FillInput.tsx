import { AffixedInput } from '../../components/ui/AffixedInput'
import { NumberInput } from '../../components/ui/Controls'
import type { FillInputProps } from '../types'
import type { NumberFieldConfig } from '../../types'

export function NumberFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<NumberFieldConfig>) {
  const hasAffix = field.prefix !== '' || field.suffix !== ''

  /*
    `NumberInput` owns the hard part: keeping partial text like `-`, `1.` and an
    emptied field typeable. This module deliberately does not hand it the field's
    `min` / `max`, because that control clamps on blur and the limits are already
    enforced by `lib/validation.ts` with a message. Clamping would rewrite an
    out-of-range answer into a valid one the user never typed and quietly drop
    the error that should have been raised. Whole-number mode follows the same
    setting that decides the exported precision.
  */
  const control = (
    <NumberInput
      id={inputId}
      value={typeof value === 'number' ? value : null}
      onChange={onChange}
      integer={field.decimals === 0}
      disabled={disabled}
      invalid={Boolean(error)}
      aria-describedby={error ? `${inputId}-error` : undefined}
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
    </>
  )
}
